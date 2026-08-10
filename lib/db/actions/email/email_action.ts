"use server";

import { sendMail, sendMailCourseProgress } from "@/app/api/email/send_email";
import { action } from "../safe_action";
import z from 'zod';
import { db } from "../..";
import { users } from "../../schema/auth_schema";
import { usersToCourses } from "../../schema/users_to_courses";
import { payments_on_users_ebooks } from "../../schema/ebook_schema";
import { payments_on_users_program } from "../../schema/program_schema";
import { eq } from "drizzle-orm";
import { subscription } from "../../schema/subscrition_schema";

export const emailAction = action
    .schema(z.object({
        title: z.string(),
        content: z.string(),
        buttonTitle: z.string(),
        img_url: z.string().optional(),
        email_type: z.enum(['allUsers', 'usersWithCourses', 'usersWithEbookProgram', 'usersWithCoaching', 'test']),
    }))
    .action(async ({ parsedInput: { title, content, buttonTitle, email_type, img_url } }) => {

        let sendTo: string | string[] | undefined;

        if (email_type === 'allUsers') {
            const usersDb = await db.select().from(users);
            const emails = usersDb.map((e) => e.email);
            sendTo = emails;
        }

        if (email_type === 'usersWithCourses') {
            const usersDb = await db.query.usersToCourses.findMany({
                with: {
                    user: true
                }
            });
            const emails = usersDb.map((e) => e.user.email);
            sendTo = emails;
        }

        if (email_type === 'usersWithEbookProgram') {
            const usersWithEbooks = await db.query.payments_on_users_ebooks.findMany({ with: { user: true } });
            const usersWithPrograms = await db.query.payments_on_users_program.findMany({ with: { user: true } });
            const emails = [...usersWithEbooks.map((e) => e.user.email), ...usersWithPrograms.map((e) => e.user.email)];
            sendTo = emails;
        }

        if (email_type === 'usersWithCoaching') {
            console.log('Users with coaching');
            const usersWithCoaching = await db.query.subscription.findMany({ with: { user: true }, where: eq(subscription.active, true) });
            const emails = usersWithCoaching.map((e) => e.user.email);
            sendTo = emails;

        }

        if (email_type === 'test') {
            sendTo = ["rodrigo.otrerafornes@gmail.com", 'axeldubin2000@gmail.com'];
            console.log('Test', sendTo);
        }

        await sendMail({
            sendTo: process.env.NODE_ENV === 'development' ? "rodrigo.otrerafornes@gmail.com" : sendTo,
            subject: title,
            text: content,
            img_url: img_url,
        });
        return;
    })