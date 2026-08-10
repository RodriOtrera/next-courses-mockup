"use server";

import { z } from "zod";
import { action } from "../safe_action";
import { currentUser } from "@/lib/auth/server";
import { mux } from "@/lib/mux";
import { db } from "@/lib/db";
import { modules_items } from "../../schema/modules_items";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const createMuxUpload = action
  .schema(z.object({
    corsOrigin: z.string().optional().default("*"),
  }))
  .action(async ({ parsedInput: { corsOrigin } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: { playback_policy: ["public"] },
      timeout: 3600,
    });

    return { uploadId: upload.id, url: upload.url, status: upload.status };
  });

export const checkUploadStatus = action
  .schema(z.object({ uploadId: z.string() }))
  .action(async ({ parsedInput: { uploadId } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const upload = await mux.video.uploads.retrieve(uploadId);
    return { assetId: upload.asset_id, status: upload.status };
  });

export const getMuxAsset = action
  .schema(z.object({ assetId: z.string() }))
  .action(async ({ parsedInput: { assetId } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const asset = await mux.video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;
    return { assetId: asset.id, playbackId, status: asset.status, duration: asset.duration };
  });

export const updateModuleMux = action
  .schema(z.object({
    moduleItemId: z.string(),
    assetId: z.string(),
    playbackId: z.string(),
    courseId: z.string(),
  }))
  .action(async ({ parsedInput: { moduleItemId, assetId, playbackId, courseId } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    await db.update(modules_items)
      .set({ mux_asset_id: assetId, mux_playback_id: playbackId })
      .where(eq(modules_items.id, moduleItemId));

    revalidatePath(`/editarCurso/${courseId}`);
    return { success: true };
  });
