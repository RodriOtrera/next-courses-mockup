"use server";

import axios from "axios";
import { MercadoPagoConfig, Payment, Customer, CustomerCard, CardToken } from 'mercadopago';

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../..";
import { users } from "../../schema/auth_schema";
import { subscription } from "../../schema/subscrition_schema";


export async function createSubscriptionOrActivate(formData: FormData) {
    const userId: string = formData.get('user_id') as string;
    const userWithSub = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
            subscriptions: true,

        }
    })
    if (userWithSub == undefined) {
        throw Error('USER NOT EXIST FINDING ITS SUBSCRIPTION')
    }

    // `users.subscriptions` is a `many` relation, so this is an array — the app
    // only ever creates one row per user, so look at the first.
    const existingSubscription = userWithSub.subscriptions[0];

    if (existingSubscription) {
        // `updatedAt` is a pg timestamp column in date mode — it takes a Date,
        // not a formatted string.
        const updatedAtValue = new Date();

        await db.update(subscription).set({ active: true, updatedAt: updatedAtValue }).where(eq(subscription.id, existingSubscription.id))
    } else {
        await db.insert(subscription).values({ active: true, id: crypto.randomUUID(), mercadopagoId: 999999, userId: userId })
    }

    revalidatePath('/subscripciones')


}

export async function cancelSubscription(formData: FormData) {
    const subId = formData.get('subId') as string;

    await db.update(subscription).set({ active: false }).where(eq(subscription.id, subId));
    revalidatePath('/subscripciones')

}

// export async function createSubscription() {
//     const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
//     const customer = new Customer(client);

//     const body = {
//         email: "test_user_181789422@testuser.com"
//     };

//     const customerFromMP = await customer.search({ options: { email: "test_user_181789422@testuser.com" } })
//     const searchedCustomerId = customerFromMP!.results![0]!;
//     // customer.create({ body: { identification: { number: 'kdhsfioafdihai' }, email: "test_user_1763654825@testuser.com" }, }).then((result) => {
//     const customerCard = new CustomerCard(client);
//     axios.post("https://api.mercadopago.com/v1/customers/{customer_id}/cards", {

//     })
//     const cardToken = new CardToken({accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
//     cardToken.create({body: {}})
//     //     console.log(result)

//     // })



//     // },)
//     // const body = {
//     //     back_url: "https://localhost:3000",
//     //     auto_recurring: {
//     //         frequency: 1,
//     //         frequency_type: 'monts',
//     //         transaction_amount: 1000,
//     //         currency_id: "ARS"
//     //     },
//     //     reason: 'Subscripcion a Coaching',
//     //     status: 'pending',
//     //     payer_email: "rodrigo.otrerafornes@gmail.com"
//     // };
//     // const data = (await axios.post('https://api.mercadopago.com/preapproval', body, {
//     //     headers: {
//     //         "Content-Type": 'application/json',
//     //         Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
//     //     }
//     // })).data;
//     // console.log(data)
// }

