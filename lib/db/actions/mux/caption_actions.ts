"use server";

/**
 * Server actions for subtitles and translations on a lesson video.
 *
 * These are the thin, authenticated edge; every decision about what to do next
 * lives in `lib/mux/caption_pipeline.ts` so that the cron sweep drives the same
 * state machine as the browser.
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { action } from "../safe_action";
import { currentUser } from "@/lib/auth/server";
import { mux } from "@/lib/mux";
import { db } from "@/lib/db";
import { modules_items } from "../../schema/modules_items";
import {
  toCaptionTrackSummary,
  video_tracks,
  type CaptionTrackSummary,
} from "../../schema/video_tracks";
import {
  AUTO_LANGUAGE,
  MAX_TARGET_LANGUAGES,
  isSupportedCaptionLanguage,
  isSupportedSourceLanguage,
  languageDisplayName,
} from "@/lib/mux/caption_languages";
import {
  DESCRIPTION_MAX_ATTEMPTS,
  advanceCaptions,
  hasReadySourceCaptions,
  requestCaptionBackfill,
  seedCaptionTracks,
} from "@/lib/mux/caption_pipeline";

/**
 * Validated server-side, not just in the picker: translations spend real money,
 * so the client doesn't get to decide how many or which.
 */
const languageSelection = z.object({
  sourceLanguage: z.string().default(AUTO_LANGUAGE),
  targetLanguages: z.array(z.string()).default([]),
});

function validateSelection(input: {
  sourceLanguage: string;
  targetLanguages: string[];
}) {
  if (!isSupportedSourceLanguage(input.sourceLanguage)) {
    throw new Error(`Idioma hablado no soportado: ${input.sourceLanguage}`);
  }
  const targets = [...new Set(input.targetLanguages)];
  for (const code of targets) {
    if (!isSupportedCaptionLanguage(code)) {
      throw new Error(`Idioma de subtitulos no soportado: ${code}`);
    }
  }
  if (targets.length > MAX_TARGET_LANGUAGES) {
    throw new Error(`Maximo ${MAX_TARGET_LANGUAGES} idiomas por video.`);
  }
  return { sourceLanguage: input.sourceLanguage, targets };
}

/**
 * A direct upload that asks Mux for free Whisper ASR up front.
 *
 * The input carries no `url` — the file arrives via the direct-upload URL.
 * Subtitle generation runs *after* ingest, so this track is still "preparing"
 * when the asset flips to "ready"; that is why the pipeline polls for it
 * separately instead of assuming a ready asset means ready captions.
 *
 * `name` is baked in at creation and can never be updated (Mux offers create
 * and delete on tracks, no update), which is why declaring the spoken language
 * up front gives a better label in the player's CC menu than auto-detect.
 */
export const createCaptionedMuxUpload = action
  .schema(languageSelection.extend({ corsOrigin: z.string().default("*") }))
  .action(async ({ parsedInput }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const { sourceLanguage, targets } = validateSelection(parsedInput);

    const upload = await mux.video.uploads.create({
      cors_origin: parsedInput.corsOrigin,
      new_asset_settings: {
        playback_policy: ["public"],
        inputs: [
          {
            generated_subtitles: [
              {
                // Mux accepts "auto" here; the SDK's union of concrete codes
                // predates it.
                language_code: sourceLanguage as "es",
                name:
                  sourceLanguage === AUTO_LANGUAGE
                    ? "Original"
                    : languageDisplayName(sourceLanguage),
                passthrough: "source",
              },
            ],
          },
        ],
      },
      timeout: 3600,
    });

    if (!upload.url) throw new Error("No se pudo iniciar la subida.");

    return {
      uploadId: upload.id,
      url: upload.url,
      status: upload.status,
      sourceLanguage,
      targetLanguages: targets,
    };
  });

/**
 * Attach the finished Mux asset to the lesson and seed its caption tracks.
 *
 * Replaces `updateModuleMux` on the captioned path — the two writes belong in
 * one action so a lesson can never end up with a playback id but no track rows
 * to drive the pipeline from.
 */
export const attachCaptionedVideo = action
  .schema(
    languageSelection.extend({
      moduleItemId: z.string(),
      assetId: z.string(),
      playbackId: z.string(),
      courseId: z.string(),
      generateDescription: z.boolean().default(true),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const { sourceLanguage, targets } = validateSelection(parsedInput);

    await db
      .update(modules_items)
      .set({
        mux_asset_id: parsedInput.assetId,
        mux_playback_id: parsedInput.playbackId,
        caption_source_language: sourceLanguage,
        caption_targets: targets,
        // Opting out is spending the description budget up front rather than
        // carrying a second flag: the pipeline already treats an exhausted
        // budget as "don't describe this one", and the button that generates
        // one on demand resets it.
        ...(parsedInput.generateDescription
          ? {}
          : { description_attempts: DESCRIPTION_MAX_ATTEMPTS }),
      })
      .where(eq(modules_items.id, parsedInput.moduleItemId));

    await seedCaptionTracks({
      moduleItemId: parsedInput.moduleItemId,
      sourceLanguage,
      targetLanguages: targets,
    });

    revalidatePath(`/editarCurso/${parsedInput.courseId}`);
    return { success: true };
  });

export type CaptionState = {
  tracks: CaptionTrackSummary[];
  description: string | null;
  detectedLanguage: string | null;
  sourceLanguage: string | null;
  targets: string[];
  /** False once nothing is left to poll for. */
  working: boolean;
};

/**
 * Move the pipeline forward and report where it got to.
 *
 * Advance and read are one call on purpose: the browser polls this on a timer,
 * and splitting them would double the round trips to say the same thing.
 */
export const advanceCaptionsAction = action
  .schema(z.object({ moduleItemId: z.string() }))
  .action(async ({ parsedInput: { moduleItemId } }): Promise<CaptionState> => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const working = await advanceCaptions(moduleItemId);
    return { ...(await readCaptionState(moduleItemId)), working };
  });

/** Read-only sibling of the above, for a page that shouldn't drive anything. */
export const getCaptionState = action
  .schema(z.object({ moduleItemId: z.string() }))
  .action(async ({ parsedInput: { moduleItemId } }): Promise<CaptionState> => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");
    return readCaptionState(moduleItemId);
  });

async function readCaptionState(moduleItemId: string): Promise<CaptionState> {
  const [row] = await db
    .select()
    .from(modules_items)
    .where(eq(modules_items.id, moduleItemId))
    .limit(1);

  const tracks = await db
    .select()
    .from(video_tracks)
    .where(eq(video_tracks.module_item_id, moduleItemId));

  return {
    tracks: tracks.map(toCaptionTrackSummary),
    description: row?.description ?? null,
    detectedLanguage: row?.caption_detected_language ?? null,
    sourceLanguage: row?.caption_source_language ?? null,
    targets: row?.caption_targets ?? [],
    working: tracks.some(
      (t) =>
        t.status === "pending" ||
        t.status === "generating" ||
        t.status === "translating",
    ),
  };
}

/**
 * Add subtitles to a video that's already uploaded.
 *
 * Two shapes, decided by whether usable source captions already exist:
 *
 * - **No source captions** (uploaded before this feature, or ASR failed) — ask
 *   Mux for retroactive ASR via `generateSubtitles`, which is keyed on the
 *   asset's *audio* track, then let the normal pipeline take over.
 * - **Source captions ready** — skip ASR entirely and go straight to the Robots
 *   jobs. This is the path for retrying translations that failed for a fixable
 *   reason, such as a token without the `robots:*` scope.
 */
export const backfillCaptions = action
  .schema(
    languageSelection.partial().extend({
      moduleItemId: z.string(),
      courseId: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const [row] = await db
      .select()
      .from(modules_items)
      .where(eq(modules_items.id, parsedInput.moduleItemId))
      .limit(1);
    if (!row) throw new Error("Clase no encontrada");
    if (!row.mux_asset_id || !row.mux_playback_id) {
      throw new Error("Este video todavia no termino de procesarse.");
    }

    const hasReadySource = await hasReadySourceCaptions(parsedInput.moduleItemId);

    const { sourceLanguage, targets } = validateSelection({
      sourceLanguage:
        parsedInput.sourceLanguage ??
        row.caption_detected_language ??
        row.caption_source_language ??
        AUTO_LANGUAGE,
      targetLanguages: parsedInput.targetLanguages ?? [],
    });

    if (hasReadySource && targets.length === 0) {
      throw new Error("Elegi al menos un idioma para agregar.");
    }

    await requestCaptionBackfill({
      row,
      sourceLanguage,
      targetLanguages: targets,
    });

    // Get the first step in immediately; the browser poll and the cron sweep
    // carry it from here.
    await advanceCaptions(parsedInput.moduleItemId);

    if (parsedInput.courseId) {
      revalidatePath(`/editarCurso/${parsedInput.courseId}`);
    }
    return { success: true };
  });
