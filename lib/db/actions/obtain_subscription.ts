'use server';

import axios from "axios";

export async function obtainSubscription(id: string) {
    const url = `https://api.mercadopago.com/preapproval/${id}`;
    try {
        const response = await axios.get(url, {
            headers: {
                "Content-Type": 'application/json',
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
            }
        })

        console.log(response.data);
    }
    catch (error) {
        console.log(error);
    }
}