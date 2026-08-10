"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  PlusIcon,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Option,
  QuestionGet,
  Questions,
} from "@/lib/db/actions/courses/questionary_actionst";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** Soft red-tinted action: "Agregar pregunta" / "Agregar respuesta" */
const SOFT_ACTION =
  "gap-1.5 border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300";

/** Solid red action: same palette, filled style, reserved for the primary CTA */
const SOLID_ACTION =
  "gap-1.5 bg-red-600 font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-500 hover:shadow-red-500/30";

const CrearExamen = ({
  createQuestionary,
  course_id,
}: {
  createQuestionary: (questions: Questions) => Promise<void>;
  course_id: string;
}) => {
  const [questionary, setquestionary] = useState<Questions>([]);

  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    questionary.map(() => "")
  );
  const [questionTitle, setQuestionTitle] = useState("");
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const [optionOpen, setOptionOpen] = useState(false);
  const [optionTitle, setoptionTitle] = useState("");
  const [newResponseIsCorrect, setNewResponseIsCorrect] = useState(false);

  const [isPending, startTransition] = useTransition();

  const question = questionary[index];
  const currentQuestionSelected = selectedOptions[index] ?? "";
  const totalOptions = questionary.reduce((sum, q) => sum + q.options.length, 0);

  function addQuestion() {
    if (!questionTitle.trim()) return;
    const newQuestion: QuestionGet = {
      id: crypto.randomUUID(),
      options: [],
      title: questionTitle,
      exam_id: null,
      questionary_id: null,
    };
    setquestionary((q) => [...q, newQuestion]);
    setSelectedOptions((prev) => [...prev, ""]);
    setIndex(questionary.length);
    setQuestionTitle("");
    setOpen(false);
  }

  function addOption() {
    if (!optionTitle.trim() || !question) return;
    const newResponse: Option = {
      id: crypto.randomUUID(),
      isCorrect: newResponseIsCorrect,
      question_id: question.id,
      title: optionTitle,
    };
    setquestionary((prev) =>
      prev.map((e) =>
        e.id === question.id ? { ...e, options: [...e.options, newResponse] } : e
      )
    );
    setoptionTitle("");
    setNewResponseIsCorrect(false);
    setOptionOpen(false);
  }

  function deleteOption(option: Option) {
    setquestionary((prev) =>
      prev.map((e) =>
        e.id === option.question_id
          ? { ...e, options: e.options.filter((o) => o.id !== option.id) }
          : e
      )
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 p-6 pt-24 md:px-12 md:py-10 md:pt-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-red-400/80">
            Examen final
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white/90 md:text-3xl">
            Crear Examen
          </h1>
        </div>
        <Link
          href={`/editarCurso/${course_id}`}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/40 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al curso
        </Link>
      </div>

      {/* Main card */}
      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        {!question ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04]">
              <ClipboardList className="h-8 w-8 text-white/20" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-white/50">
                No se han creado preguntas!
              </p>
              <p className="text-xs text-white/30">
                Agrega la primera pregunta para armar el examen final
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Question header */}
            <div className="border-b border-white/[0.06] px-6 pb-5 pt-6">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-red-400/70">
                Pregunta {index + 1} de {questionary.length}
              </p>
              <h2 className="text-balance text-center text-xl font-bold leading-tight text-white/90 md:text-2xl">
                {question.title}
              </h2>
            </div>

            {/* Options */}
            <div className="flex-1 space-y-2 px-6 py-5">
              {question.options.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs text-white/30">
                    Esta pregunta todavia no tiene respuestas
                  </p>
                </div>
              )}

              {question.options.map((option, optIdx) => {
                const selected = currentQuestionSelected === option.id;
                return (
                  <div key={option.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = selectedOptions.map((e) => e);
                        updated[index] = selected ? "" : option.id;
                        setSelectedOptions(updated);
                      }}
                      className={cn(
                        "flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                        selected
                          ? option.isCorrect
                            ? "border-emerald-500/40 bg-emerald-500/[0.12]"
                            : "border-red-500/40 bg-red-500/[0.12]"
                          : option.isCorrect
                            ? "border-emerald-500/20 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12]"
                            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          option.isCorrect
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/[0.06] text-white/40"
                        )}
                      >
                        {LETTERS[optIdx] ?? optIdx + 1}
                      </span>

                      <span
                        className={cn(
                          "flex-1 text-sm font-medium",
                          option.isCorrect
                            ? "text-emerald-300/90"
                            : "text-white/70"
                        )}
                      >
                        {option.title}
                      </span>

                      {option.isCorrect ? (
                        <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Correcta
                        </span>
                      ) : (
                        selected && (
                          <XCircle className="h-4 w-4 shrink-0 text-red-400/80" />
                        )
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteOption(option)}
                      title="Eliminar respuesta"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/20 transition-all hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {question.options.length > 0 &&
                !question.options.some((o) => o.isCorrect) && (
                  <p className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-400/70">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Ninguna respuesta esta marcada como correcta
                  </p>
                )}

              {/* Add answer */}
              <Dialog open={optionOpen} onOpenChange={setOptionOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("mt-3", SOFT_ACTION)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Agregar respuesta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar respuesta</DialogTitle>
                  </DialogHeader>
                  <Input
                    value={optionTitle}
                    onChange={(e) => setoptionTitle(e.target.value)}
                    placeholder="Respuesta"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <div className="flex items-center gap-3 pl-1">
                    <Checkbox
                      id="esCorrecta"
                      checked={newResponseIsCorrect}
                      onCheckedChange={(checked) =>
                        setNewResponseIsCorrect(checked === true)
                      }
                      className="h-4 w-4 border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                    />
                    <Label
                      htmlFor="esCorrecta"
                      className="cursor-pointer select-none text-sm text-white/60"
                    >
                      Es correcta
                    </Label>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOptionOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      disabled={!optionTitle.trim()}
                      onClick={addOption}
                      className={SOLID_ACTION}
                    >
                      Agregar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Navigation footer */}
            <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
                className="gap-1 text-white/40 hover:text-white/80"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={index >= questionary.length - 1}
                onClick={() => setIndex((i) => i + 1)}
                className="gap-1 text-white/40 hover:text-white/80"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full sm:w-auto", SOFT_ACTION)}
            >
              <PlusIcon className="h-4 w-4" />
              Agregar pregunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar pregunta</DialogTitle>
            </DialogHeader>
            <Input
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder="Escribe la pregunta..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addQuestion();
                }
              }}
            />
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={!questionTitle.trim()}
                onClick={addQuestion}
                className={SOLID_ACTION}
              >
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          disabled={questionary.length === 0 || totalOptions === 0 || isPending}
          title={
            totalOptions === 0
              ? "Agrega al menos una respuesta antes de guardar"
              : undefined
          }
          onClick={() => {
            startTransition(async () => {
              await createQuestionary(questionary);
            });
          }}
          className={cn("w-full sm:w-auto", SOLID_ACTION)}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Guardar Examen
            </>
          )}
        </Button>
      </div>

      {questionary.length > 0 && (
        <p className="text-center text-xs text-white/30">
          {questionary.length}{" "}
          {questionary.length === 1 ? "pregunta" : "preguntas"} &middot;{" "}
          {totalOptions} {totalOptions === 1 ? "opcion" : "opciones"}
        </p>
      )}
    </div>
  );
};

export default CrearExamen;
