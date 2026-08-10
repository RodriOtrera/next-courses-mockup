"use client";

import { Languages } from "lucide-react";
import {
  AUTO_LANGUAGE,
  CAPTION_LANGUAGES,
  languageDisplayName,
} from "@/lib/mux/caption_languages";

interface CaptionLanguagePickerProps {
  sourceLanguage: string;
  /** Omit to hide the spoken-language select (it's already known). */
  onSourceChange?: (next: string) => void;
  targets: string[];
  onToggleTarget: (code: string) => void;
  disabled?: boolean;
  /** Languages that already have working subtitles — not re-translatable. */
  lockedLanguages?: readonly string[];
  idPrefix: string;
}

/**
 * Shared by the upload card and the per-lesson "add subtitles" panel.
 *
 * The default selection is deliberately empty: transcription is free, but every
 * target language is a paid Mux Robots job, so the zero-cost path is the one
 * you get by doing nothing.
 */
export function CaptionLanguagePicker({
  sourceLanguage,
  onSourceChange,
  targets,
  onToggleTarget,
  disabled,
  lockedLanguages,
  idPrefix,
}: CaptionLanguagePickerProps) {
  const languages = CAPTION_LANGUAGES.map((code) => ({
    code,
    label: languageDisplayName(code),
  }));

  return (
    <div className="w-full space-y-4 text-left">
      {onSourceChange && (
        <div className="space-y-1.5">
          <label
            htmlFor={`${idPrefix}-source`}
            className="block text-[11px] font-medium uppercase tracking-wider text-white/40"
          >
            Idioma hablado
          </label>
          <select
            id={`${idPrefix}-source`}
            value={sourceLanguage}
            disabled={disabled}
            onChange={(e) => onSourceChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs text-white/70 outline-none transition-colors hover:border-white/[0.15] focus:border-red-500/40 disabled:opacity-40"
          >
            <option value={AUTO_LANGUAGE} className="bg-neutral-900">
              Detectar automaticamente
            </option>
            {languages.map(({ code, label }) => (
              <option key={code} value={code} className="bg-neutral-900">
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Languages className="h-3 w-3 text-red-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            Traducir subtitulos a
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {languages.map(({ code, label }) => {
            const selected = targets.includes(code);
            const locked =
              code === sourceLanguage || !!lockedLanguages?.includes(code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={selected}
                disabled={disabled || locked}
                onClick={() => onToggleTarget(code)}
                className={`flex h-8 items-center justify-center rounded-lg border px-2 text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                  selected
                    ? "border-red-500/40 bg-red-500/15 text-red-400"
                    : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/[0.15] hover:text-white/70"
                }`}
              >
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-white/25">
          {targets.length === 0
            ? "Los subtitulos en el idioma hablado se generan siempre y son gratis."
            : "Cada idioma extra se traduce con IA despues de subir el video."}
        </p>
      </div>
    </div>
  );
}
