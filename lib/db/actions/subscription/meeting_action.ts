"use server";

import { db } from "../..";
import z from 'zod';
import { meeting_schema } from '../../schema/meeting';
import { eq } from "drizzle-orm";
import { action } from "../safe_action";

export const updateMeeting = action
    .schema(z.object({
        link: z.string().nullable()
    })).action(async ({ parsedInput: { link } }) => {
        // `updatedAt` is a pg timestamp column in date mode — it takes a Date,
        // not a formatted string.
        const updatedAtValue = new Date();
        await db.update(meeting_schema).set({ link: link, updatedAt: updatedAtValue }).where(eq(meeting_schema.id, "NoID"));
        return link;
    })
