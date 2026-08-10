import { Skeleton } from "@/components/ui/skeleton";
import { TitleOfProduts } from "../_components/TitleOfProducts";

export function ProgramCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#141414]">
      <Skeleton className="aspect-video w-full rounded-none bg-neutral-800" />
      <div className="p-4">
        <Skeleton className="mb-2 h-5 w-3/4 bg-neutral-800" />
        <Skeleton className="mb-3 h-4 w-full bg-neutral-800" />
        <Skeleton className="h-4 w-1/2 bg-neutral-800" />
        <Skeleton className="mt-3 h-8 w-20 bg-neutral-800 rounded-md" />
      </div>
    </div>
  );
}

export function ProgramsSectionSkeleton() {
  return (
    <div>
      <TitleOfProduts
        title="PROGRAMAS"
        content="LOS PROGRAMAS DE ENTRENAMIENTO SON PLANIFICACIONES ESPECÍFICOS PARA ELEMENTOS DE CALISTENIA CON DIFERENTES NIEVELES Y CLASES GRABADAS."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProgramCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
