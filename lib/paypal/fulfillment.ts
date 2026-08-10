import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema/course";
import { ebook_schema, payments_on_users_ebooks } from "@/lib/db/schema/ebook_schema";
import { program_schema, payments_on_users_program } from "@/lib/db/schema/program_schema";
import { usersToCourses } from "@/lib/db/schema/users_to_courses";
import { course_progress } from "@/lib/db/schema/course_progress";
import { payment_log_schema } from "@/lib/db/schema/payment_log_schema";
import { getFirstModuleOfCourse } from "@/lib/db/actions/edit/modules_actions";
import { captureServer } from "@/lib/analytics/server";
import { parseAmount } from "@/lib/utils/parse_amount";
import { assertCaptureMatches, type PaypalCaptureResult } from "./rest";

/**
 * Shared PayPal fulfillment used by both the synchronous capture flow
 * (the `obtain*Action` server actions) and the async webhook. Keeping the DB
 * writes in one place ensures both paths grant access identically and stay
 * idempotent on the same key (`paypal_<orderId>`).
 */

export type PaypalProductType = "ebook" | "program" | "course";

export interface PaypalOrderMetadata {
  productType: PaypalProductType;
  productId: string;
  userId: string;
}

/** Packed into the order's `custom_id` so the webhook can map back to a buyer. */
export function encodePaypalCustomId(meta: PaypalOrderMetadata): string {
  return JSON.stringify({ t: meta.productType, p: meta.productId, u: meta.userId });
}

export function decodePaypalCustomId(
  raw: string | null | undefined
): PaypalOrderMetadata | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { t?: unknown; p?: unknown; u?: unknown };
    if (typeof o.t !== "string" || typeof o.p !== "string" || typeof o.u !== "string") {
      return null;
    }
    if (o.t !== "ebook" && o.t !== "program" && o.t !== "course") return null;
    return { productType: o.t, productId: o.p, userId: o.u };
  } catch {
    return null;
  }
}

/** Stable, shared idempotency key for a given PayPal order. */
export function paypalPaymentId(orderId: string): string {
  return `paypal_${orderId}`;
}

/**
 * `assertCaptureMatches` with a `capture_mismatch` event on the failure path.
 *
 * A mismatch means PayPal captured a different amount or currency than the
 * product's price — a tampered/replayed order id, or a price changed mid-
 * checkout. It's rare and it's the kind of thing you want to find out about
 * from a dashboard rather than from a support ticket, but the assertion itself
 * stays a pure synchronous validator; this only wraps it.
 */
export async function assertCaptureMatchesTracked(
  capture: PaypalCaptureResult,
  expected: { value: string; currency?: string },
  context: {
    userId: string;
    orderId: string;
    productType: PaypalProductType;
    productId: string;
  }
): Promise<{ currency_code: string; value: string }> {
  try {
    return assertCaptureMatches(capture, expected);
  } catch (error) {
    await captureServer("capture_mismatch", context.userId, {
      order_id: context.orderId,
      expected: `${expected.value} ${expected.currency ?? "USD"}`,
      received: capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount
        ? `${capture.purchase_units[0].payments!.captures![0].amount!.value} ${capture.purchase_units[0].payments!.captures![0].amount!.currency_code}`
        : undefined,
      reason: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

async function isFulfilled(paymentId: string): Promise<boolean> {
  const existing = await db.query.payment_log_schema.findFirst({
    where: eq(payment_log_schema.payment_id, paymentId),
  });
  return existing != null;
}

export interface FulfillParams {
  productType: PaypalProductType;
  productId: string;
  userId: string;
  /** PayPal order id — drives the idempotency key. */
  orderId: string;
  paidAmount: string;
  currency?: string;
}

/**
 * Grant access to a purchased product and log the payment. Idempotent: if a
 * payment log row already exists for this order (e.g. the synchronous flow ran,
 * or the webhook is being retried), it does nothing.
 */
export async function fulfillPaypalPurchase(
  params: FulfillParams
): Promise<{ alreadyFulfilled: boolean }> {
  const { productType, productId, userId, orderId, paidAmount } = params;
  const currency = params.currency ?? "USD";
  const paymentId = paypalPaymentId(orderId);

  if (await isFulfilled(paymentId)) {
    return { alreadyFulfilled: true };
  }

  let productName: string;

  if (productType === "course") {
    const course = await db.query.courses.findFirst({ where: eq(courses.id, productId) });
    if (!course) throw new Error(`Course not found: ${productId}`);
    productName = course.title;

    await db
      .insert(usersToCourses)
      .values({ course_id: productId, user_id: userId })
      .onConflictDoNothing();

    const firstModule = await getFirstModuleOfCourse(productId);
    if (firstModule == undefined) throw new Error("First module not found");

    await db
      .insert(course_progress)
      .values({
        id: crypto.randomUUID(),
        isFinished: false,
        module_number: 0,
        user_id: userId,
        course_id: productId,
        module_id: firstModule.id,
      })
      .onConflictDoNothing();
  } else if (productType === "program") {
    const program = await db.query.program_schema.findFirst({
      where: eq(program_schema.id, productId),
    });
    if (!program) throw new Error(`Program not found: ${productId}`);
    productName = program.title;

    await db
      .insert(payments_on_users_program)
      .values({ program_id: productId, user_id: userId, payment_id: Date.now() })
      .onConflictDoNothing();
  } else {
    const ebook = await db.query.ebook_schema.findFirst({
      where: eq(ebook_schema.id, productId),
    });
    if (!ebook) throw new Error(`Ebook not found: ${productId}`);
    productName = ebook.title;

    await db
      .insert(payments_on_users_ebooks)
      .values({ ebook_id: productId, user_id: userId, payment_id: Date.now() })
      .onConflictDoNothing();
  }

  const amount = parseAmount(paidAmount);

  await db.insert(payment_log_schema).values({
    id: crypto.randomUUID(),
    payment_id: paymentId,
    user_id: userId,
    product_id: productId,
    product_name: productName,
    paid_amount: paidAmount,
    amount_cents: Math.round(amount * 100),
    payment_source: "paypal",
    currency,
  });

  // Emitted only on the non-idempotent path, so the synchronous capture and the
  // webhook racing over the same order can't book the sale twice.
  await captureServer("purchase_completed", userId, {
    product_type: productType,
    product_id: productId,
    product_name: productName,
    payment_id: paymentId,
    rail: "paypal",
    currency,
    amount,
  });

  if (productType === "course") {
    await captureServer("enrollment_granted", userId, {
      product_type: productType,
      product_id: productId,
      product_name: productName,
      source: "paypal",
    });
  }

  return { alreadyFulfilled: false };
}

/**
 * Revoke access after a refund/denied capture and record it in the payment log.
 * Best-effort: relies on the `custom_id` metadata being present on the event.
 */
export async function revokePaypalPurchase(params: {
  productType: PaypalProductType;
  productId: string;
  userId: string;
  refundId: string;
  refundedAmount?: string;
  currency?: string;
}): Promise<void> {
  const { productType, productId, userId, refundId } = params;
  const currency = params.currency ?? "USD";

  if (productType === "course") {
    await db
      .delete(usersToCourses)
      .where(and(eq(usersToCourses.user_id, userId), eq(usersToCourses.course_id, productId)));
    await db
      .delete(course_progress)
      .where(and(eq(course_progress.user_id, userId), eq(course_progress.course_id, productId)));
  } else if (productType === "program") {
    await db
      .delete(payments_on_users_program)
      .where(
        and(
          eq(payments_on_users_program.user_id, userId),
          eq(payments_on_users_program.program_id, productId)
        )
      );
  } else {
    await db
      .delete(payments_on_users_ebooks)
      .where(
        and(
          eq(payments_on_users_ebooks.user_id, userId),
          eq(payments_on_users_ebooks.ebook_id, productId)
        )
      );
  }

  const refundedAmount = params.refundedAmount
    ? parseAmount(params.refundedAmount)
    : undefined;

  await db.insert(payment_log_schema).values({
    id: crypto.randomUUID(),
    payment_id: `paypal_refund_${refundId}`,
    user_id: userId,
    product_id: productId,
    product_name: `Refund (${productType})`,
    paid_amount: params.refundedAmount ? `-${params.refundedAmount}` : null,
    amount_cents:
      refundedAmount != null ? -Math.round(refundedAmount * 100) : null,
    payment_source: "paypal",
    currency,
  });

  await captureServer("refund_processed", userId, {
    product_type: productType,
    product_id: productId,
    refund_id: refundId,
    rail: "paypal",
    currency,
    amount: refundedAmount,
  });
}
