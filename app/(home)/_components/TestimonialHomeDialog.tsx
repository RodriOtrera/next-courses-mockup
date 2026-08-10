"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createHomeTestimonial } from "@/lib/db/actions/home/home_testimonials_action";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "@/components/uploaders/UploadButton";
import { useState } from "react";

export default function TestimonialHomeDialog() {
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string>();
  const [content, setcontent] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const { control } = useUploadFile({
    route: "imageUploader",
    api: "/api/upload",
  });

  return (
    <div>
      <Dialog onOpenChange={setOpenDialog} open={openDialog}>
        <DialogTrigger asChild>
          <Button className="mb-8" variant={"outline"}>
            Crear testimonio
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Testimonio</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="Nombre"
          />
          <Textarea
            value={content}
            onChange={(e) => {
              setcontent(e.target.value);
            }}
            placeholder="Contenido"
            maxLength={140}
          />
          {imgUrl ? (
            <p className="text-green-400 text-sm ml-2">Imagen Subida!</p>
          ) : (
            <UploadButton
              control={control}
              label="SUBIR IMAGEN"
              onUploadComplete={(url) => setImgUrl(url)}
            />
          )}
          <DialogFooter>
            <Button
              disabled={
                name == undefined || content == undefined || imgUrl == undefined
              }
              type="button"
              onClick={async () => {
                await createHomeTestimonial({
                  user_name: name!,
                  content: content,
                  user_img_url: imgUrl!,
                  id: crypto.randomUUID(),
                });
                setOpenDialog(false);
              }}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
