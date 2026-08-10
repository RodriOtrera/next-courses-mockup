"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Languages,
  Loader2,
  MinusCircle,
  Plus,
} from "lucide-react";
import {
  advanceCaptionsAction,
  backfillCaptions,
  type CaptionState,
} from "@/lib/db/actions/mux/caption_actions";
import type { CaptionTrackSummary } from "@/lib/db/schema/video_tracks";
import { AUTO_LANGUAGE, languageDisplayName } from "@/lib/mux/caption_languages";
import { CaptionLanguagePicker } from "./CaptionLanguagePicker";

const POLL_INTERVAL_MS = 5000;

interface CaptionStatusProps {
  moduleItemId: string;
  courseId?: string;
  initialState?: CaptionState;
  /** Start polling immediately — the caller just kicked off an upload. */
  autoStart?: boolean;
}

/**
 * Per-language subtitle chips plus the "add subtitles" panel.
 *
 * Polling is what drives the pipeline while this is on screen: each tick both
 * advances the state machine server-side and returns where it got to. It stops
 * as soon as nothing is left in flight, and `/api/cron/captions` finishes the
 * job if the creator navigates away first.
 */
export function CaptionStatus({
  moduleItemId,
  courseId,
  initialState,
  autoStart = false,
}: CaptionStatusProps) {
  const router = useRouter();
  const [state, setState] = useState<CaptionState | null>(initialState ?? null);
  const [polling, setPolling] = useState(autoStart);
  const [expanded, setExpanded] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState(AUTO_LANGUAGE);
  const [targets, setTargets] = useState<string[]>([]);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillError, setBackfillError] = useState<string | null>(null);

  // The description arriving is what the surrounding server component needs to
  // re-render for, and it lands exactly once.
  const refreshedRef = useRef(false);

  const tick = useCallback(async () => {
    const result = await advanceCaptionsAction({ moduleItemId });
    const next = result?.data;
    if (!next) return;

    setState(next);
    if (next.description && !refreshedRef.current) {
      refreshedRef.current = true;
      router.refresh();
    }
    if (!next.working) {
      setPolling(false);
      router.refresh();
    }
  }, [moduleItemId, router]);

  useEffect(() => {
    if (!polling) return;
    let cancelled = false;

    const run = async () => {
      try {
        if (!cancelled) await tick();
      } catch {
        // A failed tick is not worth surfacing: the next one, or the cron
        // sweep, picks the work back up.
      }
    };

    void run();
    const id = setInterval(run, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [polling, tick]);

  const tracks = state?.tracks ?? [];
  const busy = tracks.some(
    (t) =>
      t.status === "pending" ||
      t.status === "generating" ||
      t.status === "translating",
  );
  const readyLanguages = tracks
    .filter((t) => t.status === "ready")
    .map((t) => t.languageCode);
  const spokenLanguage =
    state?.detectedLanguage ?? state?.sourceLanguage ?? AUTO_LANGUAGE;

  const failures = tracks.filter(
    (t) => (t.status === "errored" || t.status === "skipped") && t.errorMessage,
  );

  const handleBackfill = async () => {
    setBackfilling(true);
    setBackfillError(null);
    try {
      const result = await backfillCaptions({
        moduleItemId,
        courseId,
        sourceLanguage,
        targetLanguages: targets,
      });
      if (result?.serverError) {
        setBackfillError(result.serverError);
        return;
      }
      setExpanded(false);
      setTargets([]);
      setPolling(true);
    } catch (err) {
      setBackfillError(
        err instanceof Error ? err.message : "No se pudo agregar subtitulos",
      );
    } finally {
      setBackfilling(false);
    }
  };

  // Nothing to show and nothing to offer.
  if (tracks.length === 0 && !polling && !expanded) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between gap-3">
        <p className="text-xs text-white/40">
          Este video no tiene subtitulos generados
        </p>
        <button
          onClick={() => setExpanded(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20 cursor-pointer"
        >
          <Languages className="h-3 w-3" />
          Generar subtitulos
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Languages className="h-3 w-3 text-red-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            Subtitulos
          </span>
        </div>
        {!busy && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-white/40 transition-colors hover:text-white/70 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            {tracks.length > 0 ? "Agregar o reintentar" : "Agregar idiomas"}
          </button>
        )}
      </div>

      {tracks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tracks.map((track) => (
            <CaptionChip key={track.id} track={track} />
          ))}
        </div>
      )}

      {failures.length > 0 && (
        <ul className="space-y-1">
          {failures.map((track) => (
            <li
              key={track.id}
              className="flex items-start gap-1.5 text-[11px] text-white/35"
            >
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400/60" />
              <span>
                <span className="text-white/50">
                  {languageDisplayName(track.languageCode)}
                </span>
                {" — "}
                {track.errorMessage}
              </span>
            </li>
          ))}
        </ul>
      )}

      {expanded && (
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <CaptionLanguagePicker
            idPrefix={`backfill-${moduleItemId}`}
            sourceLanguage={spokenLanguage}
            onSourceChange={
              state?.detectedLanguage ? undefined : setSourceLanguage
            }
            targets={targets}
            onToggleTarget={(code) =>
              setTargets((prev) =>
                prev.includes(code)
                  ? prev.filter((c) => c !== code)
                  : [...prev, code],
              )
            }
            disabled={backfilling}
            lockedLanguages={readyLanguages}
          />

          {backfillError && (
            <p className="text-[11px] text-red-400/80">{backfillError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleBackfill}
              disabled={backfilling}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/20 disabled:opacity-40 cursor-pointer"
            >
              {backfilling ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Languages className="h-3 w-3" />
              )}
              Generar
            </button>
            <button
              onClick={() => setExpanded(false)}
              disabled={backfilling}
              className="text-xs text-white/30 transition-colors hover:text-white/60 disabled:opacity-40 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CHIP_LABEL: Record<CaptionTrackSummary["status"], string> = {
  pending: "En cola",
  generating: "Transcribiendo",
  translating: "Traduciendo",
  ready: "Listo",
  errored: "Fallo",
  skipped: "Omitido",
};

function CaptionChip({ track }: { track: CaptionTrackSummary }) {
  const spinning =
    track.status === "pending" ||
    track.status === "generating" ||
    track.status === "translating";

  const label =
    track.languageCode === AUTO_LANGUAGE
      ? "Original"
      : languageDisplayName(track.languageCode);

  const tone =
    track.status === "ready"
      ? "border-green-500/20 bg-green-500/10 text-green-400"
      : track.status === "errored"
        ? "border-red-500/20 bg-red-500/10 text-red-400/80"
        : track.status === "skipped"
          ? "border-white/[0.08] bg-white/[0.02] text-white/30"
          : "border-white/[0.08] bg-white/[0.03] text-white/50";

  return (
    <span
      title={track.errorMessage ?? undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}
    >
      {spinning ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : track.status === "ready" ? (
        <Check className="h-3 w-3" />
      ) : track.status === "skipped" ? (
        <MinusCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      <span>{label}</span>
      <span className="text-white/25">·</span>
      <span className="font-normal opacity-70">{CHIP_LABEL[track.status]}</span>
    </span>
  );
}
