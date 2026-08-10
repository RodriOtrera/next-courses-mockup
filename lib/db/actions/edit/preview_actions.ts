"use server";

import { z } from "zod";
import { action } from "../safe_action";
import { currentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { modules } from "../../schema/modules";
import { modules_items } from "../../schema/modules_items";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const createModule = action
  .schema(
    z.object({
      courseId: z.string(),
      title: z.string().min(1, "El titulo es requerido"),
    })
  )
  .action(async ({ parsedInput: { courseId, title } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const id = crypto.randomUUID();
    await db.insert(modules).values({
      id,
      course_id: courseId,
      title,
    });

    revalidatePath(`/editarCurso/${courseId}`);
    return { moduleId: id };
  });

export const createModuleItem = action
  .schema(
    z.object({
      moduleId: z.string(),
      courseId: z.string(),
      title: z.string().min(1, "El titulo es requerido"),
      type: z.enum(["video", "pdf", "questionario"]).default("video"),
    })
  )
  .action(async ({ parsedInput: { moduleId, courseId, title, type } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const id = crypto.randomUUID();
    await db.insert(modules_items).values({
      id,
      module_id: moduleId,
      title,
      type,
      position: 0,
    });

    revalidatePath(`/editarCurso/${courseId}`);
    return { moduleItemId: id };
  });

export const updateModuleItemDescription = action
  .schema(
    z.object({
      moduleItemId: z.string(),
      description: z.string().min(1, "La descripcion es requerida"),
      courseId: z.string(),
    })
  )
  .action(
    async ({ parsedInput: { moduleItemId, description, courseId } }) => {
      const user = await currentUser();
      if (!user) throw new Error("Unauthorized");

      await db
        .update(modules_items)
        .set({ description })
        .where(eq(modules_items.id, moduleItemId));

      revalidatePath(`/editarCurso/${courseId}`);
      return { success: true };
    }
  );

export const deleteModuleItemDescription = action
  .schema(
    z.object({
      moduleItemId: z.string(),
      courseId: z.string(),
    })
  )
  .action(async ({ parsedInput: { moduleItemId, courseId } }) => {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    await db
      .update(modules_items)
      .set({ description: null })
      .where(eq(modules_items.id, moduleItemId));

    revalidatePath(`/editarCurso/${courseId}`);
    return { success: true };
  });
