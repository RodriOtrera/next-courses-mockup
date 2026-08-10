import { getPrograms } from "@/lib/db/actions/products_actions";
import ProgramDashboardCard from "./ProgramDashboardCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default async function ProgramDashboardPage() {
  const programs = await getPrograms();

  return (
    <div className="min-h-screen px-5 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Programas <span className="text-red-400">.</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {programs.length} programas en total
          </p>
        </div>
        <Link href="/dashboard/program/create">
          <Button variant="outline" size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Crear Programa
          </Button>
        </Link>
      </div>

      {programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
          <p className="text-sm">No hay programas creados aun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {programs.map((program) => (
            <ProgramDashboardCard key={program.id} {...program} />
          ))}
        </div>
      )}
    </div>
  );
}
