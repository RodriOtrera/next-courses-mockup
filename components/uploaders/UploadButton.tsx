"use client";

import * as React from "react";
import { type UploadHookControl } from "@better-upload/client";
import { Loader2, CheckCircle2, ImageIcon, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadButtonProps {
  control: UploadHookControl<false>;
  accept?: string;
  label?: string;
  className?: string;
  onUploadComplete?: (url: string) => void;
}

export function UploadButton({
  control,
  accept = "image/*",
  label = "Subir imagen",
  className,
  onUploadComplete,
}: UploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const lastSuccessRef = React.useRef(false);

  React.useEffect(() => {
    if (control.isSuccess && !lastSuccessRef.current && control.uploadedFile) {
      lastSuccessRef.current = true;
      const meta = control.uploadedFile.objectInfo.metadata as
        | { publicUrl?: string }
        | undefined;

      if (meta?.publicUrl) {
        onUploadComplete?.(meta.publicUrl);
      } else {
        const key = control.uploadedFile.objectInfo.key;
        const bucket =
          process.env.NEXT_PUBLIC_S3_BUCKET_NAME ||
          process.env.S3_BUCKET_NAME;
        const region =
          process.env.NEXT_PUBLIC_AWS_REGION ||
          process.env.AWS_REGION ||
          "us-east-2";
        const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
        onUploadComplete?.(url);
      }
    } else if (!control.isSuccess) {
      lastSuccessRef.current = false;
    }
  }, [control.isSuccess, control.uploadedFile, onUploadComplete]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    control.upload(file);
    e.target.value = "";
  };

  const isPending = control.isPending;
  const isSuccess = control.isSuccess;
  const progress = control.progress;
  const isPdf = accept === "application/pdf";
  const Icon = isPdf ? FileIcon : ImageIcon;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={isPending}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "group relative flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
          "border-neutral-600 bg-neutral-900/50 hover:border-green-500/50 hover:bg-neutral-800",
          "disabled:pointer-events-none disabled:opacity-50",
          isSuccess && "border-emerald-500/50 bg-emerald-500/10"
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin text-green-500" />
            <span className="text-sm text-neutral-400">
              Subiendo... {Math.round(progress * 100)}%
            </span>
            <div
              className="absolute bottom-0 left-0 h-1 rounded-b-lg bg-green-500 transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            <span className="text-sm text-emerald-500">Subido!</span>
          </>
        ) : (
          <>
            <Icon className="h-6 w-6 text-neutral-400 transition-colors group-hover:text-green-500" />
            <span className="text-sm font-medium text-neutral-300">
              {label}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
