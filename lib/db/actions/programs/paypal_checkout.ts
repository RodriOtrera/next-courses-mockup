"use server";
import { headers } from "next/headers";
import { db } from '../..';
import { program_schema } from '../../schema/program_schema';
import { eq } from 'drizzle-orm';
import { auth } from "@/lib/auth";
import { createPaypalOrder, capturePaypalOrder } from "../../../paypal/rest";
import { encodePaypalCustomId, fulfillPaypalPurchase, assertCaptureMatchesTracked } from "../../../paypal/fulfillment";

async function currentUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
}

export async function programPaypalAction(program_id: string) {
    const user = await currentUser();
    if (user == null) {
        throw Error("User not logged in");
    }

    const program = await db.query.program_schema.findFirst({
        where: eq(program_schema.id, program_id),
    });
    if (!program) {
        throw Error("Program not found");
    }

    return await createPaypalOrder({
        value: program.price_usd.toString(),
        description: program.title,
        customId: encodePaypalCustomId({
            productType: "program",
            productId: program_id,
            userId: user.id,
        }),
    });
}

export async function obtainProgramAction(program_id: string, order_id: string) {
    const user = await currentUser();
    if (user == null) {
        throw Error("User not logged in");
    }

    const program = await db.query.program_schema.findFirst({
        where: eq(program_schema.id, program_id),
    });
    if (!program) {
        throw Error("Program not found");
    }

    const captureResponse = await capturePaypalOrder(order_id);
    // Reject the purchase unless PayPal captured exactly the program price.
    const captured = await assertCaptureMatchesTracked(
        captureResponse,
        { value: program.price_usd.toString() },
        { userId: user.id, orderId: order_id, productType: "program", productId: program_id }
    );

    await fulfillPaypalPurchase({
        productType: "program",
        productId: program_id,
        userId: user.id,
        orderId: order_id,
        paidAmount: captured.value,
        currency: captured.currency_code,
    });
}
