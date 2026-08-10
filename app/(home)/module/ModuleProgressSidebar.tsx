"use client";
import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  PlayCircle,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseModules } from "@/lib/db/actions/courses/course_and_module";
import { authClient } from "@/lib/auth/client";
import XpMeter from "@/components/gamification/XpMeter";

/**
 * What `/api/coursemodules` returns: the course, scoped to this learner —
 * `course_progress` is stripped server-side and `certifications` is filtered to
 * the caller — plus their XP state.
 */
type CourseSidebarData = Omit<NonNullable<CourseModules>, "course_progress"> & {
  completed_item_ids: string[];
  total_xp: number;
};

const ModuleProgressSidebar = ({
  course_id,
  module_item_id,
}: {
  course_id: string;
  module_item_id: string;
}) => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  /** Lessons that flipped to complete on this render pass — they get the pop. */
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());
  const seenCompleted = useRef<Set<string> | null>(null);

  const { data: course } = useQuery({
    // The key has to carry course_id — without it two courses share one cache
    // entry and the sidebar shows the wrong lessons.
    queryKey: ["modules", course_id],
    queryFn: async () => {
      return axios
        .post("/api/coursemodules", { course_id })
        .then((response) => response.data as CourseSidebarData);
    },
    staleTime: 50000,
    gcTime: 6000000,
  });

  // Auto-expand the module containing the current item
  useEffect(() => {
    if (!course) return;
    const activeModule = course.modules.find((m) =>
      m.items.some((item) => item.id === module_item_id)
    );
    if (activeModule) {
      setExpandedModules((prev) => ({ ...prev, [activeModule.id]: true }));
    }
  }, [course, module_item_id]);

  // Diff each refetch against the last one so only the newly-earned lesson
  // animates. Replaying every checkmark on every navigation would be noise.
  useEffect(() => {
    if (!course) return;
    const ids = new Set(course.completed_item_ids ?? []);
    const previous = seenCompleted.current;
    seenCompleted.current = ids;

    if (!previous) return; // first load is a reveal, not an achievement
    const fresh = [...ids].filter((id) => !previous.has(id));
    if (fresh.length === 0) return;

    setJustCompleted(new Set(fresh));
    const timer = setTimeout(() => setJustCompleted(new Set()), 1200);
    return () => clearTimeout(timer);
  }, [course]);

  if (!course) {
    return (
      <div className="flex h-full w-full flex-col border-l border-neutral-800 bg-neutral-950/50 p-5">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-2 w-full mb-6" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const allItems = course.modules.flatMap((m) => m.items);
  const currentIndex = allItems.findIndex((e) => e.id === module_item_id);
  const totalModules = allItems.length;

  // Completion is whatever the XP ledger says was actually finished — not the
  // cursor's position, which used to mark everything before it complete as soon
  // as a learner skipped ahead.
  const completedIds = new Set(course.completed_item_ids ?? []);
  const completedCount = allItems.filter((e) => completedIds.has(e.id)).length;
  const progressPercent =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  return (
    <aside className="flex h-full w-full flex-col border-l border-neutral-800 bg-neutral-950/50">
      {/* Header */}
      <div className="border-b border-neutral-800 p-5">
        <h2 className="text-base font-bold tracking-tight text-white line-clamp-2 mb-4">
          {course.title}
        </h2>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-400">
            <span className="uppercase tracking-wider">Progreso</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#ec4e39] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {user && (
          <XpMeter
            totalXp={course.total_xp ?? 0}
            variant="compact"
            className="mt-4"
          />
        )}
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-3">
          {course.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules[module.id];
            const hasActiveItem = module.items.some(
              (item) => item.id === module_item_id
            );

            return (
              <div key={module.id} className="space-y-1">
                {/* Module header */}
                <div
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-800/50 cursor-pointer",
                    hasActiveItem ? "text-[#ec4e39]" : "text-white"
                  )}
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />
                    )}
                    <span className="truncate">{module.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-normal shrink-0 ml-2">
                    {module.items.length} lecciones
                  </span>
                </div>

                {/* Items */}
                {isExpanded && (
                  <div className="space-y-0.5 pl-2 relative">
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-neutral-800" />

                    {module.items.map((item, itemIndex) => {
                      const isActive = item.id === module_item_id;
                      const isCompleted = completedIds.has(item.id);
                      const isFreshlyCompleted = justCompleted.has(item.id);

                      return (
                        <Link
                          key={item.id}
                          href={`/module/${item.id}?course=${course_id}`}
                          className="block"
                        >
                          <div
                            className={cn(
                              "group relative ml-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-200",
                              isActive
                                ? "bg-[#ec4e39]/10 text-[#ec4e39] font-medium"
                                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white",
                              isFreshlyCompleted && "bg-emerald-500/10"
                            )}
                          >
                            {/* Status icon */}
                            <div className="relative z-10 flex shrink-0 items-center justify-center">
                              {isActive ? (
                                <PlayCircle className="h-4 w-4 fill-[#ec4e39]/20 text-[#ec4e39] animate-pulse" />
                              ) : isCompleted ? (
                                <CheckCircle2
                                  className={cn(
                                    "h-4 w-4 text-emerald-500",
                                    isFreshlyCompleted && "xp-check-pop"
                                  )}
                                />
                              ) : (
                                <Circle className="h-4 w-4 text-neutral-600" />
                              )}
                            </div>

                            {/* Number + Title */}
                            <span className="text-neutral-500 font-semibold shrink-0">
                              {moduleIndex + 1}.{itemIndex + 1}
                            </span>
                            <span className="flex-1 truncate leading-tight">
                              {item.title}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation footer */}
      {(() => {
        const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
        const nextItem =
          currentIndex < allItems.length - 1
            ? allItems[currentIndex + 1]
            : null;
        const isLastItem = currentIndex === allItems.length - 1;
        const userCertification = course.certifications?.find(
          (c) => c.user_id === user?.id
        );

        return (
          <div className="border-t border-neutral-800 p-3 space-y-2">
            {/* Counter */}
            <div className="text-center text-[11px] font-bold uppercase tracking-widest text-neutral-500">
              Clase {currentIndex + 1} / {totalModules}
            </div>

            {/* Certification button */}
            {userCertification && (
              <Link
                href={`/certificados/${userCertification.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <Award className="h-4 w-4" />
                Ver Certificado
              </Link>
            )}

            {/* Prev / Next buttons */}
            <div className="flex gap-2">
              {prevItem ? (
                <Link
                  href={`/module/${prevItem.id}?course=${course_id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Link>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800/50 py-2 text-xs font-medium text-neutral-700">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </div>
              )}
              {nextItem ? (
                <Link
                  href={`/module/${nextItem.id}?course=${course_id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#ec4e39]/30 bg-[#ec4e39]/10 py-2 text-xs font-medium text-[#ec4e39] hover:bg-[#ec4e39]/20 transition-colors"
                >
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : isLastItem && course.exam_id && !userCertification ? (
                <Link
                  href={`/examen?course_id=${course_id}&exam_id=${course.exam_id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#ec4e39]/30 bg-[#ec4e39]/10 py-2 text-xs font-medium text-[#ec4e39] hover:bg-[#ec4e39]/20 transition-colors"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Realizar Examen
                </Link>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800/50 py-2 text-xs font-medium text-neutral-700">
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </aside>
  );
};

export default ModuleProgressSidebar;
