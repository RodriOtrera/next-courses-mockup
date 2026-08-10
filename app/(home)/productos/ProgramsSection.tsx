import {
  deleteProgramAction,
  getPrograms,
} from "@/lib/db/actions/products_actions";
import Program from "./Program";
import { TitleOfProduts } from "../_components/TitleOfProducts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export default async function ProgramsSection({
  isAdmin = false,
}: {
  isAdmin: boolean;
}) {
  const productos = await getPrograms();

  return (
    <section>
      <TitleOfProduts
        title="PROGRAMAS"
        content="LOS PROGRAMAS DE ENTRENAMIENTO SON PLANIFICACIONES ESPECÍFICOS PARA ELEMENTOS DE CALISTENIA CON DIFERENTES NIEVELES Y CLASES GRABADAS."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {productos.map((program) => (
          <div className="flex flex-col" key={program.id}>
            <Program key={program.id} {...program} action={() => {}} />

            {isAdmin && (
              <div className="flex items-center gap-2 mt-2">
                <Link href={`/admin/programs?programId=${program.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
                <form action={deleteProgramAction}>
                  <input type="hidden" name="program_id" value={program.id} />
                  <Button variant="outline" size="sm">
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
