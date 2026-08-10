"use server";
import axios from "axios";
import { absoluteUrl } from "@/lib/seo/site";

export async function createSubscription() {
    const url = `https://api.mercadopago.com/preapproval_plan`;

   
   try {
    const response = await axios.post(url, {
        reason: "Subscription",
        auto_recurring: {
            frequency: 1,
            frequency_type: "months",
        },
        back_url: absoluteUrl('/'),

    },
        {
            headers: {
                "Content-Type": 'application/json',
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
            }
        })

        console.log(response.data);
        console.log('Subscription created');

   } catch (error) {
     console.log(error)
   }
    
}