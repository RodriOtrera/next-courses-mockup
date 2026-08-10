"use client";

import { deleteCourseAction } from "@/lib/db/actions/courses/delete_course";
import { Loader2Icon, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export const DeleteCourseDialog = ({
  course_id,
  course_title,
}: {
  course_id: string;
  course_title: string;
}) => {
  const { executeAsync, isExecuting } = useAction(deleteCourseAction);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setDialogOpen(true)}
        className="absolute top-2 left-2 z-10 rounded-lg bg-black/80 p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Curso</DialogTitle>
          </DialogHeader>

          <p className="text-neutral-300 text-sm">
            ¿Estás seguro que deseas eliminar{" "}
            <span className="font-semibold text-white">{course_title}</span>?
            Esta acción no se puede deshacer.
          </p>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setDialogOpen(false)}
              variant="outline"
              disabled={isExecuting}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                await executeAsync({ id: course_id });
                setDialogOpen(false);
              }}
              variant="destructive"
              disabled={isExecuting}
            >
              {isExecuting ? (
                <Loader2Icon className="animate-spin mx-auto h-4 w-4" />
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
