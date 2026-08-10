import { getCourse } from "@/lib/db/actions/courses/get_courses";
import { PreviewSidebar } from "@/components/course/PreviewSidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { noindexMetadata } from "@/lib/seo/private-metadata";

export const metadata = noindexMetadata("Vista previa");

export default async function PreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  const modules = course.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    items: mod.items.map((item) => ({
      id: item.id!,
      title: item.title,
      type: item.type,
      mux_playback_id: item.mux_playback_id,
      description: item.description,
    })),
  }));

  return (
    <div className="flex flex-col h-screen pt-16">
      {/* Top bar — below the fixed navbar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0a0a0a] px-6 py-3 shrink-0">
        <Link
          href={`/editarCurso/${id}`}
          className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al editor
        </Link>
        <div className="h-4 w-px bg-white/[0.08]" />
        <span className="text-xs font-semibold text-white/60 truncate">
          {course.title}
        </span>
      </div>

      {/* Main area: content + sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Main content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Sidebar — desktop only, full remaining height */}
        <div className="hidden w-[320px] shrink-0 lg:block border-l border-white/[0.06]">
          <PreviewSidebar
            courseId={id}
            courseTitle={course.title}
            modules={modules}
            examId={course.exam_id}
          />
        </div>
      </div>
    </div>
  );
}
