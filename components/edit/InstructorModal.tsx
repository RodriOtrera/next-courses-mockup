"use client";
import { createInstructor } from "@/lib/db/actions/edit/course_edit_actions";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "../uploaders/UploadButton";
import { revalidatePath } from "next/cache";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";

const InstructorModal = ({ course_id }: { course_id: string }) => {
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);
  const { control } = useUploadFile({
    route: "imageUploader",
    api: "/api/upload",
  });

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Agregar Instructor</Button>
        </DialogTrigger>
        <DialogContent>
          <form action={createInstructor} className="flex flex-col gap-2">
            <input hidden name="course_id" value={course_id} />
            <DialogHeader className="flex flex-col gap-1">
              Agregar Instructor
            </DialogHeader>
            <Input name="name" placeholder="Nombre del instructor" />
            <Input name="instagram" placeholder="Instagram @" />
            <Input
              name="qualities"
              placeholder="Cualidades (Entrenador, Atleta, etc...)"
            />

            {imgUrl != undefined ? (
              <h1 className="pl-2 text-sm text-green-400">Imagen Subida!</h1>
            ) : (
              <UploadButton
                control={control}
                label="SUBIR IMAGEN"
                onUploadComplete={(url) => setImgUrl(url)}
              />
            )}
            <input hidden name="img_url" value={imgUrl ?? ""} />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    revalidatePath(`/editarCurso/${course_id}`);
                  }}
                  variant="default"
                  disabled={imgUrl == undefined}
                  type="submit"
                  color="primary"
                >
                  Crear
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstructorModal;
