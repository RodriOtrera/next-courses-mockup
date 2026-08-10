"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { useUploadFile } from "@better-upload/client";
import { ImagePlusIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EditableImageProps = Omit<ImageProps, "src" | "alt"> & {
  /** Current image URL. When empty/null a placeholder is shown instead. */
  src?: string | null;
  /** Alt text for the image (falls back to `title`). */
  alt?: string;
  /** Label shown in the placeholder and the hover overlay. */
  title?: string;
  /** better-upload route name (must exist in app/api/upload/route.ts). */
  uploadRoute?: string;
  /** Called with the public URL once the new image finishes uploading. */
  onUploadComplete?: (url: string) => void;
  /** Classes for the wrapper element (sizing, rounding, etc.). */
  containerClassName?: string;
};

export function EditableImage({
  src,
  alt,
  title = "Subir imagen",
  uploadRoute = "imageUploader",
  onUploadComplete,
  containerClassName,
  className,
  ...imageProps
}: EditableImageProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const toastIdRef = React.useRef<string | number | undefined>(undefined);
  const handledSuccessRef = React.useRef(false);

  const { control } = useUploadFile({ route: uploadRoute, api: "/api/upload" });
  const { isPending, isSuccess, isError, uploadedFile, upload } = control;

  // Show a toast while the upload is in progress.
  React.useEffect(() => {
    if (isPending) {
      toastIdRef.current = toast.loading("Subiendo imagen...");
    }
  }, [isPending]);

  // On success: resolve the toast, derive the public URL and bubble it up.
  React.useEffect(() => {
    if (isSuccess && uploadedFile && !handledSuccessRef.current) {
      handledSuccessRef.current = true;
      const meta = uploadedFile.objectInfo.metadata as
        | { publicUrl?: string }
        | undefined;
      const url = meta?.publicUrl ?? buildPublicUrl(uploadedFile.objectInfo.key);
      toast.success("Imagen subida", { id: toastIdRef.current });
      toastIdRef.current = undefined;
      onUploadComplete?.(url);
    } else if (!isSuccess) {
      handledSuccessRef.current = false;
    }
  }, [isSuccess, uploadedFile, onUploadComplete]);

  // On failure: turn the loading toast into an error.
  React.useEffect(() => {
    if (isError) {
      toast.error("No se pudo subir la imagen", { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  }, [isError]);

  const pickFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const hasImage = Boolean(src);

  return (
    <div className={cn("group relative overflow-hidden", containerClassName)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
        disabled={isPending}
      />

      {hasImage ? (
        <>
          <Image
            src={src as string}
            alt={alt ?? title}
            className={className}
            {...imageProps}
          />

          {/* Hover overlay to replace the existing image */}
          <button
            type="button"
            onClick={pickFile}
            disabled={isPending}
            className={cn(
              "absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 text-white",
              "bg-black/0 opacity-0 backdrop-blur-0 transition-all duration-200",
              "group-hover:bg-black/95 group-hover:opacity-100 group-hover:backdrop-blur-sm",
              "focus-visible:bg-black/95 focus-visible:opacity-100 focus-visible:backdrop-blur-sm focus-visible:outline-none",
              isPending && "cursor-not-allowed bg-black/95 opacity-100 backdrop-blur-sm"
            )}
          >
            {isPending ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <ImagePlusIcon className="h-10 w-10" />
            )}
            <span className="text-base font-semibold tracking-wide">{title}</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={isPending}
          className={cn(
            "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2",
            "border-2 border-dashed border-neutral-700 bg-neutral-900/50 text-neutral-400",
            "transition-colors hover:border-neutral-500 hover:bg-neutral-800/60 hover:text-neutral-200",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {isPending ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <ImagePlusIcon className="h-7 w-7" />
          )}
          <span className="text-sm font-semibold">{title}</span>
        </button>
      )}
    </div>
  );
}

function buildPublicUrl(key: string) {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-2";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
