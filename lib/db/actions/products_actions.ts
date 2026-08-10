"use server";

import { ebook_query, my_ebooks_query, my_programs_query, programs_query } from "../queries/products_query";
import { InsertEbookSchema, ebook_insert_schema, ebook_schema, payments_on_users_ebooks } from '../schema/ebook_schema';
import { create_ebook_mutation, create_program_mutation } from "../mutations/products_mutations";
import { redirect } from "next/navigation";
import { insertProgramSchema, program_schema } from "../schema/program_schema";
import { db } from "..";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ProductAction } from "@/app/(home)/admin/AdminEditor";

export const getEbooks = async () => await ebook_query.execute();
export const getPrograms = async () => await programs_query.execute();

export type ProgramOutput = AwaitedReturn<typeof getPrograms>[number];
export type EbookOutput = AwaitedReturn<typeof getEbooks>[number];


export const getMyEbooks = async (user_id: string) => {
    // Use raw SQL query to avoid BLOB/JSON issues with relation queries
    const userEbooks = await db
        .select({
            id: ebook_schema.id,
            title: ebook_schema.title,
            description: ebook_schema.description,
            price: ebook_schema.price,
            img_url: ebook_schema.img_url,
            pdf_url: ebook_schema.pdf_url,
            card_color: ebook_schema.card_color,
            stats_values: ebook_schema.stats_values,
            stats_names: ebook_schema.stats_names,
        })
        .from(ebook_schema)
        .innerJoin(payments_on_users_ebooks, eq(ebook_schema.id, payments_on_users_ebooks.ebook_id))
        .where(eq(payments_on_users_ebooks.user_id, user_id));

    return userEbooks;
}

export const getMyPrograms = async (user_id: string) => {
    const userProgramsPayments = await my_programs_query(user_id).execute();
    const paid_courses = userProgramsPayments.map((e) => e.program);
    return paid_courses;
}

export async function createEbookAction(formData: FormData) {
    const actionType: ProductAction = formData.get("action_type") as ProductAction;
    const ebook_id = formData.get("ebook_id") as string | undefined;

    const ebookForm = {
        title: formData.get('title'),
        card_color: formData.get('cardColor'),
        description: formData.get('description'),
        id: crypto.randomUUID(),
        img_url: formData.get('img_url'),
        pdf_url: formData.get('pdf_url'),
        price: formData.get('price'),
        price_usd: formData.get('price_usd') || '0',
        stats_names: {
            stat1: formData.get('stat1'),
            stat2: formData.get('stat2'),
            stat3: formData.get('stat3'),

        },
        stats_values: {
            stat1: formData.get('value1'),
            stat2: formData.get('value2'),
            stat3: formData.get('value3')
        }
    }

    const parsedEbook = ebook_insert_schema.safeParse(ebookForm);

    if (parsedEbook.success) {


        if (actionType == 'create') {
            await create_ebook_mutation(parsedEbook.data)
            revalidatePath("/dashboard/ebook");
            redirect('/dashboard/ebook');
        } else {
            const { id, ...rest } = parsedEbook.data;
            console.log("Editing");
            await db.update(ebook_schema).set(rest).where(eq(ebook_schema.id, ebook_id!))
            revalidatePath("/dashboard/ebook");
            redirect('/dashboard/ebook');
        }

    } else {
        console.log('Error on parsing ebook', parsedEbook.error.flatten)
    }

}


export const deleteEbookAction = async (formData: FormData) => {
    const ebook_id = formData.get("ebook_id") as string;
    await db.delete(ebook_schema).where(eq(ebook_schema.id, ebook_id))
    console.log("Deleted Succesfully");
    revalidatePath("/editar");
}

export const deleteProgramAction = async (formData: FormData) => {
    const ebook_id = formData.get("program_id") as string;
    await db.delete(program_schema)
        .where(eq(program_schema.id, ebook_id))
    console.log("Deleted Succesfully");
    revalidatePath("/editar");
}


export async function createProgramAction(formData: FormData) {
    const actionType: ProductAction = formData.get("action_type") as ProductAction;
    const program_id = formData.get("program_id") as string | undefined;

    const form = {
        id: crypto.randomUUID(),
        title: formData.get('title'),
        description: formData.get('description'),
        price: formData.get('price'),
        price_usd: formData.get('price_usd') || '0',
        img_url: formData.get('img_url'),
        pdf_url: formData.get('pdf_url'),

    }

    const formParsed = insertProgramSchema.safeParse(form);

    if (formParsed.success) {
        if (actionType == 'create') {
            await create_program_mutation(formParsed.data);
            revalidatePath("/dashboard/program");
            redirect('/dashboard/program');
        } else {
            const { id, ...rest } = formParsed.data;
            console.log("Editing");
            await db.update(program_schema).set(rest).where(eq(program_schema.id, program_id!))
            revalidatePath("/dashboard/program");
            redirect('/dashboard/program');
        }

    }

    if (!formParsed.success) {
        console.log('FORM NOT PASSED');
        console.log(formParsed.error)

    }

}