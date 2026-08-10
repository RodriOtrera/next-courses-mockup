import AdminEditor from "@/app/(home)/admin/AdminEditor";
import { db } from "@/lib/db";
import { ebook_schema } from "@/lib/db/schema/ebook_schema";
import { eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EditEbookPage(
  props: PageParams<{ id: string }>
) {
  const { id } = await props.params;

  const ebook = (
    await db.select().from(ebook_schema).where(eq(ebook_schema.id, id))
  )[0];

  if (!ebook) {
    redirect("/dashboard/ebook");
  }

  return (
    <div className="min-h-screen px-5 sm:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/ebook"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a Ebooks
        </Link>
        <h1 className="text-xl font-semibold text-white">
          Editar Ebook <span className="text-red-400">.</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">{ebook.title}</p>
      </div>

      <AdminEditor ebook={ebook} />
    </div>
  );
}
