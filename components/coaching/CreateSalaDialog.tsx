"use client";

import { DialogTrigger } from "@radix-ui/react-dialog";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, Loader2Icon, PlusIcon } from "lucide-react";
import { Input } from "../ui/input";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "../uploaders/UploadButton";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAction } from "next-safe-action/hooks";
import { create_sala } from "@/lib/db/actions/coaching/create_sala";

export const CreateSalaDialog = ({ coaching_id }: { coaching_id: string }) => {
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);
  const [salaName, setSalaName] = useState("");
  const { executeAsync, isExecuting } = useAction(create_sala);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { control } = useUploadFile({
    route: "imageUploader",
    api: "/api/upload",
  });

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="ml-4" variant={"outline"}>
            <PlusIcon className="mr-2" />
            Crear Sala
          </Button>
        </DialogTrigger>
        <DialogContent>
          <h2>Crear Sala</h2>
          <Input
            onChange={(e) => setSalaName(e.target.value)}
            value={salaName}
            placeholder="Nombre de la sala"
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

          <div className=" flex flex-col items-center">
            <p className="mb-4 text-neutral-400">PREVIEW</p>
            <div
              className={cn(
                "w-[300px] hover:scale-110 cursor-pointer transition-transform px-4 pb-4 relative flex flex-col justify-end h-[150px] rounded-2xl overflow-hidden ",

                imgUrl ? "bg-transparent" : "bg-neutral-800"
              )}
            >
              {imgUrl && (
                <Image
                  className=" mask-image opacity-90"
                  alt="Sala de nutricion"
                  src={imgUrl}
                  fill
                  style={{ objectFit: "cover" }}
                />
              )}

              <h2 className="font-extrabold z-10">{salaName.toUpperCase()}</h2>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={async () => {
                await executeAsync({
                  id: crypto.randomUUID(),
                  coaching_id,
                  name: salaName,
                  img_url: imgUrl!,
                });
                setDialogOpen(false);
                setImgUrl(undefined);
                setSalaName("");
              }}
              disabled={!imgUrl}
              variant="outline"
              className="transition"
            >
              {isExecuting ? (
                <Loader2Icon className="animate-spin mx-auto" />
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
