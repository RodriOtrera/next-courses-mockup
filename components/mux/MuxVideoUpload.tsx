"use client";

import { useState, useRef, useCallback } from "react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getMuxAsset, checkUploadStatus } from "@/lib/db/actions/mux/mux_actions";
import { createCaptionedMuxUpload } from "@/lib/db/actions/mux/caption_actions";
import { AUTO_LANGUAGE } from "@/lib/mux/caption_languages";

interface MuxVideoUploadProps {
  onSuccess: (data: { assetId: string; playbackId: string }) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  buttonText?: string;
  className?: string;
  /**
   * Subtitle choices, which Mux only accepts when the upload is *created* —
   * there is no way to add them to an upload already in flight. The caller
   * collects them before the file picker opens for that reason.
   */
  sourceLanguage?: string;
  targetLanguages?: string[];
}

type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

export function MuxVideoUpload({
  onSuccess,
  onError,
  accept = "video/*",
  maxSize = 5 * 1024 * 1024 * 1024,
  buttonText = "Subir Video",
  className,
  sourceLanguage = AUTO_LANGUAGE,
  targetLanguages = [],
}: MuxVideoUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isPending: isCreatingUpload } = useAction(createCaptionedMuxUpload);

  const statusRef = useRef<UploadStatus>("idle");

  const updateStatus = (newStatus: UploadStatus) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  };

  const handleError = useCallback((err: unknown) => {
    let message = "Upload failed";

    if (typeof err === "string") {
      message = err;
    } else if (err && typeof err === "object") {
      if ("serverError" in err && typeof err.serverError === "string") {
        message = err.serverError;
      } else if ("message" in err && typeof err.message === "string") {
        message = err.message;
      }
    }

    setError(message);
    updateStatus("error");
    if (onError) {
      onError(new Error(message));
    }
  }, [onError]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      const sizeInMB = maxSize / (1024 * 1024);
      handleError(`File size exceeds ${sizeInMB}MB limit`);
      return;
    }

    updateStatus("uploading");
    setError(null);
    setUploadProgress(0);

    try {
      const result = await createCaptionedMuxUpload({
        sourceLanguage,
        targetLanguages,
      });

      if (!result || result.serverError) {
        handleError(result?.serverError ?? "Upload failed");
        return;
      }

      const uploadUrl = result?.data?.url;
      const uploadId = result?.data?.uploadId;

      if (!uploadUrl || !uploadId) {
        handleError("Invalid upload URL received");
        return;
      }

      await uploadToMux(uploadUrl, uploadId, file);
    } catch (err) {
      handleError(err);
    }
  };

  const uploadToMux = (uploadUrl: string, uploadId: string, file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          updateStatus("processing");
          setUploadProgress(100);
          try {
            const assetId = await startPolling(uploadId);
            if (assetId) {
              await fetchAssetDetails(assetId);
              resolve(assetId);
            } else {
              reject(new Error("Failed to get asset ID"));
            }
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const startPolling = useCallback(async (uploadId: string, maxAttempts = 30, interval = 2000): Promise<string | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (statusRef.current !== "processing") return null;

      try {
        const result = await checkUploadStatus({ uploadId });

        if (result?.data?.assetId && result?.data?.status === "asset_created") {
          return result.data.assetId;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error("Asset processing timed out");
  }, []);

  const fetchAssetDetails = useCallback(async (assetId: string) => {
    try {
      const result = await getMuxAsset({ assetId });

      if (!result || result.serverError) {
        handleError(result?.serverError ?? "Failed to get asset");
        return;
      }

      if (result?.data?.playbackId) {
        updateStatus("completed");
        onSuccess({
          assetId,
          playbackId: result.data.playbackId,
        });
      } else {
        handleError("Failed to get playback ID");
      }
    } catch (err) {
      handleError(err);
    }
  }, [onSuccess, handleError]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    updateStatus("idle");
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Subir Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={status === "uploading" || status === "processing"}
        />

        <div className="space-y-2">
          <Button
            onClick={handleButtonClick}
            disabled={status === "uploading" || status === "processing" || isCreatingUpload}
            variant={status === "completed" ? "secondary" : "default"}
            className="w-full"
            type="button"
          >
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span>
                {isCreatingUpload ? "Preparando..." :
                 status === "uploading" ? "Subiendo..." :
                 status === "processing" ? "Procesando..." :
                 status === "completed" ? "Video Subido" :
                 status === "error" ? "Intentar de nuevo" :
                 buttonText}
              </span>
            </div>
          </Button>

          {(status === "uploading" || status === "processing") && (
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {status === "uploading" ? `${uploadProgress}% subido` : "Procesando video..."}
              </p>
            </div>
          )}

          {status === "error" && error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {status === "completed" && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-md border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Video subido correctamente!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu video esta listo para usar
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                className="h-8 px-2"
                type="button"
              >
                Subir otro
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
