"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createModuleItem } from "@/lib/db/actions/edit/preview_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ModuleEnums, moduleValues } from "@/lib/db/schema/modules_items";

interface CreateModuleItemDialogProps {
  courseId: string;
  moduleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateModuleItemDialog({
  courseId,
  moduleId,
  open,
  onOpenChange,
}: CreateModuleItemDialogProps) {
  const router = useRouter();
  const [type, setType] = useState<ModuleEnums>("video");

  const { execute, isPending, result, hasErrored } = useAction(
    createModuleItem,
    {
      onSuccess: ({ data }) => {
        onOpenChange(false);
        if (data?.moduleItemId) {
          router.push(
            `/editarCurso/${courseId}/preview/${data.moduleItemId}`
          );
        }
        router.refresh();
      },
    }
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    execute({
      moduleId,
      courseId,
      title: formData.get("title") as string,
      type,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Clase</DialogTitle>
          <DialogDescription>
            Ingresa el titulo y tipo de la nueva clase.
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
            placeholder="Ej: Tecnicas de fuerza basicas"
            required
            autoFocus
          />
          <Select
            value={type}
            onValueChange={(v) => setType(v as ModuleEnums)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de clase" />
            </SelectTrigger>
            <SelectContent>
              {moduleValues.map((v) => (
                <SelectItem key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear Clase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
