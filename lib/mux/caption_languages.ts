/**
 * Shared shaping for video subtitle languages.
 *
 * Pure — no `db`, no server imports — so the upload validator, the pipeline and
 * the React picker all agree on which languages exist instead of three lists
 * that drift. Safe to import from a client component.
 */

/**
 * The languages we offer, for both transcription and translation.
 *
 * A deliberate narrowing: Mux's speech recognition supports 22 languages and
 * its translation more than that, but these three cover the audience and keep
 * the picker a single readable row. Widening it is one array — every code here
 * must be one Mux can transcribe.
 */
export const CAPTION_LANGUAGES = ["es", "en", "pt"] as const;

export type CaptionLanguage = (typeof CAPTION_LANGUAGES)[number];

/** Sentinel for "detect the spoken language automatically". */
export const AUTO_LANGUAGE = "auto";

export function isSupportedCaptionLanguage(
  code: string,
): code is CaptionLanguage {
  return (CAPTION_LANGUAGES as readonly string[]).includes(code);
}

/** A source language is either one we offer or the auto-detect sentinel. */
export function isSupportedSourceLanguage(code: string): boolean {
  return code === AUTO_LANGUAGE || isSupportedCaptionLanguage(code);
}

// -- Guards ----------------------------------------------------------------

/**
 * With only three languages the natural ceiling is three, so this is a
 * server-side sanity bound rather than a cost lever. Duration is the guard that
 * actually matters for spend.
 */
export const MAX_TARGET_LANGUAGES = CAPTION_LANGUAGES.length;
/** 30 minutes. Above this, translations are skipped rather than billed. */
export const MAX_TRANSLATION_DURATION_S = 1800;
/** Bound on the transcript we store on the module item row. */
export const TRANSCRIPT_MAX_CHARS = 300_000;

// -- Spend accounting ------------------------------------------------------
// Translation is billed in Mux AI units: a flat charge per job plus a
// per-minute rate. This is operator-facing only — units land on the track row
// and in the logs, never in the customer's UI.

export const AI_UNITS_PER_JOB = 100;
export const AI_UNITS_PER_MINUTE = 500;
export const USD_PER_1000_UNITS = 0.01;

export function unitsToUsd(units: number): number {
  return (units / 1000) * USD_PER_1000_UNITS;
}

/**
 * Human-readable language name in the reader's own locale.
 *
 * `Intl.DisplayNames` means we don't carry per-language translation keys. The
 * fallback only matters on runtimes without the ICU data.
 */
export function languageDisplayName(code: string, locale = "es"): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(code);
    if (name && name !== code) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch {
    // fall through to the Spanish table
  }
  return LANGUAGE_FALLBACK[code] ?? code.toUpperCase();
}

const LANGUAGE_FALLBACK: Record<string, string> = {
  es: "Espanol",
  en: "Ingles",
  pt: "Portugues",
};
