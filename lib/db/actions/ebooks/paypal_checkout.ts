"use server";
import { headers } from "next/headers";
import { db } from '../..';
import { ebook_schema } from '../../schema/ebook_schema';
import { eq } from 'drizzle-orm';
import { auth } from "@/lib/auth";
import { createPaypalOrder, capturePaypalOrder } from "../../../paypal/rest";
import { encodePaypalCustomId, fulfillPaypalPurchase, assertCaptureMatchesTracked } from "../../../paypal/fulfillment";

async function currentUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
}

export async function ebookPaypalAction(ebook_id: string) {
    const user = await currentUser();
    if (user == null) {
        throw Error("User not logged in");
    }

    const ebook = await db.query.ebook_schema.findFirst({
        where: eq(ebook_schema.id, ebook_id),
    });
    if (!ebook) {
        throw Error("Ebook not found");
    }

    return await createPaypalOrder({
        value: ebook.price_usd.toString(),
        description: ebook.title,
        customId: encodePaypalCustomId({
            productType: "ebook",
            productId: ebook_id,
            userId: user.id,
        }),
    });
}

export async function obtainEbookAction(ebook_id: string, order_id: string) {
    const user = await currentUser();
    if (user == null) {
        throw Error("User not logged in");
    }

    const ebook = await db.query.ebook_schema.findFirst({
        where: eq(ebook_schema.id, ebook_id),
    });
    if (!ebook) {
        throw Error("Ebook not found");
    }

    const captureResponse = await capturePaypalOrder(order_id);
    // Reject the purchase unless PayPal captured exactly the ebook price.
    const captured = await assertCaptureMatchesTracked(
        captureResponse,
        { value: ebook.price_usd.toString() },
        { userId: user.id, orderId: order_id, productType: "ebook", productId: ebook_id }
    );

    await fulfillPaypalPurchase({
        productType: "ebook",
        productId: ebook_id,
        userId: user.id,
        orderId: order_id,
        paidAmount: captured.value,
        currency: captured.currency_code,
    });
}
