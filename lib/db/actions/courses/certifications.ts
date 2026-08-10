"use server"

import { redirect } from "next/navigation";
import z from 'zod';
import { eq } from "drizzle-orm";
import { certificationInsertZod, certifications } from "../../schema/certifications";
import { db } from "../..";
import { action } from "../safe_action";
import { captureServer } from "@/lib/analytics/server";
import { awardCourseXp } from "../gamification/award_xp";



export async function getCertificate(id: string) {
  return await db.query.certifications.findFirst({
    where: eq(certifications.id, id),
    with: {
      course: true,
      user: true,
    },
  });
}


export const verifyCertificate = action.schema(z.object({
  id: z.string()
})).action(async ({ parsedInput: { id } }) => {

  try {
    const certificate = await getCertificate(id)
    return certificate;

  } catch (error) {
    return undefined;
  }


})





export const createCertification = action

  .schema(certificationInsertZod).action(async ({ parsedInput: { course_id, user_id } }) => {
    const certificationDB = await db.insert(certifications).values({
      id: crypto.randomUUID(),
      course_id, user_id
    }).returning();
    const obtainedCertification = certificationDB[0]!;

    // Before the redirect — `redirect()` throws.
    // No-op if the course bonus was already awarded via the exam or the final
    // lesson; the ledger's unique index makes the order irrelevant.
    await awardCourseXp({ user_id, course_id });

    await captureServer("certificate_issued", user_id, { course_id });

    redirect(`/certificados/${obtainedCertification.id}`)
  })