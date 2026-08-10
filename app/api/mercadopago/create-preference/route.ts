import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ebook_schema } from "@/lib/db/schema/ebook_schema";
import { program_schema } from "@/lib/db/schema/program_schema";
import {
    MetadataPreference,
    PreferenceInputType,
    ProductType,
    createPreferenceResponse,
} from "@/lib/db/actions/create_preference";
import { currentUser } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
    try {
        const session = await currentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { item_id, item_type } = (await request.json()) as {
            item_id: string;
            item_type: ProductType;
        };

        if (!item_id || !item_type) {
            return NextResponse.json(
                { error: "Missing item_id or item_type" },
                { status: 400 }
            );
        }

        let preferenceUrl: string | undefined;

        if (item_type === "ebook") {
            const ebook = (
                await db
                    .select()
                    .from(ebook_schema)
                    .where(eq(ebook_schema.id, item_id))
            )[0];

            if (!ebook) {
                return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
            }

            const metadata: MetadataPreference = {
                user_email: session.email,
                user_id: session.id,
                product_type: item_type,
                product_id: item_id,
                product_title: ebook.title,
            };

            const preferenceInput: PreferenceInputType = {
                metadata: metadata,
                descripcion: `Ebook sobre ${ebook.title}`,
                item_id: ebook.id,
                price: ebook.price,
                title: `${ebook.title} ${item_type.charAt(0).toUpperCase() + item_type.slice(1)}`,
            };

            const response = await createPreferenceResponse(preferenceInput);
            preferenceUrl = response.init_point;
        }

        if (item_type === "program") {
            const program = (
                await db
                    .select()
                    .from(program_schema)
                    .where(eq(program_schema.id, item_id))
            )[0];

            if (!program) {
                return NextResponse.json(
                    { error: "Program not found" },
                    { status: 404 }
                );
            }

            const metadata: MetadataPreference = {
                user_email: session.email,
                user_id: session.id,
                product_type: item_type,
                product_id: item_id,
                product_title: program.title,
            };

            const preferenceInput: PreferenceInputType = {
                metadata: metadata,
                descripcion: `Programa sobre ${program.title}`,
                item_id: program.id,
                price: program.price,
                title: `${program.title} ${item_type.charAt(0).toUpperCase() + item_type.slice(1)}`,
            };

            const response = await createPreferenceResponse(preferenceInput);
            preferenceUrl = response.init_point;
        }

        if (!preferenceUrl) {
            return NextResponse.json(
                { error: "Invalid product type" },
                { status: 400 }
            );
        }

        return NextResponse.json({ url: preferenceUrl });
    } catch (error) {
        console.error("Error creating preference:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
