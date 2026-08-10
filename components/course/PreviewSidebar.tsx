"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  FileTextIcon,
  BookCheck,
  Sparkles,
  Plus,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateModuleDialog } from "./CreateModuleDialog";
import { CreateModuleItemDialog } from "./CreateModuleItemDialog";

interface ModuleItem {
  id: string;
  title: string;
  type: string;
  mux_playback_id: string | null;
  description: string | null;
}

interface Module {
  id: string;
  title: string;
  items: ModuleItem[];
}

interface PreviewSidebarProps {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  examId?: string | null;
}

export function PreviewSidebar({
  courseId,
  courseTitle,
  modules,
  examId,
}: PreviewSidebarProps) {
  const pathname = usePathname();

  // Extract current moduleItemId from URL
  const segments = pathname.split("/");
  const previewIndex = segments.indexOf("preview");
  const currentItemId =
    previewIndex !== -1 ? segments[previewIndex + 1] ?? "" : "";

  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemDialogModuleId, setItemDialogModuleId] = useState("");

  // Flatten all items for progress calculation
  const allItems = modules.flatMap((m) => m.items);
  const currentItemIndex = allItems.findIndex((i) => i.id === currentItemId);
  const completedCount = currentItemIndex > 0 ? currentItemIndex : 0;
  const totalItems = allItems.length;
  const progressPercent =
    totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Auto-expand module containing the current item
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    modules.forEach((mod, index) => {
      const hasActive = mod.items.some((i) => i.id === currentItemId);
      newExpanded[mod.id] =
        hasActive ||
        (Object.keys(expandedModules).length === 0 && index === 0);
    });
    setExpandedModules((prev) => {
      const merged = { ...prev };
      Object.keys(newExpanded).forEach((key) => {
        if (newExpanded[key]) merged[key] = true;
      });
      return Object.keys(prev).length === 0 ? newExpanded : merged;
    });
  }, [currentItemId, modules]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddItem = (moduleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItemDialogModuleId(moduleId);
    setItemDialogOpen(true);
  };

  return (
    <>
      <aside className="flex h-full w-full flex-col bg-black/30">
        {/* Header */}
        <div className="border-b border-white/[0.06] p-4">
          <h2 className="text-sm font-bold text-white/80 tracking-tight line-clamp-1 mb-3">
            {courseTitle}
          </h2>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/30 uppercase tracking-wider">
              <span>Progreso</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="rounded-full bg-white/[0.04] p-3 mb-3">
                <Plus className="h-5 w-5 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/50">
                Sin contenido
              </p>
              <p className="text-xs text-white/25 mt-1 mb-4">
                Comienza creando tu primer modulo
              </p>
              <Button
                onClick={() => setModuleDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                Crear Modulo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((mod, moduleIndex) => {
                const isExpanded = expandedModules[mod.id];
                const hasActiveItem = mod.items.some(
                  (i) => i.id === currentItemId
                );

                return (
                  <div key={mod.id} className="space-y-0.5">
                    {/* Module header */}
                    <div
                      onClick={() => toggleModule(mod.id)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/[0.04] cursor-pointer",
                        hasActiveItem ? "text-red-400" : "text-white/60"
                      )}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        )}
                        <span className="flex items-center justify-center w-5 h-5 rounded bg-red-600/20 text-red-500 text-[10px] font-extrabold shrink-0">
                          {moduleIndex + 1}
                        </span>
                        <span className="truncate">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-white/25 shrink-0">
                          {mod.items.length}
                        </span>
                        <button
                          onClick={(e) => handleAddItem(mod.id, e)}
                          className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] transition-all"
                        >
                          <Plus className="h-3 w-3 text-white/40" />
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    {isExpanded && (
                      <div className="space-y-0.5 pl-3 relative">
                        {/* Vertical connector line */}
                        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-white/[0.04]" />

                        {mod.items.map((item) => {
                          const isActive = item.id === currentItemId;
                          const isCompleted =
                            currentItemIndex > -1 &&
                            allItems.indexOf(item) < currentItemIndex;

                          return (
                            <Link
                              key={item.id}
                              href={`/editarCurso/${courseId}/preview/${item.id}`}
                              className={cn(
                                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ml-2",
                                isActive
                                  ? "bg-red-500/10 text-red-400 font-medium"
                                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                              )}
                            >
                              {/* Status icon */}
                              <div className="relative z-10 shrink-0">
                                {isActive ? (
                                  <PlayCircle className="h-4 w-4 text-red-400 animate-pulse" />
                                ) : isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500/70" />
                                ) : item.type === "video" ? (
                                  <PlayCircle className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                ) : item.type === "pdf" ? (
                                  <FileTextIcon className="h-4 w-4 text-blue-400/30" />
                                ) : (
                                  <BookCheck className="h-4 w-4 text-green-400/30" />
                                )}
                              </div>

                              {/* Title */}
                              <span className="flex-1 truncate text-xs leading-tight">
                                {item.title}
                              </span>

                              {/* Indicators */}
                              <div className="flex items-center gap-1 shrink-0">
                                {item.description && (
                                  <Sparkles className="h-2.5 w-2.5 text-purple-400/50" />
                                )}
                              </div>
                            </Link>
                          );
                        })}

                        {/* Add item button when module is empty */}
                        {mod.items.length === 0 && (
                          <button
                            onClick={(e) => handleAddItem(mod.id, e)}
                            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/[0.08] px-3 py-2 text-xs text-white/25 transition-colors hover:border-white/[0.15] hover:bg-white/[0.02] hover:text-white/40 ml-2"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Agregar clase</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Exam link */}
        <div className="border-t border-white/[0.06] px-3 py-2">
          {examId ? (
            <Link
              href={`/editarExamen?course_id=${courseId}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all bg-amber-500/[0.06] border border-amber-500/15 hover:bg-amber-500/[0.1] hover:border-amber-500/25"
            >
              <Award className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-amber-300/90 text-xs">Editar Examen Final</span>
            </Link>
          ) : (
            <Link
              href={`/crearExamen?course_id=${courseId}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border border-dashed border-white/[0.1] hover:bg-white/[0.03] hover:border-white/[0.18]"
            >
              <Plus className="h-4 w-4 text-white/30 shrink-0" />
              <span className="text-white/40 text-xs">Crear Examen Final</span>
            </Link>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 border-t border-white/[0.06] p-3 bg-black/20">
          <Button
            onClick={() => setModuleDialogOpen(true)}
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
          >
            <Plus className="h-3 w-3" />
            Modulo
          </Button>
          {modules.length > 0 && (
            <Button
              onClick={(e) =>
                handleAddItem(modules[modules.length - 1].id, e)
              }
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
            >
              <Plus className="h-3 w-3" />
              Clase
            </Button>
          )}
        </div>
      </aside>

      <CreateModuleDialog
        courseId={courseId}
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
      />

      {itemDialogModuleId && (
        <CreateModuleItemDialog
          courseId={courseId}
          moduleId={itemDialogModuleId}
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}
        />
      )}
    </>
  );
}
