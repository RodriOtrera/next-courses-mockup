"use client";

import { useState, useRef, useCallback } from "react";
import { useAction } from "next-safe-action/hooks";
import { getMuxAsset, checkUploadStatus } from "@/lib/db/actions/mux/mux_actions";
import {
  attachCaptionedVideo,
  createCaptionedMuxUpload,
} from "@/lib/db/actions/mux/caption_actions";
import { AUTO_LANGUAGE } from "@/lib/mux/caption_languages";
import { CaptionLanguagePicker } from "@/components/mux/CaptionLanguagePicker";
import { CaptionStatus } from "@/components/mux/CaptionStatus";
import { Upload, Loader2, Sparkles, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { ThemedCheckbox } from "@/components/ui/ThemedCheckbox";

interface PreviewVideoUploadProps {
  moduleItemId: string;
  moduleItemTitle: string;
  courseId: string;
}

type Phase = "idle" | "uploading" | "processing" | "completed" | "error";

export function PreviewVideoUpload({
  moduleItemId,
  moduleItemTitle,
  courseId,
}: PreviewVideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<Phase>("idle");

  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [muxData, setMuxData] = useState<{
    assetId: string;
    playbackId: string;
  } | null>(null);
  const [generateAiDescription, setGenerateAiDescription] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState(AUTO_LANGUAGE);
  const [captionTargets, setCaptionTargets] = useState<string[]>([]);

  const { executeAsync: execAttachVideo } = useAction(attachCaptionedVideo);

  const updatePhase = (p: Phase) => {
    setPhase(p);
    statusRef.current = p;
  };

  const handleError = useCallback((err: unknown) => {
    const message =
      typeof err === "string"
        ? err
        : err &&
            typeof err === "object" &&
            "message" in err &&
            typeof err.message === "string"
          ? err.message
          : "Error al subir el video";
    setError(message);
    updatePhase("error");
  }, []);

  const pollForAsset = useCallback(
    async (uploadId: string, maxAttempts = 30): Promise<string | null> => {
      for (let i = 0; i < maxAttempts; i++) {
        if (statusRef.current !== "processing") return null;
        try {
          const result = await checkUploadStatus({ uploadId });
          if (
            result?.data?.assetId &&
            result?.data?.status === "asset_created"
          )
            return result.data.assetId;
        } catch {}
        await new Promise((r) => setTimeout(r, 2000));
      }
      throw new Error("Timeout procesando video");
    },
    []
  );

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024 * 1024) {
      handleError("El archivo excede 5GB");
      return;
    }

    updatePhase("uploading");
    setError(null);
    setUploadProgress(0);

    try {
      // Asks Mux for free Whisper ASR up front — subtitle generation can only
      // be requested when the upload is created, never bolted on afterwards
      // (that path is `backfillCaptions`, and it costs an extra ASR pass).
      const result = await createCaptionedMuxUpload({
        sourceLanguage,
        targetLanguages: captionTargets,
      });
      if (!result?.data?.url || !result?.data?.uploadId) {
        handleError(result?.serverError ?? "No se pudo crear la sesion de subida");
        return;
      }

      const { url: uploadUrl, uploadId } = result.data;

      // Upload via XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable)
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        });
        xhr.addEventListener("load", () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed: ${xhr.status}`))
        );
        xhr.addEventListener("error", () =>
          reject(new Error("Error de red"))
        );
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Poll for asset
      updatePhase("processing");
      setUploadProgress(100);
      const assetId = await pollForAsset(uploadId);
      if (!assetId) throw new Error("No se pudo obtener el asset");

      // Get playback ID
      const assetResult = await getMuxAsset({ assetId });
      if (!assetResult?.data?.playbackId)
        throw new Error("No se pudo obtener el playback ID");

      const data = {
        assetId,
        playbackId: assetResult.data.playbackId,
      };
      setMuxData(data);
      updatePhase("completed");

      // One write: the playback ids and the caption track rows the pipeline
      // runs off. `<CaptionStatus autoStart>` below drives it from here — the
      // description now comes from the ASR transcript rather than a separate
      // audio download, so there is nothing else to kick off.
      await execAttachVideo({
        moduleItemId,
        assetId: data.assetId,
        playbackId: data.playbackId,
        courseId,
        sourceLanguage,
        targetLanguages: captionTargets,
        generateDescription: generateAiDescription,
      });
    } catch (err) {
      handleError(err);
    }
  };

  const thumbnailUrl = muxData
    ? `https://image.mux.com/${muxData.playbackId}/thumbnail.jpg?time=5&width=640&height=360`
    : null;

  // Completed — show thumbnail + description
  if (phase === "completed" && muxData) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-white/[0.06]">
          {thumbnailUrl && (
            <Image
              src={thumbnailUrl}
              alt={moduleItemTitle}
              fill
              className="object-cover"
              unoptimized
            />
          )}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-green-400">
              <CheckCircle className="h-3 w-3" />
              Video subido
            </span>
          </div>
        </div>

        {/* Subtitles + AI description. Both come off the same ASR transcript,
            so one component reports on both as they land. */}
        <CaptionStatus
          moduleItemId={moduleItemId}
          courseId={courseId}
          autoStart
        />
      </div>
    );
  }

  // Idle / uploading / processing / error — video container with upload in center
  return (
    <div className="space-y-4">
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/50 border border-white/[0.06]">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {phase === "idle" && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Upload className="h-7 w-7 text-white/60" />
            </button>
            <p className="text-sm text-white/40 font-medium">
              Subir video
            </p>
            <p className="text-xs text-white/20">
              Haz click para seleccionar un archivo
            </p>
          </>
        )}

        {phase === "uploading" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Loader2 className="h-7 w-7 text-white/60 animate-spin" />
            </div>
            <p className="text-sm text-white/50 font-medium">
              Subiendo... {uploadProgress}%
            </p>
            <div className="w-48 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </>
        )}

        {phase === "processing" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Loader2 className="h-7 w-7 text-white/60 animate-spin" />
            </div>
            <p className="text-sm text-white/50 font-medium">
              Procesando video...
            </p>
          </>
        )}

        {phase === "error" && (
          <>
            <button
              onClick={() => {
                updatePhase("idle");
                setError(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <XCircle className="h-7 w-7 text-red-400/60" />
            </button>
            <p className="text-sm text-red-400/80 font-medium">{error}</p>
            <p className="text-xs text-white/20">
              Click para intentar de nuevo
            </p>
          </>
        )}
      </div>
    </div>

    {/* Subtitle options live outside the player box: they have to be chosen
        *before* the file is picked, because Mux only accepts a subtitle
        request when the upload is created. */}
    {phase === "idle" && (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <CaptionLanguagePicker
          idPrefix={`upload-${moduleItemId}`}
          sourceLanguage={sourceLanguage}
          onSourceChange={setSourceLanguage}
          targets={captionTargets}
          onToggleTarget={(code) =>
            setCaptionTargets((prev) =>
              prev.includes(code)
                ? prev.filter((c) => c !== code)
                : [...prev, code]
            )
          }
        />

        <ThemedCheckbox
          id={`ai-description-${moduleItemId}`}
          checked={generateAiDescription}
          onCheckedChange={setGenerateAiDescription}
          icon={<Sparkles className="h-3 w-3 text-red-400" />}
          label="Generar descripcion con IA"
        />
      </div>
    )}
    </div>
  );
}
