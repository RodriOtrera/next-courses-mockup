import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { listCourses } from "@/lib/db/queries/courses";
import { priceFormatter as arsFormatter } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Cursos",
  description:
    "Explorá todos los cursos disponibles: contenido en video, módulos descargables y acceso de por vida.",
  alternates: { canonical: "/courses" },
};

// The catalogue changes whenever a course is published. Without this the page
// is prerendered once at build and frozen — new courses never appear.
export const revalidate = 3600;

export default async function CoursesPage() {
  const courses = await listCourses();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Cursos
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            {courses.length} {courses.length === 1 ? "curso" : "cursos"}{" "}
            {courses.length === 1 ? "disponible" : "disponibles"}
          </p>
        </header>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function CourseCard({
  course,
}: {
  course: Awaited<ReturnType<typeof listCourses>>[number];
}) {
  const rating = Number.isFinite(course.rating) ? course.rating : null;
  const lessonCount = course.modules?.length ?? 0;

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group block overflow-hidden rounded-xl border border-neutral-800/60 bg-[#111111] transition-colors hover:border-neutral-700"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
        <Image
          src={course.img_url ?? "/imagen-prueba-2.jpg"}
          alt={course.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="p-4 space-y-3">
        <h2 className="text-base font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
          {course.title}
        </h2>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          {course.duracion && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {course.duracion}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {lessonCount} {lessonCount === 1 ? "módulo" : "módulos"}
          </span>
          {rating !== null && rating > 0 && (
            <span className="text-amber-400">★ {rating.toFixed(1)}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
          <span className="text-sm font-medium">
            {/* 0 means "ask us", not "free" — matches CourseContainer and is
                why no Offer is emitted for it in the structured data. */}
            {course.price > 0
              ? arsFormatter.format(course.price)
              : "Consultar"}
          </span>
          {course.price_usd > 0 && (
            <span className="text-xs text-neutral-500">
              USD {course.price_usd}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
      <p className="text-sm text-neutral-400">
        Todavía no hay cursos publicados.
      </p>
    </div>
  );
}
