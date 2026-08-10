import { getCourse } from "@/lib/db/actions/courses/get_courses";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default async function PreviewIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  // Find first module item and redirect
  for (const mod of course.modules) {
    if (mod.items.length > 0) {
      redirect(`/editarCurso/${id}/preview/${mod.items[0].id}`);
    }
  }

  // No items — empty state
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-white/20" />
        <h2 className="mb-2 text-lg font-semibold text-white/80">
          Sin contenido
        </h2>
        <p className="mb-6 text-sm text-white/40">
          Agrega modulos y clases al curso para ver la vista previa.
        </p>
        <Link
          href={`/editarCurso/${id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          Volver al editor
        </Link>
      </div>
    </div>
  );
}
