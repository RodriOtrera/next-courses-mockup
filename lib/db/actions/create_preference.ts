import axios from "axios";
import { PreferenceRequest, PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { absoluteUrl } from "@/lib/seo/site";

export type ProductType = "ebook" | "program" | "course"

export interface MetadataPreference {
    user_id: string,
    user_email: string,
    product_type: ProductType,
    product_id: string,
    product_title: string


}

export type PreferenceInputType = {
    title: string;
    descripcion: string;
    price: number;
    item_id: string;
    metadata: MetadataPreference


}
export const createPreferenceResponse = async ({ item_id, price, title, metadata, descripcion }: PreferenceInputType): Promise<PreferenceResponse> => {
    const body: PreferenceRequest = {
        metadata: metadata,
        auto_return: 'all',
        // Resolved from the deployment's own origin. These used to be hardcoded
        // to the previous client's domain, which sent buyers on any other
        // deployment to somebody else's site after checkout.
        back_urls: {
            success: absoluteUrl('/payment/success'),
            failure: absoluteUrl('/payment/error'),
        },
        binary_mode: true,
        items: [
            {
                id: item_id,
                quantity: 1,
                title: title,
                unit_price: price,
            },
        ],
    };


    return (await axios.post('https://api.mercadopago.com/checkout/preferences', body, {
        headers: {
            "Content-Type": 'application/json',
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
        }
    })).data;
}