"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Check,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Questions } from "@/lib/db/actions/courses/questionary_actionst";

const CuestionarioState = ({ questions }: { questions: Questions }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    questions.map(() => "")
  );
  const [index, setIndex] = useState(0);
  const [finishedQuestionary, setFinishedQuestionary] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[index];

  // Calculate score
  const correctCount = questions.reduce((count, q, i) => {
    const selectedId = selectedOptions[i];
    const selected = q.options.find((o) => o.id === selectedId);
    return count + (selected?.isCorrect ? 1 : 0);
  }, 0);

  function restart() {
    setSelectedOptions(questions.map(() => ""));
    setIndex(0);
    setFinishedQuestionary(false);
  }

  if (finishedQuestionary) {
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    return (
      <div className="w-full max-w-[800px] mx-auto space-y-6">
        {/* Score header */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <div
            className={cn(
              "h-20 w-20 rounded-2xl mx-auto mb-4 flex items-center justify-center",
              scorePercent >= 70
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-amber-500/10 border border-amber-500/20"
            )}
          >
            <Trophy
              className={cn(
                "h-10 w-10",
                scorePercent >= 70 ? "text-emerald-400" : "text-amber-400"
              )}
            />
          </div>
          <h1 className="text-2xl font-bold text-white/90 mb-1">
            Cuestionario completado
          </h1>
          <p className="text-white/40 text-sm mb-4">
            Respondiste correctamente{" "}
            <span
              className={cn(
                "font-bold",
                scorePercent >= 70 ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {correctCount} de {totalQuestions}
            </span>{" "}
            preguntas ({scorePercent}%)
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                scorePercent >= 70 ? "bg-emerald-500" : "bg-amber-500"
              )}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {/* Answers review */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
          {questions.map((q, qIdx) => {
            const selectedId = selectedOptions[qIdx];
            const selectedOption = q.options.find((o) => o.id === selectedId);
            const correctOption = q.options.find((o) => o.isCorrect);
            const isCorrect = selectedOption?.isCorrect ?? false;

            return (
              <div key={q.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center",
                      isCorrect
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    )}
                  >
                    {isCorrect ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 mb-1.5">
                      <span className="text-white/30 mr-1.5">{qIdx + 1}.</span>
                      {q.title}
                    </p>

                    {/* Correct answer */}
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{correctOption?.title ?? "—"}</span>
                    </div>

                    {/* User's wrong answer */}
                    {!isCorrect && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400/60 mt-1">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>
                          {selectedOption
                            ? selectedOption.title
                            : "No elegiste respuesta"}
                        </span>
                        <span className="text-white/20">(tu respuesta)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Retry */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            className="text-white/40 hover:text-white/80 gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-4">
      {/* Question pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {questions.map((q, i) => {
          const answered = selectedOptions[i] !== "";
          const isCurrent = i === index;
          return (
            <button
              key={q.id}
              onClick={() => setIndex(i)}
              className={cn(
                "h-8 min-w-8 px-3 rounded-lg text-xs font-bold transition-all",
                isCurrent
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                  : answered
                    ? "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20"
                    : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/60"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] min-h-[380px] flex flex-col overflow-hidden">
        {/* Question header */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/70 mb-1.5 block">
            Pregunta {index + 1} de {totalQuestions}
          </span>
          <h2 className="text-lg font-semibold text-white/90 leading-snug">
            {currentQuestion.title}
          </h2>
        </div>

        {/* Options */}
        <div className="flex-1 px-6 py-4 space-y-2">
          {currentQuestion.options.map((option, optIdx) => {
            const isSelected = selectedOptions[index] === option.id;
            const hasAnswered = selectedOptions[index] !== "";

            // Determine state
            let state: "idle" | "selected-correct" | "selected-wrong" | "reveal-correct" = "idle";
            if (hasAnswered) {
              if (isSelected && option.isCorrect) state = "selected-correct";
              else if (isSelected && !option.isCorrect) state = "selected-wrong";
              else if (!isSelected && option.isCorrect) state = "reveal-correct";
            }

            return (
              <button
                key={option.id}
                onClick={() => {
                  if (hasAnswered) return; // Already answered
                  const updated = [...selectedOptions];
                  updated[index] = option.id;
                  setSelectedOptions(updated);
                }}
                disabled={hasAnswered}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-4 py-3.5 transition-all border text-left",
                  state === "idle" && !hasAnswered &&
                    "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] cursor-pointer",
                  state === "idle" && hasAnswered &&
                    "bg-white/[0.02] border-white/[0.04] opacity-50",
                  state === "selected-correct" &&
                    "bg-emerald-500/[0.08] border-emerald-500/30",
                  state === "selected-wrong" &&
                    "bg-red-500/[0.08] border-red-500/30",
                  state === "reveal-correct" &&
                    "bg-emerald-500/[0.05] border-emerald-500/15"
                )}
              >
                {/* Letter badge */}
                <span
                  className={cn(
                    "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    state === "selected-correct" && "bg-emerald-500/20 text-emerald-400",
                    state === "selected-wrong" && "bg-red-500/20 text-red-400",
                    state === "reveal-correct" && "bg-emerald-500/15 text-emerald-400/70",
                    state === "idle" && "bg-white/[0.06] text-white/40"
                  )}
                >
                  {state === "selected-correct" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : state === "selected-wrong" ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : state === "reveal-correct" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    String.fromCharCode(65 + optIdx)
                  )}
                </span>

                {/* Text */}
                <span
                  className={cn(
                    "flex-1 text-sm font-medium",
                    state === "selected-correct" && "text-emerald-300/90",
                    state === "selected-wrong" && "text-red-300/90",
                    state === "reveal-correct" && "text-emerald-300/70",
                    state === "idle" && "text-white/70"
                  )}
                >
                  {option.title}
                </span>

                {/* Status label */}
                {state === "selected-correct" && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                    Correcta
                  </span>
                )}
                {state === "selected-wrong" && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-red-400/80">
                    Incorrecta
                  </span>
                )}
                {state === "reveal-correct" && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
                    Correcta
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
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

          {index >= totalQuestions - 1 ? (
            <Button
              size="sm"
              onClick={() => setFinishedQuestionary(true)}
              className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/40 gap-1.5"
            >
              Terminar cuestionario
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex((i) => i + 1)}
              className="text-white/40 hover:text-white/80 gap-1"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-white/30">
          {selectedOptions.filter((s) => s !== "").length} de {totalQuestions} respondidas
        </p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 w-4 rounded-full transition-all",
                selectedOptions[i] !== ""
                  ? "bg-emerald-500/50"
                  : i === index
                    ? "bg-red-400/40"
                    : "bg-white/[0.08]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CuestionarioState;
