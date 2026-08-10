"use server";
import { headers } from "next/headers";
import { db } from '../..';
import { courses } from '../../schema/course';
import { eq } from 'drizzle-orm';
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createPaypalOrder, capturePaypalOrder } from "../../../paypal/rest";
import { encodePaypalCustomId, fulfillPaypalPurchase, assertCaptureMatchesTracked } from "../../../paypal/fulfillment";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export type PaypalAction = typeof paypalAction;


export async function paypalAction(course_id: string) {
  const user = await currentUser();
  if (user == null) {
    throw Error("User not logged in");
  }

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, course_id),
  });
  if (!course) {
    throw Error("Course not found");
  }

  return await createPaypalOrder({
    value: course.price_usd.toString(),
    description: course.title,
    customId: encodePaypalCustomId({
      productType: "course",
      productId: course_id,
      userId: user.id,
    }),
  });
}

export async function obtainCourseAction(course_id: string, order_id: string) {
  const user = await currentUser();
  if (user == null) {
    throw Error("User not logged in");
  }

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, course_id),
  });
  if (!course) {
    throw Error("Course not found");
  }

  const capture = await capturePaypalOrder(order_id);
  // Reject the purchase unless PayPal captured exactly the course price.
  const captured = await assertCaptureMatchesTracked(
    capture,
    { value: course.price_usd.toString() },
    { userId: user.id, orderId: order_id, productType: "course", productId: course_id }
  );

  await fulfillPaypalPurchase({
    productType: "course",
    productId: course_id,
    userId: user.id,
    orderId: order_id,
    paidAmount: captured.value,
    currency: captured.currency_code,
  });

  redirect('/pago/completado');
}
