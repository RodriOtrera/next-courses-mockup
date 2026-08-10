"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { generateDescriptionFromVideo } from "@/lib/db/actions/mux/ai_actions";
import { Sparkles, Loader2, CheckCircle } from "lucide-react";

interface GenerateDescriptionButtonProps {
  playbackId: string;
  title: string;
  moduleItemId: string;
}

export function GenerateDescriptionButton({
  playbackId,
  title,
  moduleItemId,
}: GenerateDescriptionButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [description, setDescription] = useState<string | null>(null);

  const { execute } = useAction(generateDescriptionFromVideo, {
    onSuccess: (result) => {
      // The description now comes from Mux's ASR transcript, which takes
      // minutes on a video that has never been transcribed. `pending` means
      // the work is under way — the subtitle panel's poller (and the cron
      // sweep behind it) finishes the job and refreshes the page.
      if (result.data?.pending) {
        setStatus("generating");
        return;
      }
      setDescription(result.data?.description ?? null);
      setStatus("done");
      router.refresh();
    },
    onError: () => {
      setStatus("error");
    },
  });

  const handleGenerate = () => {
    setStatus("generating");
    execute({ playbackId, title, moduleItemId });
  };

  if (status === "generating") {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
        <p className="text-xs text-white/50">
          Transcribiendo el audio y generando la descripcion...
        </p>
      </div>
    );
  }

  if (status === "done" && description) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">
            Descripcion
          </span>
          <CheckCircle className="h-3 w-3 text-green-400" />
        </div>
        <p className="text-base leading-relaxed text-white/70">{description}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between">
      <p className="text-xs text-white/40">
        {status === "error"
          ? "No se pudo generar la descripcion. El video puede seguir procesandose."
          : "Este video aun no tiene descripcion"}
      </p>
      <button
        onClick={handleGenerate}
        className="flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all cursor-pointer shrink-0"
      >
        <Sparkles className="h-3 w-3" />
        {status === "error" ? "Reintentar" : "Generar descripcion"}
      </button>
    </div>
  );
}
