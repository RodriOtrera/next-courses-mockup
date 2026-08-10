import "server-only";

/**
 * Thin wrapper over Mux Robots' `translate-captions` workflow.
 *
 * Called over plain `fetch` rather than through `@mux/mux-node`: the Robots
 * namespace (`robotsPreview`) only exists from SDK v14, and this project is on
 * v12 for the rest of the Video API. Two REST calls are a much smaller thing to
 * own than a major SDK bump across every existing Mux call site.
 *
 * Robots is a *preview* API — Mux says its shape, parameters and pricing may
 * change. Every call goes through this file so that when it moves or GAs, one
 * file changes rather than the pipeline.
 */

const ROBOTS_BASE = "https://api.mux.com/robots/v0/jobs/translate-captions";

export type TranslateCaptionsJobView = {
  id: string;
  status: "pending" | "processing" | "completed" | "errored" | "cancelled";
  unitsConsumed: number;
  /** The Mux text track Robots attached, when `upload_to_mux` was true. */
  uploadedTrackId?: string;
  errorMessage?: string;
};

type RobotsJobBody = {
  id: string;
  status: string;
  units_consumed?: number;
  outputs?: { uploaded_track_id?: string };
  errors?: Array<{ message?: string; type?: string; retryable?: boolean }>;
};

function viewOf(job: RobotsJobBody): TranslateCaptionsJobView {
  return {
    id: job.id,
    status: job.status as TranslateCaptionsJobView["status"],
    unitsConsumed: job.units_consumed ?? 0,
    uploadedTrackId: job.outputs?.uploaded_track_id,
    errorMessage: job.errors?.[0]?.message,
  };
}

function authHeader(): string {
  const id = process.env.MUX_TOKEN_ID;
  const secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) {
    throw new Error("MUX_TOKEN_ID / MUX_TOKEN_SECRET are not set");
  }
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

/**
 * Carries the HTTP status and Mux's own error body through to
 * `describeRobotsError`, which is the only thing that knows how to read them.
 */
class RobotsHttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Robots request failed with ${status}`);
    this.name = "RobotsHttpError";
  }
}

async function robotsFetch(
  url: string,
  init: RequestInit,
): Promise<RobotsJobBody> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  const raw = await res.text();
  let parsed: unknown = undefined;
  try {
    parsed = raw ? JSON.parse(raw) : undefined;
  } catch {
    parsed = raw;
  }

  if (!res.ok) throw new RobotsHttpError(res.status, parsed);

  // Mux wraps every successful response in `{ data: ... }`.
  const data = (parsed as { data?: RobotsJobBody } | undefined)?.data;
  if (!data?.id) throw new Error("Robots returned an unrecognised response");
  return data;
}

/**
 * Kick off a translation. `upload_to_mux` means Robots attaches the resulting
 * WebVTT to the asset itself — we never handle the file, which is the whole
 * reason for preferring this over translating the VTT ourselves.
 *
 * Mux rejects the request if the asset already has a text track in
 * `toLanguageCode`, so callers must filter out the source language first.
 */
export async function createTranslateCaptionsJob(params: {
  assetId: string;
  trackId: string;
  toLanguageCode: string;
  passthrough?: string;
}): Promise<TranslateCaptionsJobView> {
  const job = await robotsFetch(ROBOTS_BASE, {
    method: "POST",
    body: JSON.stringify({
      parameters: {
        asset_id: params.assetId,
        track_id: params.trackId,
        to_language_code: params.toLanguageCode,
        upload_to_mux: true,
      },
      ...(params.passthrough ? { passthrough: params.passthrough } : {}),
    }),
  });
  return viewOf(job);
}

export async function retrieveTranslateCaptionsJob(
  jobId: string,
): Promise<TranslateCaptionsJobView> {
  const job = await robotsFetch(`${ROBOTS_BASE}/${encodeURIComponent(jobId)}`, {
    method: "GET",
  });
  return viewOf(job);
}

/**
 * Full technical detail for the operator, destined for `console.warn` only.
 *
 * Mux's own `error.messages[]` is genuinely good — a 403 tells you whether the
 * Robots terms need accepting (with a direct dashboard link), a scope is
 * missing, or the plan is wrong. So it is preserved verbatim here.
 *
 * It must **not** reach the customer: it names Mux and links to a dashboard
 * they have no account for. The pipeline logs this and stores a neutral
 * sentence on the track instead.
 */
export function describeRobotsError(err: unknown): string {
  const status = err instanceof RobotsHttpError ? err.status : undefined;
  const prefix = status ? `[${status}] ` : "";

  const muxMessages =
    err instanceof RobotsHttpError ? extractMuxMessages(err.body) : [];
  if (muxMessages.length > 0) return prefix + muxMessages.join(" ");

  if (status === 403) {
    return `${prefix}Robots rejected the request. Check the Robots page in the Mux dashboard: the terms may need accepting, the token may be missing the \`robots:*\` scope, or the org may be on the free plan.`;
  }
  return prefix + (err instanceof Error ? err.message : String(err));
}

/** Mux error bodies are `{ error: { type, messages: [...] } }`. */
function extractMuxMessages(body: unknown): string[] {
  if (typeof body !== "object" || body === null || !("error" in body)) return [];
  const inner = (body as { error?: unknown }).error;
  if (typeof inner !== "object" || inner === null) return [];

  const messages = (inner as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];
  return messages.filter((m): m is string => typeof m === "string");
}
