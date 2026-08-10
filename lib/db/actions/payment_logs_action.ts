"use server"

import { db } from "..";
import { payment_log_schema } from "../schema/payment_log_schema";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPaymentLogs() {
    const paymentLogs = await db.query.payment_log_schema.findMany(
        {
            with: {
                user: true
            },
            orderBy: [desc(payment_log_schema.created_at)]
        }
    );
    return paymentLogs;
}

export type PaymentLog = Awaited<ReturnType<typeof getPaymentLogs>>[number];
export async function createTestPaymentLog() {
    const sources = ['mercadopago', 'paypal'] as const;
    const source = sources[Math.floor(Math.random() * sources.length)];
    const isMp = source === 'mercadopago';

    await db.insert(payment_log_schema).values({
        id: crypto.randomUUID(),
        payment_id: crypto.randomUUID(),
        user_id: 'user_2aYNwDadYhtig1ibh8kVTxBFff2',
        paid_amount: isMp ? '35000' : '29.99',
        product_id: '1',
        product_name: 'Programa de Coaching',
        payment_source: source,
        currency: isMp ? 'ARS' : 'USD',
    });
    revalidatePath('/dashboard');
}

