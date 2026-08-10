import { Skeleton } from "@/components/ui/skeleton";
import { TitleOfProduts } from "../_components/TitleOfProducts";

function EbookCardSkeleton() {
  return (
    <div className="mx-4 h-[440px] w-[280px] overflow-hidden rounded-lg bg-gradient-to-br from-red-950 from-70% via-black via-[5%] to-slate-900 shadow-lg shadow-black">
      <div className="relative flex h-[225px] flex-col items-center">
        <Skeleton className="m-4 h-[200px] w-[200px] rounded bg-neutral-800/40" />
      </div>
      <div className="px-4">
        <Skeleton className="h-8 w-3/4 rounded bg-neutral-800/40 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded bg-neutral-800/40" />
              <Skeleton className="h-2 w-[200px] rounded bg-neutral-800/40" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-8 w-24 self-end rounded-md bg-neutral-800/40 ml-auto" />
      </div>
    </div>
  );
}

export function EbooksSectionSkeleton() {
  return (
    <div>
      <TitleOfProduts
        title="Ebooks"
        content="LOS EBOOKS SON LIBROS DIGITALES CON TODOS LOS CONOCIMIENTOS NECESARIOS PARA LOGRAR OBTENER TUS OBJETIVOS DENTRO DE LA CALISTENIA"
      />
      <div className="flex flex-wrap justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <EbookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
