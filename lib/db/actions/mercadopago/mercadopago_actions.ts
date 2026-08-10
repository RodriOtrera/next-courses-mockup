"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "../..";
import { ebook_schema } from "../../schema/ebook_schema";
import { program_schema } from "../../schema/program_schema";
import { MetadataPreference, PreferenceInputType, ProductType, createPreferenceResponse } from "../create_preference";
import { currentUser } from "@/lib/auth/server";



export async function createPreference(item_id: string, item_type: ProductType, form: FormData) {

    const session = await currentUser();
    if (session == null) return;


    if (item_type == 'ebook') {
        const ebook = (await db.select().from(ebook_schema).where(eq(ebook_schema.id, item_id)))[0];
        const metadata: MetadataPreference = {
            user_email: session.email,
            user_id: session.id,
            product_type: item_type,
            product_id: item_id,
            product_title: ebook.title
        };

        const preferenceInput: PreferenceInputType = {
            metadata: metadata,
            descripcion: `Ebook sobre ${ebook.title}`,
            item_id: ebook.id,
            price: ebook.price,
            title: `${ebook.title} ${item_type.charAt(0).toUpperCase()
                + item_type.slice(1)}`

        }
        const response = await createPreferenceResponse(preferenceInput);
        redirect(process.env.NODE_ENV === 'development' ? response.init_point! : response.init_point!);

    }

    if (item_type == 'program') {
        const program = (await db.select().from(program_schema).where(eq(program_schema.id, item_id)))[0];
        const metadata: MetadataPreference = {
            user_email: session.email,
            user_id: session.id,
            product_type: item_type,
            product_id: item_id,
            product_title: program.title
        };

        const preferenceInput: PreferenceInputType = {
            metadata: metadata,
            descripcion: `Programa sobre ${program.title}`,
            item_id: program.id,
            price: program.price,
            title: `${program.title} ${item_type.charAt(0).toUpperCase()
                + item_type.slice(1)}`

        }

        const response = await createPreferenceResponse(preferenceInput);
        redirect(process.env.NODE_ENV === 'development' ? response.init_point! : response.init_point!);
    }



}