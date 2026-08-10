"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Loader2Icon, SlidersHorizontalIcon } from "lucide-react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { updateData } from "@/lib/db/actions/edit/course_edit_actions";
import { CourseGet } from "@/lib/db/actions/courses/get_courses";

const ActualizarDatosModal = ({ course }: { course: CourseGet }) => {
  const [open, setOpen] = useState(false);
  const [duracion, setDuracion] = useState(course.duracion);
  const [descripcion, setDescripcion] = useState(course.descripcion);
  const [benefits, setBenefits] = useState(course.beneficios);
  const [price, setPrice] = useState(String(course.price));
  const [priceUsd, setPriceUsd] = useState(String(course.price_usd));
  const [isPublic, setIsPublic] = useState(course.is_public);

  const { execute, status } = useAction(updateData, {
    onSuccess: () => {
      toast.success("Datos actualizados");
      setOpen(false);
    },
    onError: () => toast.error("No se pudieron actualizar los datos"),
  });

  const isExecuting = status === "executing";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 text-left border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:text-white">
          <SlidersHorizontalIcon className="w-4 h-4 shrink-0 text-red-500" />
          Actualizar datos
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="flex flex-col ">
          <DialogTitle>ModificarDatos</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            execute({
              courseId: course.id,
              duracion,
              descripcion,
              benefits,
              price,
              price_usd: priceUsd,
              isPublic,
            });
          }}
        >
          <Input
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            name="duration"
            placeholder={"Duracion"}
          />
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            name="description"
            placeholder={"Descripcion"}
          />
          <Input
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            name="benefits"
            placeholder={"Beneficios"}
          />
          <div>
            <Label>Precio</Label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              name="price"
              type="number"
              placeholder={"Precio"}
            />
          </div>
          <div>
            <Label>Precio en USD</Label>
            <Input
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              name="price_usd"
              type="number"
              placeholder={"Precio en USD"}
            />
          </div>
          <div className="flex items-start gap-3 pl-2">
            <Checkbox
              id="esPublico"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
              name="is_public"
            />
            <Label htmlFor="esPublico">Esta publicado</Label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={isExecuting}>
              {isExecuting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                "Actualizar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActualizarDatosModal;
