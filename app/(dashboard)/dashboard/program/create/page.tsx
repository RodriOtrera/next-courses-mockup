import ProgramsAdminEditor from "@/app/(home)/admin/programs/ProgramsEditor";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function CreateProgramPage() {
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
          Crear Programa <span className="text-red-400">.</span>
        </h1>
      </div>

      <ProgramsAdminEditor />
    </div>
  );
}
