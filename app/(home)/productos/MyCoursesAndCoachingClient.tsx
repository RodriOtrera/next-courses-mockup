"use client";

import { CourseProgressSelection } from "@/lib/db/actions/courses_progress_actions";
import { CoachingView } from "@/lib/db/actions/subscription/subscriptions";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Layers,
  Play,
} from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";

export function MyCoachingClient({ coaching }: { coaching: CoachingView }) {
  const router = useRouter();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        onClick={() => router.push(`/coaching/${coaching.id}`)}
        className="group cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-[#141414] shadow-sm transition-all hover:shadow-md hover:border-red-500/40"
      >
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-red-600/20 to-purple-600/20 flex items-center justify-center">
          {coaching.salas[0]?.img_url ? (
            <Image
              src={coaching.salas[0].img_url}
              alt={coaching.name}
              fill
              className="object-cover transition-transform group-hover:scale-105 opacity-60"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown className="h-12 w-12 text-yellow-400 drop-shadow-lg" />
          </div>
          <div className="absolute left-2 top-2 rounded-lg bg-red-600/90 px-2 py-1 text-xs font-bold text-white">
            COACHING ACTIVO
          </div>
        </div>
        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-red-500">
            {coaching.name}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-gray-400">
            {coaching.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <BookOpen className="h-3 w-3" />
            {coaching.salas.length} Salas disponibles
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyCoursesClient({
  courseProgress,
}: {
  courseProgress: CourseProgressSelection[];
}) {
  const router = useRouter();

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {courseProgress.map((cp, cardIndex) => {
        const progressPercent = Math.round(cp.rating * 100);
        const completedModules = cp.moduleBreakdown.filter(
          (m) => m.isCompleted
        ).length;

        return (
          <motion.div
            key={cp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cardIndex * 0.1, duration: 0.4 }}
            onClick={() =>
              router.push(
                `/module/${cp.module_id}?course=${cp.course_id}&course_progress=${cp.id}`
              )
            }
            className="group cursor-pointer overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#111] transition-all hover:border-neutral-700 flex flex-col"
          >
            {/* Top: image left + info right */}
            <div className="flex flex-row">
              {/* Course image */}
              <div className="relative w-36 sm:w-44 shrink-0 overflow-hidden">
                {cp.courseImgUrl ? (
                  <Image
                    src={cp.courseImgUrl}
                    alt={cp.courseTitle}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]/80" />

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                    <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                  </div>
                </div>

                {/* Status badge */}
                {cp.isFinished ? (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 backdrop-blur-md uppercase tracking-wider">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Listo
                  </div>
                ) : (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur-md uppercase tracking-wider">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Activo
                  </div>
                )}
              </div>

              {/* Right: info */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
                    {cp.courseTitle}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Layers className="h-2.5 w-2.5" />
                      {cp.totalModules} modulos
                    </span>
                    {cp.courseDuracion && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {cp.courseDuracion}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {completedModules}/{cp.totalModules}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                      Progreso
                    </span>
                    <span className="text-xs font-bold text-red-400 tabular-nums">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-600 to-red-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{
                        duration: 0.8,
                        delay: cardIndex * 0.1 + 0.3,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                {cp.isFinished && !cp.certification_id && cp.exam_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/examen?exam_id=${cp.exam_id}&course_id=${cp.course_id}`
                      );
                    }}
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors w-fit"
                  >
                    <FileText className="h-3 w-3" />
                    Dar examen
                  </button>
                )}
                {cp.certification_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/certificados/${cp.certification_id}`);
                    }}
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors w-fit"
                  >
                    <Award className="h-3 w-3" />
                    Certificado
                  </button>
                )}
              </div>
            </div>

            {/* Bottom: module timeline */}
            {cp.moduleBreakdown.length > 0 && (
              <div className="border-t border-neutral-800/60 bg-[#0c0c0c] px-4 py-3 mt-auto">
                <div className="flex items-center gap-1">
                  {cp.moduleBreakdown.map((mod, i) => {
                    const isLast = i === cp.moduleBreakdown.length - 1;

                    return (
                      <div
                        key={mod.id}
                        className="flex items-center flex-1 min-w-0"
                      >
                        <div className="relative group/mod flex flex-col items-center">
                          <div
                            className={`
                              flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-all
                              ${
                                mod.isCompleted
                                  ? "bg-red-600/20 text-red-400 border border-red-600/40"
                                  : mod.isCurrent
                                    ? "bg-red-600 text-white border border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                                    : "bg-neutral-800/60 text-neutral-600 border border-neutral-700/50"
                              }
                            `}
                          >
                            {mod.isCompleted ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              i + 1
                            )}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover/mod:block z-10">
                            <div className="whitespace-nowrap rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-xs shadow-xl">
                              <p className="font-semibold text-white">
                                {mod.title}
                              </p>
                              <p className="text-neutral-400 mt-0.5">
                                {mod.itemCount}{" "}
                                {mod.itemCount === 1 ? "leccion" : "lecciones"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {!isLast && (
                          <div className="flex-1 h-px mx-0.5">
                            <div
                              className={`h-full ${
                                mod.isCompleted
                                  ? "bg-red-600/40"
                                  : "bg-neutral-800"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Current module label */}
                {!cp.isFinished && cp.moduleBreakdown[cp.currentModuleIndex] && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <ChevronRight className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="truncate">
                      <span className="text-white font-medium">
                        {cp.moduleBreakdown[cp.currentModuleIndex].title}
                      </span>
                      <span className="text-neutral-600 mx-1">·</span>
                      <span className="text-neutral-500">
                        {cp.moduleTitle}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
