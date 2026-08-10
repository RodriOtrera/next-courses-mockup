import React from "react";
// import { createCourse } from "@/lib/actions/create_course";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCourse } from "@/lib/db/actions/create_course";
import { PlusIcon } from "lucide-react";

export default function CrearteCourseModal() {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-[200px] text-center mx-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            Crear curso
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form action={createCourse}>
            <DialogHeader>
              <DialogTitle className="mb-2">Crear curso</DialogTitle>
              <Input
                name="title"
                placeholder="Nombre del curso"
                className="mt-4"
              />
              {/* <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription> */}
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" variant="default">
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
