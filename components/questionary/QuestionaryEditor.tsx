"use client";

import { useState, useRef, useEffect } from "react";
import {
  PlusIcon,
  ClipboardList,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  CircleDot,
  CheckCircle2,
  Loader2,
  Cloud,
  CloudOff,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import {
  Option,
  QuestionGet,
  Questions,
  saveQuestionary,
} from "@/lib/db/actions/courses/questionary_actionst";

const AUTOSAVE_DELAY = 1500;

export function QuestionaryEditor({
  moduleItemId,
  courseId,
  initialQuestions,
}: {
  moduleItemId: string;
  courseId: string;
  initialQuestions?: Questions;
}) {
  const [questions, setQuestions] = useState<Questions>(initialQuestions ?? []);
  const [index, setIndex] = useState(0);
  const [questionTitle, setQuestionTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const lastSavedRef = useRef<string>(JSON.stringify(initialQuestions ?? []));
  const dirtyRef = useRef(false);

  // Add-option inline state
  const [newOptionTitle, setNewOptionTitle] = useState("");
  const [newOptionCorrect, setNewOptionCorrect] = useState(false);

  const currentQuestion = questions[index] ?? null;
  const totalQuestions = questions.length;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Mark dirty + schedule autosave only when questions actually change
  function updateQuestions(fn: (prev: Questions) => Questions) {
    setQuestions((prev) => {
      const next = fn(prev);
      const nextJson = JSON.stringify(next);
      if (nextJson !== lastSavedRef.current) {
        dirtyRef.current = true;
        scheduleSave(next);
      }
      return next;
    });
  }

  function scheduleSave(qs: Questions) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus("idle");
    timerRef.current = setTimeout(() => {
      doSave(qs);
    }, AUTOSAVE_DELAY);
  }

  async function doSave(qs: Questions) {
    if (qs.length === 0 || !dirtyRef.current) return;
    const snapshot = JSON.stringify(qs);
    if (snapshot === lastSavedRef.current) return;
    setSaveStatus("saving");
    try {
      await saveQuestionary(moduleItemId, qs);
      if (isMountedRef.current) {
        lastSavedRef.current = snapshot;
        dirtyRef.current = false;
        setSaveStatus("saved");
      }
    } catch {
      if (isMountedRef.current) setSaveStatus("error");
    }
  }

  function addOption(forceCorrect?: boolean) {
    if (!newOptionTitle.trim() || !currentQuestion) return;
    const newOption: Option = {
      id: crypto.randomUUID(),
      isCorrect: forceCorrect ?? newOptionCorrect,
      question_id: currentQuestion.id,
      title: newOptionTitle,
    };
    updateQuestions((prev) =>
      prev.map((q) =>
        q.id === currentQuestion.id
          ? { ...q, options: [...q.options, newOption] }
          : q
      )
    );
    setNewOptionTitle("");
    setNewOptionCorrect(false);
  }

  function deleteOption(optionId: string) {
    if (!currentQuestion) return;
    updateQuestions((prev) =>
      prev.map((q) =>
        q.id === currentQuestion.id
          ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
          : q
      )
    );
  }

  function deleteQuestion(questionId: string) {
    updateQuestions((prev) => prev.filter((q) => q.id !== questionId));
    if (index > 0 && index >= questions.length - 1) {
      setIndex(index - 1);
    }
  }

  return (
    <div className="space-y-4">
      {/* Question list pills + autosave indicator */}
      {totalQuestions > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIndex(i)}
              className={cn(
                "h-8 min-w-8 px-3 rounded-lg text-xs font-bold transition-all",
                i === index
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                  : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/60"
              )}
            >
              {i + 1}
            </button>
          ))}
          <Dialog>
            <DialogTrigger asChild>
              <button className="h-8 w-8 rounded-lg border border-dashed border-white/[0.12] text-white/30 hover:border-white/[0.25] hover:text-white/50 flex items-center justify-center transition-all">
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva pregunta</DialogTitle>
              </DialogHeader>
              <Input
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                placeholder="Escribe la pregunta..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && questionTitle.trim()) {
                    const newQuestion: QuestionGet = {
                      id: crypto.randomUUID(),
                      options: [],
                      title: questionTitle,
                      exam_id: null,
                      questionary_id: moduleItemId,
                    };
                    updateQuestions((q) => [...q, newQuestion]);
                    setIndex(questions.length);
                    setQuestionTitle("");
                  }
                }}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Cancelar
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    size="sm"
                    disabled={!questionTitle.trim()}
                    onClick={() => {
                      if (!questionTitle.trim()) return;
                      const newQuestion: QuestionGet = {
                        id: crypto.randomUUID(),
                        options: [],
                        title: questionTitle,
                        exam_id: null,
                        questionary_id: moduleItemId,
                      };
                      updateQuestions((q) => [...q, newQuestion]);
                      setIndex(questions.length);
                      setQuestionTitle("");
                    }}
                  >
                    Agregar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] min-h-[380px] flex flex-col overflow-hidden">
        {totalQuestions === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <ClipboardList className="h-8 w-8 text-white/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-white/50">Sin preguntas</p>
              <p className="text-xs text-white/30">Crea tu primera pregunta para armar el cuestionario</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="mt-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/40">
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Agregar pregunta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva pregunta</DialogTitle>
                </DialogHeader>
                <Input
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="Escribe la pregunta..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && questionTitle.trim()) {
                      const newQuestion: QuestionGet = {
                        id: crypto.randomUUID(),
                        options: [],
                        title: questionTitle,
                        exam_id: null,
                        questionary_id: moduleItemId,
                      };
                      updateQuestions((q) => [...q, newQuestion]);
                      setIndex(0);
                      setQuestionTitle("");
                    }
                  }}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      size="sm"
                      disabled={!questionTitle.trim()}
                      onClick={() => {
                        if (!questionTitle.trim()) return;
                        const newQuestion: QuestionGet = {
                          id: crypto.randomUUID(),
                          options: [],
                          title: questionTitle,
                          exam_id: null,
                          questionary_id: moduleItemId,
                        };
                        updateQuestions((q) => [...q, newQuestion]);
                        setIndex(0);
                        setQuestionTitle("");
                      }}
                    >
                      Agregar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : currentQuestion ? (
          <>
            {/* Question header */}
            <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/70">
                    Pregunta {index + 1} de {totalQuestions}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-white/90 leading-snug">
                  {currentQuestion.title}
                </h2>
              </div>
              <button
                onClick={() => setDeleteConfirmId(currentQuestion.id)}
                className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Eliminar pregunta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Options list */}
            <div className="flex-1 px-6 py-4 space-y-2">
              {currentQuestion.options.length === 0 && (
                <div className="py-8 text-center">
                  <CircleDot className="h-6 w-6 text-white/15 mx-auto mb-2" />
                  <p className="text-xs text-white/30">Agrega opciones de respuesta</p>
                </div>
              )}

              {currentQuestion.options.map((option, optIdx) => (
                <div
                  key={option.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-4 py-3 transition-all border",
                    option.isCorrect
                      ? "bg-emerald-500/[0.08] border-emerald-500/20"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                  )}
                >
                  {/* Letter badge */}
                  <span
                    className={cn(
                      "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
                      option.isCorrect
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.06] text-white/40"
                    )}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>

                  {/* Option text */}
                  <span className={cn(
                    "flex-1 text-sm font-medium",
                    option.isCorrect ? "text-emerald-300/90" : "text-white/70"
                  )}>
                    {option.title}
                  </span>

                  {/* Correct badge */}
                  {option.isCorrect && (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Correcta
                    </span>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => deleteOption(option.id)}
                    className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-white/0 group-hover:text-white/30 hover:!text-red-400 hover:!bg-red-500/10 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Inline add option */}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  value={newOptionTitle}
                  onChange={(e) => setNewOptionTitle(e.target.value)}
                  placeholder="Nueva respuesta..."
                  className="flex-1 h-9 bg-white/[0.03] border-white/[0.08] text-sm placeholder:text-white/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Checkbox
                    id="inline-correct"
                    checked={newOptionCorrect}
                    onCheckedChange={(checked) => {
                      const isCorrect = checked === true;
                      setNewOptionCorrect(isCorrect);
                      if (isCorrect && newOptionTitle.trim()) {
                        addOption(true);
                      }
                    }}
                    className="h-4 w-4 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <Label htmlFor="inline-correct" className="text-[11px] text-white/40 cursor-pointer select-none">
                    Correcta
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addOption()}
                  disabled={!newOptionTitle.trim()}
                  className="h-9 px-3 text-white/40 hover:text-white/80"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation footer */}
            <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
                className="text-white/40 hover:text-white/80 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={index >= totalQuestions - 1}
                onClick={() => setIndex((i) => i + 1)}
                className="text-white/40 hover:text-white/80 gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {/* Status bar */}
      {totalQuestions > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            {totalQuestions} {totalQuestions === 1 ? "pregunta" : "preguntas"} &middot;{" "}
            {questions.reduce((sum, q) => sum + q.options.length, 0)} opciones
          </p>
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-white/40">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Guardando...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-emerald-400/80">
                <Cloud className="h-3.5 w-3.5" />
                Guardado
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-red-400/80">
                <CloudOff className="h-3.5 w-3.5" />
                Error al guardar
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="flex items-center gap-1.5 text-white/20">
                <Cloud className="h-3.5 w-3.5" />
                Sin cambios
              </span>
            )}
          </div>
        </div>
      )}
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar pregunta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/50">
            Esta accion eliminara la pregunta y todas sus respuestas. No se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) deleteQuestion(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
