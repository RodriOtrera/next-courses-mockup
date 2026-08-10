import { Skeleton } from "@/components/ui/skeleton";
import { TitleOfProduts } from "../_components/TitleOfProducts";

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#141414]">
      <Skeleton className="aspect-[18/6] w-full rounded-none bg-neutral-800" />
      <div className="p-4">
        <Skeleton className="mb-2 h-5 w-3/4 bg-neutral-800" />
        <Skeleton className="mb-3 h-4 w-full bg-neutral-800" />
        <Skeleton className="mb-1 h-4 w-2/3 bg-neutral-800" />
        <div className="mt-3 flex items-center gap-4">
          <Skeleton className="h-3 w-20 bg-neutral-800" />
          <Skeleton className="h-3 w-16 bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export function CoursesSectionSkeleton() {
  return (
    <div>
      <TitleOfProduts
        title="CURSOS"
        content="EN LOS CURSOS PODRAS TENER LA INFORMACION COMPLETA DEL ELEMENTO CON VIDEOS, PDFS Y CUESTIONARIOS PARA PROBAR TU SABIDURIA."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
