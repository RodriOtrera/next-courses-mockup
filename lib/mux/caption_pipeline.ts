import "server-only";

/**
 * Subtitle + translation pipeline for lesson videos.
 *
 * Mux generates subtitles with free Whisper ASR after ingest, Mux Robots
 * translates that track into the other languages, and the resulting plain-text
 * transcript is what Gemini writes the lesson description from.
 *
 * ## Why this file is one idempotent step rather than a chain
 *
 * The Convex original drove each phase with `ctx.scheduler`, re-scheduling
 * itself every few seconds with the attempt number in its arguments. There is
 * no durable scheduler here, so the shape is inverted: `advanceCaptions()`
 * looks at whatever state a lesson is in, moves it as far as it can right now,
 * and returns. Anything may call it, as often as it likes —
 *
 *   - the browser polls it while an upload's UI is open (fast feedback), and
 *   - `/api/cron/captions` sweeps every lesson with unfinished tracks (so
 *     closing the tab doesn't strand a translation half-done).
 *
 * Everything it does is therefore written to be safe to repeat: state only ever
 * moves forward, budgets live on the rows instead of in call arguments, and the
 * unique index on `video_tracks` is what stops two concurrent callers from
 * opening (and paying for) the same Robots job twice.
 *
 * Nothing here throws at the caller. Caption and description failures settle
 * the affected row and leave the video playable — see USER_ERROR.
 */

import { and, eq, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { mux } from "@/lib/mux";
import { gemini } from "@/lib/gemini";
import { modules_items } from "@/lib/db/schema/modules_items";
import {
  TERMINAL_TRACK_STATUSES,
  video_tracks,
  type TrackStatus,
  type VideoTrackSelect,
} from "@/lib/db/schema/video_tracks";
import {
  AUTO_LANGUAGE,
  MAX_TRANSLATION_DURATION_S,
  TRANSCRIPT_MAX_CHARS,
  languageDisplayName,
  unitsToUsd,
} from "./caption_languages";
import {
  createTranslateCaptionsJob,
  describeRobotsError,
  retrieveTranslateCaptionsJob,
} from "./robots";

// -- Budgets ---------------------------------------------------------------
// Wall-clock deadlines rather than attempt counts: an advance can be driven by
// a 5-second browser poll or a 1-minute cron tick, so "how many times have we
// looked" says nothing useful about how long we have waited. Caption work runs
// decoupled from encoding and is slow on a long upload, hence the generosity.

/** Mux ASR, measured from when the track row was created. */
const SOURCE_DEADLINE_MS = 30 * 60_000;
/** A Robots job, measured from when it was created. */
const TRANSLATION_JOB_DEADLINE_MS = 30 * 60_000;
/** Waiting for a translated text track to become playable after upload. */
const TRANSLATION_TRACK_DEADLINE_MS = 15 * 60_000;
/** A row claimed for translation that never received a Robots job id. */
const ORPHANED_CLAIM_DEADLINE_MS = 5 * 60_000;

/** Description generation is best-effort; transient hiccups get retried. */
const DESCRIPTION_MAX_ATTEMPTS = 8;
const DESCRIPTION_BACKOFF_BASE_MS = 5_000;
const DESCRIPTION_BACKOFF_CAP_MS = 60_000;

/** Below this a transcript is silence or a stray word — not worth describing. */
const MIN_TRANSCRIPT_CHARS = 40;
/** How much transcript to hand the model. ~40k chars is ~40 minutes of speech. */
const TRANSCRIPT_PROMPT_MAX_CHARS = 40_000;

const DESCRIPTION_MODEL = "gemini-2.5-flash";

/**
 * Customer-facing failure text.
 *
 * Deliberately says nothing about Mux: the course creator has no account there
 * and no way to act on "Mux returned 403". Provider detail — status codes,
 * dashboard links, scope hints — goes to `console.warn` for the operator
 * instead. Keep both halves in sync when adding a failure mode.
 */
const USER_ERROR = {
  subtitles: "No se pudieron generar los subtitulos de este video.",
  subtitlesSlow: "Los subtitulos estan tardando mas de lo esperado. Intenta de nuevo mas tarde.",
  translation: "No se pudo generar este idioma. Intenta de nuevo mas tarde.",
  noSource: "No hay subtitulos de origen para traducir.",
  sameAsSpoken: "Ya es el idioma hablado del video.",
  tooLong: `Supera el limite de ${Math.round(MAX_TRANSLATION_DURATION_S / 60)} minutos para traducciones.`,
} as const;

type ModuleItemRow = typeof modules_items.$inferSelect;
type MuxAsset = Awaited<ReturnType<typeof mux.video.assets.retrieve>>;

// -- Seeding ---------------------------------------------------------------

/**
 * Seed the track rows — the source row plus one per requested target — so the
 * UI can show "Espanol, Ingles en cola" immediately rather than only once each
 * Robots job has actually been created.
 *
 * `onConflictDoNothing` on the (item, kind, language) index makes a re-run of
 * the upload flow harmless.
 */
export async function seedCaptionTracks(params: {
  moduleItemId: string;
  sourceLanguage: string;
  targetLanguages: string[];
}): Promise<void> {
  const rows = [
    {
      id: crypto.randomUUID(),
      module_item_id: params.moduleItemId,
      kind: "source" as const,
      language_code: params.sourceLanguage,
      status: "generating" as TrackStatus,
    },
    ...params.targetLanguages.map((language_code) => ({
      id: crypto.randomUUID(),
      module_item_id: params.moduleItemId,
      kind: "translation" as const,
      language_code,
      status: "pending" as TrackStatus,
    })),
  ];

  await db.insert(video_tracks).values(rows).onConflictDoNothing();
}

/**
 * Re-arm a lesson's caption tracks so the pipeline can run over it again —
 * either because it predates this feature, or because a translation failed (a
 * missing `robots:*` scope being the usual reason) and is worth retrying now
 * that the cause is fixed.
 *
 * Tracks that are already `ready` are left alone: re-translating a language
 * that worked would spend money for nothing, and Mux rejects a second text
 * track in a language the asset already has.
 */
export async function prepareCaptionBackfill(params: {
  moduleItemId: string;
  sourceLanguage: string;
  targetLanguages: string[];
  needsAsr: boolean;
  existingTargets: string[] | null;
}): Promise<void> {
  const existing = await db
    .select()
    .from(video_tracks)
    .where(eq(video_tracks.module_item_id, params.moduleItemId));

  const now = new Date();

  if (params.needsAsr) {
    const source = existing.find((t) => t.kind === "source");
    if (source) {
      // Null out the ids too, so a retry doesn't inherit the previous track or
      // its error text.
      await db
        .update(video_tracks)
        .set({
          status: "generating",
          language_code: params.sourceLanguage,
          mux_track_id: null,
          error_message: null,
          attempts: 0,
          created_at: now,
          updated_at: now,
        })
        .where(eq(video_tracks.id, source.id));
    } else {
      await db
        .insert(video_tracks)
        .values({
          id: crypto.randomUUID(),
          module_item_id: params.moduleItemId,
          kind: "source",
          language_code: params.sourceLanguage,
          status: "generating",
        })
        .onConflictDoNothing();
    }
  }

  for (const language of params.targetLanguages) {
    const track = existing.find(
      (t) => t.kind === "translation" && t.language_code === language,
    );
    if (track) {
      if (track.status === "ready") continue;
      await db
        .update(video_tracks)
        .set({
          status: "pending",
          mux_track_id: null,
          robots_job_id: null,
          units_consumed: null,
          error_message: null,
          attempts: 0,
          created_at: now,
          updated_at: now,
        })
        .where(eq(video_tracks.id, track.id));
    } else {
      await db
        .insert(video_tracks)
        .values({
          id: crypto.randomUUID(),
          module_item_id: params.moduleItemId,
          kind: "translation",
          language_code: language,
          status: "pending",
        })
        .onConflictDoNothing();
    }
  }

  const mergedTargets = [
    ...new Set([...(params.existingTargets ?? []), ...params.targetLanguages]),
  ];
  await db
    .update(modules_items)
    .set({
      caption_targets: mergedTargets,
      caption_source_language: params.sourceLanguage,
      // Reopen the description budget only when there isn't one already —
      // regenerating would overwrite copy the creator may have edited or read.
      ...(params.needsAsr
        ? { description_attempts: 0, description_attempted_at: null }
        : {}),
    })
    .where(eq(modules_items.id, params.moduleItemId));
}

/**
 * Ask Mux to transcribe a video that has no usable source captions yet, and
 * queue whatever translations were requested alongside.
 *
 * Retroactive ASR is keyed on the asset's **audio track**, not the asset alone
 * — `generateSubtitles` 404s if you hand it the asset id twice.
 *
 * Shared by the "add subtitles" panel and the description button, which are the
 * same operation seen from two angles: both need a transcript that isn't there.
 */
export async function requestCaptionBackfill(params: {
  row: ModuleItemRow;
  sourceLanguage: string;
  targetLanguages: string[];
}): Promise<void> {
  const { row } = params;
  if (!row.mux_asset_id) throw new Error("Este video todavia no termino de procesarse.");

  const existing = await db
    .select()
    .from(video_tracks)
    .where(eq(video_tracks.module_item_id, row.id));
  const source = existing.find((t) => t.kind === "source");
  const hasReadySource = source?.status === "ready" && !!source.mux_track_id;

  if (!hasReadySource) {
    const asset = await mux.video.assets.retrieve(row.mux_asset_id);
    const audioTrackId = asset.tracks?.find((t) => t.type === "audio")?.id;
    if (!audioTrackId) {
      throw new Error("Este video no tiene audio para transcribir.");
    }
    await mux.video.assets.generateSubtitles(row.mux_asset_id, audioTrackId, {
      generated_subtitles: [
        {
          // Mux accepts "auto" here; the SDK's union of concrete codes predates it.
          language_code: params.sourceLanguage as "es",
          name:
            params.sourceLanguage === AUTO_LANGUAGE
              ? "Original"
              : languageDisplayName(params.sourceLanguage),
          passthrough: "source",
        },
      ],
    });
  }

  await prepareCaptionBackfill({
    moduleItemId: row.id,
    sourceLanguage: params.sourceLanguage,
    targetLanguages: params.targetLanguages,
    needsAsr: !hasReadySource,
    existingTargets: row.caption_targets,
  });
}

/** Whether a lesson already has captions we can translate or transcribe from. */
export async function hasReadySourceCaptions(
  moduleItemId: string,
): Promise<boolean> {
  const tracks = await db
    .select()
    .from(video_tracks)
    .where(eq(video_tracks.module_item_id, moduleItemId));
  const source = tracks.find((t) => t.kind === "source");
  return source?.status === "ready" && !!source.mux_track_id;
}

// -- The advance step ------------------------------------------------------

/**
 * Move one lesson's captions as far forward as they can go right now.
 *
 * Returns `true` while there is still outstanding work, so a caller polling
 * this knows when to stop. Never throws: every failure path settles the row it
 * belongs to.
 */
export async function advanceCaptions(moduleItemId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(modules_items)
    .where(eq(modules_items.id, moduleItemId))
    .limit(1);
  if (!row?.mux_asset_id || !row.mux_playback_id) return false;

  let tracks = await db
    .select()
    .from(video_tracks)
    .where(eq(video_tracks.module_item_id, moduleItemId));

  const descriptionPending = isDescriptionPending(row);
  if (tracks.every(isTerminal) && !descriptionPending) return false;

  // One asset read serves every track below. The Convex original retrieved it
  // once per poller because each ran in its own invocation; here they don't.
  let asset: MuxAsset;
  try {
    asset = await mux.video.assets.retrieve(row.mux_asset_id);
  } catch (err) {
    console.warn(
      `[captions] asset retrieve failed for ${moduleItemId}: ${messageOf(err)}`,
    );
    return true; // transient — try again on the next advance
  }

  const source = tracks.find((t) => t.kind === "source");
  if (source && !isTerminal(source)) {
    await advanceSourceTrack(row, source, asset);
    tracks = await db
      .select()
      .from(video_tracks)
      .where(eq(video_tracks.module_item_id, moduleItemId));
  }

  const readySource = tracks.find(
    (t) => t.kind === "source" && t.status === "ready" && t.mux_track_id,
  );

  if (readySource) {
    const pending = tracks.filter(
      (t) => t.kind === "translation" && t.status === "pending",
    );
    if (pending.length > 0) {
      await startTranslations(row, readySource, pending, asset);
    }

    const inFlight = tracks.filter(
      (t) => t.kind === "translation" && t.status === "translating",
    );
    for (const track of inFlight) {
      await advanceTranslationTrack(track, asset);
    }
  }

  // The description runs off the transcript, independent of the translations:
  // a failed language never blocks it, and a failed description never blocks a
  // language.
  const freshRow = descriptionPending ? await reloadRow(moduleItemId) : row;
  if (freshRow && isDescriptionPending(freshRow)) {
    await generateDescription(freshRow, readySource ?? null);
  }

  const finalTracks = await db
    .select()
    .from(video_tracks)
    .where(eq(video_tracks.module_item_id, moduleItemId));
  const finalRow = await reloadRow(moduleItemId);
  return (
    finalTracks.some((t) => !isTerminal(t)) ||
    (!!finalRow && isDescriptionPending(finalRow))
  );
}

/**
 * Advance every lesson with unfinished caption work.
 *
 * The backstop for a closed tab. Bounded per run so one sweep can't run long
 * enough to be killed mid-flight; whatever it doesn't reach is picked up next
 * tick, since every step is idempotent.
 */
export async function sweepPendingCaptions(limit = 10): Promise<{
  swept: number;
  stillWorking: number;
}> {
  const unfinished = await db
    .selectDistinct({ moduleItemId: video_tracks.module_item_id })
    .from(video_tracks)
    .where(
      and(
        ne(video_tracks.status, "ready"),
        ne(video_tracks.status, "errored"),
        ne(video_tracks.status, "skipped"),
      ),
    )
    .limit(limit);

  // A lesson whose tracks are all settled can still owe a description — the
  // transcript landed but Gemini was rate-limited at the time. The attempts
  // filter is what stops a row that gave up from being re-scanned every minute
  // for the rest of its life.
  const owedDescription = await db
    .select({ moduleItemId: modules_items.id })
    .from(modules_items)
    .where(
      and(
        isNotNull(modules_items.mux_asset_id),
        isNull(modules_items.description),
        isNotNull(modules_items.transcription),
        lt(modules_items.description_attempts, DESCRIPTION_MAX_ATTEMPTS),
      ),
    )
    .limit(limit);

  const ids = [
    ...new Set([
      ...unfinished.map((r) => r.moduleItemId),
      ...owedDescription.map((r) => r.moduleItemId),
    ]),
  ].slice(0, limit);

  let stillWorking = 0;
  for (const id of ids) {
    try {
      if (await advanceCaptions(id)) stillWorking += 1;
    } catch (err) {
      console.warn(`[captions] sweep failed for ${id}: ${messageOf(err)}`);
    }
  }
  return { swept: ids.length, stillWorking };
}

// -- Source (ASR) ----------------------------------------------------------

/**
 * Wait for Mux's ASR to finish, then record the detected language and download
 * the transcript. That transcript is what both the description and — via the
 * ready source track — the translations hang off.
 */
async function advanceSourceTrack(
  row: ModuleItemRow,
  source: VideoTrackSelect,
  asset: MuxAsset,
): Promise<void> {
  // A retried backfill leaves the previous errored track on the asset, so take
  // the best candidate rather than the first one.
  const candidates =
    asset.tracks?.filter(
      (t) =>
        t.type === "text" &&
        (t.passthrough === "source" || t.text_source === "generated_vod"),
    ) ?? [];
  const track =
    candidates.find((t) => t.status === "ready") ??
    candidates.find((t) => t.status === "preparing") ??
    candidates[0];

  // Not created yet, still encoding, or detected-language not yet resolved.
  const stillWorking =
    !track ||
    track.status === "preparing" ||
    (track.status === "ready" && track.language_code === AUTO_LANGUAGE);

  if (stillWorking) {
    if (isPastDeadline(source.created_at, SOURCE_DEADLINE_MS)) {
      // If the track is ready but the language never resolved past "auto",
      // press on anyway: the transcript URL is keyed on the track id, so the
      // description still works. Only the source-collision filter degrades,
      // and Robots' own rejection is the backstop there.
      if (track?.status === "ready" && track.id) {
        await finishSourceTrack(row, source, track);
        return;
      }
      await failSourceCaptions(row.id, source.id, USER_ERROR.subtitlesSlow);
      return;
    }
    await touchTrack(source.id);
    return;
  }

  if (track.status === "errored" || !track.id) {
    await failSourceCaptions(row.id, source.id, USER_ERROR.subtitles);
    return;
  }

  await finishSourceTrack(row, source, track);
}

type MuxTextTrack = {
  id?: string;
  status?: string;
  language_code?: string;
  auto_language_confidence?: number;
};

async function finishSourceTrack(
  row: ModuleItemRow,
  source: VideoTrackSelect,
  track: MuxTextTrack,
): Promise<void> {
  const languageCode = track.language_code ?? AUTO_LANGUAGE;
  const confidence = track.auto_language_confidence;

  await db
    .update(video_tracks)
    .set({
      status: "ready",
      mux_track_id: track.id,
      language_code: languageCode,
      error_message: null,
      updated_at: new Date(),
    })
    .where(eq(video_tracks.id, source.id));

  const patch: Partial<ModuleItemRow> = {};
  if (languageCode !== AUTO_LANGUAGE) {
    patch.caption_detected_language = languageCode;
    if (typeof confidence === "number") {
      patch.caption_detected_confidence = confidence;
    }
  }

  // Best effort — `generateDescription` re-fetches this itself if it didn't
  // land. Playback policy is public, so no signing token is needed.
  if (!row.transcription && row.mux_playback_id && track.id) {
    try {
      const text = await fetchTranscript(row.mux_playback_id, track.id);
      if (text) patch.transcription = text.slice(0, TRANSCRIPT_MAX_CHARS);
    } catch (err) {
      console.warn(
        `[captions] transcript fetch failed for ${row.id}: ${messageOf(err)}`,
      );
    }
  }

  if (Object.keys(patch).length > 0) {
    await db.update(modules_items).set(patch).where(eq(modules_items.id, row.id));
  }
}

/**
 * ASR failed. Mark the source track errored and skip every queued translation
 * — there is nothing to translate from.
 *
 * The video itself stays playable and no error surfaces on the lesson: caption
 * failures degrade quietly rather than showing the creator a red box.
 */
async function failSourceCaptions(
  moduleItemId: string,
  sourceTrackId: string,
  message: string,
): Promise<void> {
  await db
    .update(video_tracks)
    .set({ status: "errored", error_message: message, updated_at: new Date() })
    .where(eq(video_tracks.id, sourceTrackId));

  await db
    .update(video_tracks)
    .set({
      status: "skipped",
      error_message: USER_ERROR.noSource,
      updated_at: new Date(),
    })
    .where(
      and(
        eq(video_tracks.module_item_id, moduleItemId),
        eq(video_tracks.kind, "translation"),
        eq(video_tracks.status, "pending"),
      ),
    );
}

async function fetchTranscript(
  playbackId: string,
  trackId: string,
): Promise<string | null> {
  const res = await fetch(
    `https://stream.mux.com/${playbackId}/text/${trackId}.txt`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Transcript fetch failed (${res.status})`);
  const text = (await res.text()).trim();
  return text.length > 0 ? text : null;
}

// -- Translations ----------------------------------------------------------

/**
 * Create one Robots translation job per queued language.
 *
 * Both cost guards live here: the duration cap, and the filter that drops a
 * target matching the spoken language (Mux rejects those outright, so skipping
 * beats paying for a 4xx round trip).
 */
async function startTranslations(
  row: ModuleItemRow,
  source: VideoTrackSelect,
  pending: VideoTrackSelect[],
  asset: MuxAsset,
): Promise<void> {
  // The guard that matters: a long upload times several languages is the only
  // way this feature gets expensive.
  if ((asset.duration ?? 0) > MAX_TRANSLATION_DURATION_S) {
    await db
      .update(video_tracks)
      .set({
        status: "skipped",
        error_message: USER_ERROR.tooLong,
        updated_at: new Date(),
      })
      .where(
        inArray(
          video_tracks.id,
          pending.map((t) => t.id),
        ),
      );
    return;
  }

  const spoken = row.caption_detected_language ?? source.language_code;

  for (const track of pending) {
    if (spoken && spoken !== AUTO_LANGUAGE && track.language_code === spoken) {
      await db
        .update(video_tracks)
        .set({
          status: "skipped",
          error_message: USER_ERROR.sameAsSpoken,
          updated_at: new Date(),
        })
        .where(eq(video_tracks.id, track.id));
      continue;
    }

    // Claim the row before spending anything. Two advances can overlap — a
    // browser poll and a cron tick — and the loser of this compare-and-set
    // must not open a second job for the same language.
    const claimed = await db
      .update(video_tracks)
      .set({ status: "translating", updated_at: new Date() })
      .where(
        and(eq(video_tracks.id, track.id), eq(video_tracks.status, "pending")),
      )
      .returning({ id: video_tracks.id });
    if (claimed.length === 0) continue;

    // One language failing must not abort the rest.
    try {
      const job = await createTranslateCaptionsJob({
        assetId: row.mux_asset_id!,
        trackId: source.mux_track_id!,
        toLanguageCode: track.language_code,
        passthrough: track.id,
      });
      await db
        .update(video_tracks)
        .set({
          status: "translating",
          robots_job_id: job.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(video_tracks.id, track.id));
    } catch (err) {
      // Provider detail (status, dashboard links, scope hints) is for the
      // operator; the creator gets a sentence they can act on.
      console.warn(
        `[captions] translate-captions ${track.language_code} for ${row.id} failed: ${describeRobotsError(err)}`,
      );
      await db
        .update(video_tracks)
        .set({
          status: "errored",
          error_message: USER_ERROR.translation,
          updated_at: new Date(),
        })
        .where(eq(video_tracks.id, track.id));
    }
  }
}

/**
 * Two phases, distinguished by whether the track has a Mux track id yet.
 *
 * Robots reports "completed" once it has uploaded the WebVTT, but the Mux text
 * track it created is still "preparing" at that moment and won't play — so the
 * track only goes `ready` after the second phase confirms it.
 */
async function advanceTranslationTrack(
  track: VideoTrackSelect,
  asset: MuxAsset,
): Promise<void> {
  if (!track.mux_track_id) {
    if (!track.robots_job_id) {
      // Claimed but never got a job id: the process died between the
      // compare-and-set in `startTranslations` and the Robots call. Nothing
      // will ever move this row, so time it out rather than sweeping it
      // forever. The window is short because the gap it covers is two
      // statements wide.
      if (isPastDeadline(track.updated_at, ORPHANED_CLAIM_DEADLINE_MS)) {
        await failTrack(track.id, USER_ERROR.translation);
      }
      return;
    }

    let job;
    try {
      job = await retrieveTranslateCaptionsJob(track.robots_job_id);
    } catch (err) {
      console.warn(
        `[captions] translate-captions poll for ${track.id} failed: ${describeRobotsError(err)}`,
      );
      await failTrack(track.id, USER_ERROR.translation);
      return;
    }

    if (job.status === "pending" || job.status === "processing") {
      if (isPastDeadline(track.created_at, TRANSLATION_JOB_DEADLINE_MS)) {
        await failTrack(track.id, USER_ERROR.translation);
        return;
      }
      await touchTrack(track.id);
      return;
    }

    if (job.status === "completed" && job.uploadedTrackId) {
      // Spend is operator-facing only. It lives on the track row for the record
      // and in the logs for anyone totalling it up; the creator's UI never
      // shows what a translation cost us.
      console.log(
        `[captions] translate-captions ${track.language_code} for ${track.module_item_id}: ${job.unitsConsumed} units (~$${unitsToUsd(job.unitsConsumed).toFixed(4)})`,
      );
      await db
        .update(video_tracks)
        .set({
          mux_track_id: job.uploadedTrackId,
          units_consumed: job.unitsConsumed,
          updated_at: new Date(),
        })
        .where(eq(video_tracks.id, track.id));
      return;
    }

    console.warn(
      `[captions] translate-captions ${track.language_code} for ${track.module_item_id} ended ${job.status}: ${job.errorMessage ?? "no detail"}`,
    );
    await db
      .update(video_tracks)
      .set({
        status: "errored",
        units_consumed: job.unitsConsumed,
        error_message: USER_ERROR.translation,
        updated_at: new Date(),
      })
      .where(eq(video_tracks.id, track.id));
    return;
  }

  // Phase two: wait for the attached text track to become playable. The asset
  // was read at the top of the advance, which is fresh enough.
  const muxTrack = asset.tracks?.find((t) => t.id === track.mux_track_id);

  if (muxTrack?.status === "ready") {
    await db
      .update(video_tracks)
      .set({ status: "ready", error_message: null, updated_at: new Date() })
      .where(eq(video_tracks.id, track.id));
    return;
  }

  if (muxTrack?.status === "errored") {
    await failTrack(track.id, USER_ERROR.translation);
    return;
  }

  if (isPastDeadline(track.updated_at, TRANSLATION_TRACK_DEADLINE_MS)) {
    await failTrack(track.id, USER_ERROR.translation);
    return;
  }
  await touchTrack(track.id);
}

// -- Description -----------------------------------------------------------

/**
 * Write the lesson description from the ASR transcript. Best-effort: it retries
 * transient failures with exponential backoff and then gives up silently rather
 * than putting a red banner on a perfectly good video.
 *
 * Feeding Gemini the transcript rather than the audio is what retires the
 * `mp4_support: "audio-only"` flip and the audio download in `ai_actions.ts`.
 * It is also strictly cheaper: Mux's ASR and the transcript are free on VOD,
 * and a text prompt costs far less than an audio one.
 */
async function generateDescription(
  row: ModuleItemRow,
  source: VideoTrackSelect | null,
): Promise<void> {
  const attempt = row.description_attempts ?? 0;
  if (attempt >= DESCRIPTION_MAX_ATTEMPTS) return;

  // Respect the backoff from the previous attempt.
  const delay = Math.min(
    DESCRIPTION_BACKOFF_BASE_MS * 2 ** Math.max(attempt - 1, 0),
    DESCRIPTION_BACKOFF_CAP_MS,
  );
  if (attempt > 0 && !isPastDeadline(row.description_attempted_at, delay)) {
    return;
  }

  await db
    .update(modules_items)
    .set({
      description_attempts: attempt + 1,
      description_attempted_at: new Date(),
    })
    .where(eq(modules_items.id, row.id));

  try {
    let transcript = row.transcription;

    if (!transcript && source?.mux_track_id && row.mux_playback_id) {
      transcript = await fetchTranscript(row.mux_playback_id, source.mux_track_id);
      if (transcript) {
        await db
          .update(modules_items)
          .set({ transcription: transcript.slice(0, TRANSCRIPT_MAX_CHARS) })
          .where(eq(modules_items.id, row.id));
      }
    }

    if (!transcript) throw new Error("No transcript available yet");

    // A screencast with no narration has nothing to describe. Settle rather
    // than burning the retry budget on a model that would invent something.
    if (transcript.length < MIN_TRANSCRIPT_CHARS) {
      await db
        .update(modules_items)
        .set({ description_attempts: DESCRIPTION_MAX_ATTEMPTS })
        .where(eq(modules_items.id, row.id));
      return;
    }

    const result = await gemini.models.generateContent({
      model: DESCRIPTION_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: buildDescriptionPrompt(row.title, transcript) }],
        },
      ],
    });

    const description = result.text?.trim();
    if (!description) throw new Error("Empty description from Gemini");

    await db
      .update(modules_items)
      .set({ description })
      .where(eq(modules_items.id, row.id));
  } catch (err) {
    // `warn`, not `error`: a rate-limited attempt with seven left is progress,
    // not a fault.
    console.warn(
      `[captions] description attempt ${attempt + 1}/${DESCRIPTION_MAX_ATTEMPTS} for ${row.id}: ${messageOf(err)}`,
    );
  }
}

/**
 * The "don't mention the transcript" instruction is load-bearing: without it
 * the model narrates its source ("segun la transcripcion...") or apologises for
 * garbled speech recognition, neither of which belongs in a lesson description.
 */
function buildDescriptionPrompt(title: string, transcript: string): string {
  const clipped = transcript.slice(0, TRANSCRIPT_PROMPT_MAX_CHARS);
  return `Eres un asistente de contenido educativo. Abajo esta la transcripcion automatica de un video de clase titulado "${title}". Genera una descripcion en espanol (2-4 oraciones) escrita desde la perspectiva del profesor, como si estuviera explicandole a sus alumnos los temas que se abordan en la clase. Usa un tono cercano y profesional, por ejemplo: "En esta clase vamos a hablar sobre...", "Veremos como...", "Abordaremos temas como...". Enfocate en los temas y conceptos principales. La transcripcion viene de un reconocimiento automatico de voz y puede tener errores: interpreta la intencion y no menciones nunca la transcripcion ni sus fallos. No incluyas formato, markdown ni vinetas — solo texto plano.

Transcripcion:
"""
${clipped}
"""`;
}

// -- Helpers ---------------------------------------------------------------

function isTerminal(track: VideoTrackSelect): boolean {
  return TERMINAL_TRACK_STATUSES.includes(track.status);
}

function isDescriptionPending(row: ModuleItemRow): boolean {
  return (
    row.type === "video" &&
    !row.description &&
    (row.description_attempts ?? 0) < DESCRIPTION_MAX_ATTEMPTS
  );
}

function isPastDeadline(since: Date | null, budgetMs: number): boolean {
  if (!since) return false;
  return Date.now() - since.getTime() > budgetMs;
}

/**
 * Records that we looked, so `attempts` reflects effort for an operator.
 *
 * Incremented in SQL rather than read-then-written: a browser poll and a cron
 * tick can land on the same row at the same moment, and neither should clobber
 * the other's count.
 */
async function touchTrack(trackId: string): Promise<void> {
  await db
    .update(video_tracks)
    .set({
      attempts: sql`${video_tracks.attempts} + 1`,
      updated_at: new Date(),
    })
    .where(eq(video_tracks.id, trackId));
}

async function failTrack(trackId: string, message: string): Promise<void> {
  await db
    .update(video_tracks)
    .set({ status: "errored", error_message: message, updated_at: new Date() })
    .where(eq(video_tracks.id, trackId));
}

async function reloadRow(moduleItemId: string): Promise<ModuleItemRow | null> {
  const [row] = await db
    .select()
    .from(modules_items)
    .where(eq(modules_items.id, moduleItemId))
    .limit(1);
  return row ?? null;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export { USER_ERROR, DESCRIPTION_MAX_ATTEMPTS };
export type { ModuleItemRow };
