import { Suspense } from "react";
import ProgramSection from "./ProgramsSection";
import { Metadata } from "next";
import EbookSection from "./EbookSection";
import CoursesSection from "./CoursesSection";
import { ProductsSidebar } from "./ProductsSidebar";
import { CoursesSectionSkeleton } from "./CourseCardSkeleton";
import { EbooksSectionSkeleton } from "./EbooksSectionSkeleton";
import { ProgramsSectionSkeleton } from "./ProgramCardSkeleton";
import { MyCoursesSection } from "./MyCoursesAndCoachingSection";
import { MyCoachingSection } from "./MyCoachingSection";
import { Skeleton } from "@/components/ui/skeleton";
import { TitleOfProduts } from "../_components/TitleOfProducts";

export const metadata: Metadata = {
  // Title composed from SITE.name rather than a hardcoded client brand — this
  // repo is redeployed per client.
  title: "Cursos, Ebooks y Programas",
  description:
    "Ebooks y programas para desarrollar tu conocimiento al máximo. Accedé a todo el catálogo.",
  alternates: { canonical: "/productos" },
};

function MyCoursesSkeleton() {
  return (
    <div>
      <TitleOfProduts
        title="MIS CURSOS"
        content="ACCEDE A TUS CURSOS COMPRADOS Y CONTINUA DONDE LO DEJASTE."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#111]"
          >
            <div className="flex flex-row">
              <Skeleton className="w-36 sm:w-44 shrink-0 min-h-[120px] rounded-none bg-neutral-800" />
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <Skeleton className="h-4 w-3/4 bg-neutral-800 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-2.5 w-16 bg-neutral-800" />
                    <Skeleton className="h-2.5 w-12 bg-neutral-800" />
                    <Skeleton className="h-2.5 w-10 bg-neutral-800" />
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full rounded-full bg-neutral-800 mt-3" />
              </div>
            </div>
            <div className="border-t border-neutral-800/60 bg-[#0c0c0c] px-4 py-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center flex-1">
                    <Skeleton className="h-6 w-6 rounded-full bg-neutral-800 shrink-0" />
                    {j < 4 && <Skeleton className="flex-1 h-px mx-0.5 bg-neutral-800" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyCoachingSkeleton() {
  return (
    <div>
      <TitleOfProduts
        title="MI COACHING"
        content="ACCEDE A TU COACHING ACTIVO Y TODAS SUS SALAS DISPONIBLES."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#141414]">
          <Skeleton className="aspect-video w-full rounded-none bg-neutral-800" />
          <div className="p-4">
            <Skeleton className="mb-2 h-5 w-3/4 bg-neutral-800" />
            <Skeleton className="mb-3 h-4 w-full bg-neutral-800" />
            <Skeleton className="h-3 w-24 bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProductsPage() {
  return (
    <div className="flex min-h-screen pt-16">
      <ProductsSidebar />
      <main className="flex-1 space-y-10 p-6 md:p-8 lg:p-10">
        <section id="mis-cursos">
          <Suspense fallback={<MyCoursesSkeleton />}>
            <MyCoursesSection />
          </Suspense>
        </section>
        <section id="mi-coaching">
          <Suspense fallback={<MyCoachingSkeleton />}>
            <MyCoachingSection />
          </Suspense>
        </section>
        <section id="cursos">
          <Suspense fallback={<CoursesSectionSkeleton />}>
            <CoursesSection isAdmin={false} />
          </Suspense>
        </section>
        <section id="ebooks">
          <Suspense fallback={<EbooksSectionSkeleton />}>
            <EbookSection isAdmin={false} />
          </Suspense>
        </section>
        <section id="programas">
          <Suspense fallback={<ProgramsSectionSkeleton />}>
            <ProgramSection isAdmin={false} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
