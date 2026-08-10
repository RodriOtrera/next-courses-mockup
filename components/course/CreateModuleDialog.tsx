"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createModule } from "@/lib/db/actions/edit/preview_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateModuleDialogProps {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateModuleDialog({
  courseId,
  open,
  onOpenChange,
}: CreateModuleDialogProps) {
  const router = useRouter();

  const { execute, isPending, result, hasErrored } = useAction(createModule, {
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    execute({
      courseId,
      title: formData.get("title") as string,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Modulo</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del nuevo modulo.
          </DialogDescription>
        </DialogHeader>

        {hasErrored && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {result.serverError || "Algo salio mal. Intenta de nuevo."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            placeholder="Ej: Introduccion al entrenamiento"
            required
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear Modulo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
