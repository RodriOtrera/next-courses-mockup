"use client";

import { ImageIcon, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateCourseImage } from "@/lib/db/actions/edit/course_edit_actions";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "../uploaders/UploadButton";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

const ImageModal = ({ course_id }: { course_id: string }) => {
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);
  const { control } = useUploadFile({
    route: "imageUploader",
    api: "/api/upload",
  });

  const { execute, isPending } = useAction(updateCourseImage, {
    onSuccess: () => {
      toast.success("Imagen actualizada");
      setImgUrl(undefined);
      setOpen(false);
    },
    onError: ({ error }) => {
      toast.error(
        error.validationErrors
          ? "La imagen subida no es valida"
          : "No se pudo actualizar la imagen"
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" color="primary">
          <ImageIcon />
          <h1 className="pl-2"> Actualizar imagen</h1>
        </Button>
      </DialogTrigger>{" "}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-8">Actualizar Imagen</DialogTitle>
        </DialogHeader>{" "}
        {imgUrl != undefined ? (
          <h1 className="pl-2 text-sm text-green-400">Imagen Subida!</h1>
        ) : (
          <UploadButton
            control={control}
            label="SUBIR IMAGEN"
            onUploadComplete={(url) => setImgUrl(url)}
          />
        )}
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="default"
            disabled={imgUrl == null || isPending}
            onClick={() => {
              if (!imgUrl) return;
              execute({ courseId: course_id, imgUrl });
            }}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
