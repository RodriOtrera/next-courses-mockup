import { db } from "@/lib/db";
import { type MetadataPreference } from "@/lib/db/actions/create_preference";
import { getFirstModuleOfCourse } from "@/lib/db/actions/edit/modules_actions";
import { course_progress } from "@/lib/db/schema/course_progress";
import { PaymentInsertSchema, payment_schema_ebook, payments_on_users_ebooks } from "@/lib/db/schema/ebook_schema";
import { payment_log_schema } from "@/lib/db/schema/payment_log_schema";
import { payment_schema_program, payments_on_users_program } from "@/lib/db/schema/program_schema";
import { usersToCourses } from "@/lib/db/schema/users_to_courses";
import { paymentNotification } from "@/lib/types/payment_notification";
import { captureServer } from "@/lib/analytics/server";
import axios from "axios";
import { type PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
    const body_data = await new Response(req.body).json();

    const paymentNotificationParsed = paymentNotification.safeParse(body_data);
    // console.log("RECEIVING NOTIFICATION WEBHOOK", body_data);
    // if (body_data.type === 'subscription_preapproval') {
    //     obtainSubscription(body_data.data.id);
    //     return NextResponse.json({ message: "Subscription searched" }, { status: 200 });
    // } else {
    //     console.log('OTHER TYPE OF NOTIFICATION')
    //     return NextResponse.json({ message: "Ok" }, { status: 200 });
    // }
    if (!paymentNotificationParsed.success) return NextResponse.json({ message: "No Payment notification" }, { status: 200 });

    const notification = paymentNotificationParsed.data;

    const paymentUrl = `https://api.mercadopago.com/v1/payments/${+notification.data.id}`

    try {
        const payment: PaymentResponse = (await axios.get(paymentUrl, {
            headers: {
                "Content-Type": 'application/json',
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
            }
        })).data;


        if (payment.status_detail == 'accredited' && payment.status == 'approved') {
            const metadata = payment.metadata as MetadataPreference;
            const paymentInsertValues: PaymentInsertSchema = {
                id: payment.id!,
                item_title: metadata.product_title,
                net_amount: Math.round(payment.transaction_details!.net_received_amount!),
                payer_email: payment.payer!.email,
                payerName: payment.payer!.first_name
            }
            console.log('PAYMENT ID', payment.id);

            const netAmount = payment.transaction_details!.net_received_amount!;
            const amountCents = Math.round(netAmount * 100);

            // MercadoPago takes the buyer off-site, so this webhook is the only
            // place the sale can be observed at all. Shared across the three
            // product branches below so the payload can't drift between them.
            const trackPurchase = () =>
                captureServer("purchase_completed", metadata.user_id, {
                    product_type: metadata.product_type,
                    product_id: metadata.product_id,
                    product_name: metadata.product_title,
                    payment_id: `${payment.id!}`,
                    rail: "mercadopago",
                    currency: "ARS",
                    amount: netAmount,
                });




            if (metadata.product_type == "ebook") {

                console.log(paymentInsertValues);
                await db.insert(payment_log_schema).values({
                    payment_id: `${payment.id!}`,
                    user_id: metadata.user_id,
                    product_name: metadata.product_title,
                    id: crypto.randomUUID(),
                    paid_amount: `${netAmount}`,
                    amount_cents: amountCents,
                    payment_source: 'mercadopago',
                    currency: 'ARS',
                });
                await db.insert(payments_on_users_ebooks).values({
                    ebook_id: metadata.product_id,
                    payment_id: payment.id!,
                    user_id: metadata.user_id,
                });
                console.log('ebook bought!!');
                await trackPurchase();
                return NextResponse.json({ message: "Payment Succesfull!!" }, { status: 200 });
            }

            if (metadata.product_type == 'program') {
                await db.insert(payments_on_users_program).values({
                    program_id: metadata.product_id,
                    payment_id: payment.id!,
                    user_id: metadata.user_id,
                });
                await db.insert(payment_log_schema).values({
                    payment_id: `${payment.id!}`,
                    user_id: metadata.user_id,
                    product_name: metadata.product_title,
                    id: crypto.randomUUID(),
                    paid_amount: `${netAmount}`,
                    amount_cents: amountCents,
                    payment_source: 'mercadopago',
                    currency: 'ARS',
                });
                await trackPurchase();
                return NextResponse.json({ message: "Payment Succesfull!!" }, { status: 200 });
            }

            if (metadata.product_type == 'course') {
                await db.insert(usersToCourses).values({ course_id: metadata.product_id, user_id: metadata.user_id });
                const firstModule = await getFirstModuleOfCourse(metadata.product_id);
                if (firstModule == undefined) {
                    throw Error('First Module not found!');
                }
                await db.insert(course_progress).values({
                    id: crypto.randomUUID(),
                    isFinished: false,
                    module_number: 0,
                    user_id: metadata.user_id,
                    course_id: metadata.product_id,
                    module_id: firstModule.id
                })

                await db.insert(payment_log_schema).values({
                    payment_id: `${payment.id!}`,
                    user_id: metadata.user_id,
                    product_name: metadata.product_title,
                    id: crypto.randomUUID(),
                    paid_amount: `${netAmount}`,
                    amount_cents: amountCents,
                    payment_source: 'mercadopago',
                    currency: 'ARS',
                });
                console.log('course bought!!');

                await trackPurchase();
                await captureServer("enrollment_granted", metadata.user_id, {
                    product_type: metadata.product_type,
                    product_id: metadata.product_id,
                    product_name: metadata.product_title,
                    source: "mercadopago",
                });

                return NextResponse.json({ message: "Payment Succesfull!!" }, { status: 200 });
            }
        } else {
            // Not approved/accredited — declined cards, pending transfers, and
            // fraud holds all land here and are otherwise invisible.
            const metadata = payment.metadata as MetadataPreference | undefined;
            if (metadata?.user_id) {
                await captureServer("webhook_rejected", metadata.user_id, {
                    rail: "mercadopago",
                    status: payment.status ?? undefined,
                    reason: payment.status_detail ?? "unknown",
                });
            }
        }


    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "ERRO ON SAVING TO DB" }, { status: 500 });

    }


    return NextResponse.json({ message: "Payment Succesfull!!" }, { status: 400 });






}


export { handler as GET, handler as POST };

