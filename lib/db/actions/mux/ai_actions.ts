"use server";

/**
 * On-demand AI description for a lesson video.
 *
 * This used to flip the asset to `mp4_support: "audio-only"`, poll for the
 * static rendition, download the audio and hand the bytes to Gemini. It now
 * runs off Mux's ASR transcript instead — the same transcript the subtitles are
 * built from — which is both faster and strictly cheaper: ASR and the
 * transcript download are free on VOD, and a text prompt costs a fraction of an
 * audio one. No audio rendition is created at all.
 *
 * The work itself lives in `lib/mux/caption_pipeline.ts` so that this button,
 * the upload flow and the cron sweep all describe a video the same way.
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { action } from "../safe_action";
import { currentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { modules_items } from "../../schema/modules_items";
import {
  advanceCaptions,
  hasReadySourceCaptions,
  requestCaptionBackfill,
} from "@/lib/mux/caption_pipeline";
import { AUTO_LANGUAGE } from "@/lib/mux/caption_languages";

export const generateDescriptionFromVideo = action
  .schema(
    z.object({
      playbackId: z.string(),
      title: z.string(),
      moduleItemId: z.string(),
    })
  )
  .action(async ({ parsedInput: { moduleItemId } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const [row] = await db
      .select()
      .from(modules_items)
      .where(eq(modules_items.id, moduleItemId))
      .limit(1);
    if (!row) throw new Error("Clase no encontrada");
    if (!row.mux_asset_id) throw new Error("Este video no esta en Mux");

    // Pressing the button is an explicit ask, so it reopens a budget that a
    // previous round of failures (or an opt-out at upload) had spent.
    await db
      .update(modules_items)
      .set({ description_attempts: 0, description_attempted_at: null })
      .where(eq(modules_items.id, moduleItemId));

    // A video uploaded before subtitles existed has no transcript to describe
    // from. Ask for one — translations stay empty, so this path is still free.
    if (!row.transcription && !(await hasReadySourceCaptions(moduleItemId))) {
      await requestCaptionBackfill({
        row,
        sourceLanguage: row.caption_source_language ?? AUTO_LANGUAGE,
        targetLanguages: [],
      });
    }

    await advanceCaptions(moduleItemId);

    const [updated] = await db
      .select({
        description: modules_items.description,
        transcription: modules_items.transcription,
      })
      .from(modules_items)
      .where(eq(modules_items.id, moduleItemId))
      .limit(1);

    return {
      description: updated?.description ?? null,
      transcription: updated?.transcription ?? null,
      /**
       * True when ASR is still running: the caller should keep polling
       * `advanceCaptionsAction` rather than treat an empty description as a
       * failure. Transcribing a fresh video takes minutes.
       */
      pending: !updated?.description,
    };
  });
