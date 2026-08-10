"use server";
import { db } from "..";
import { card_schema } from "../schema/card_price";
import z from 'zod';
import { action } from "./safe_action";

export const updateCard = action
    .schema(z.object({
        price_dollars: z.number(),
        price_pesos: z.number()
    })).action(async ({ parsedInput: { price_dollars, price_pesos } }) => {
        await db.update(card_schema).set({ price_dollars, price_pesos });
    })
