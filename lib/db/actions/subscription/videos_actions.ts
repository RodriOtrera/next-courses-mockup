"use server"

import { eq } from "drizzle-orm";

import { revalidatePath } from "next/cache";
import { VideoInsert, videos } from "../../schema/videos";
import { db } from "../..";

export async function createVideo(formData: FormData) {
    const data: VideoInsert = {
        id: crypto.randomUUID(),
        semana_id: formData.get('semana_id') as string,
        videoUrl: formData.get('video_url') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string ?? ""
    }

    await db.insert(videos).values(data);
    revalidatePath('/coachingAdmin')


}

export async function deleteVideo(formData: FormData) {
    const id = formData.get('id') as string;
    await db.delete(videos).where(eq(videos.id, id))
    revalidatePath('/coachingAdmin')

}