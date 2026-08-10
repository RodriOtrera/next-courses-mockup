import ProgramsAdminEditor from "@/app/(home)/admin/programs/ProgramsEditor";
import { db } from "@/lib/db";
import { program_schema } from "@/lib/db/schema/program_schema";
import { eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EditProgramPage(
  props: PageParams<{ id: string }>
) {
  const { id } = await props.params;

  const program = (
    await db.select().from(program_schema).where(eq(program_schema.id, id))
  )[0];

  if (!program) {
    redirect("/dashboard/program");
  }

  return (
    <div className="min-h-screen px-5 sm:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/program"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a Programas
        </Link>
        <h1 className="text-xl font-semibold text-white">
          Editar Programa <span className="text-red-400">.</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">{program.title}</p>
      </div>

      <ProgramsAdminEditor program={program} />
    </div>
  );
}
