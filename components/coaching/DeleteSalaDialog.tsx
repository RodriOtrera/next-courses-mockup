"use client";

import { createSalaTema } from "@/lib/db/actions/coaching/create_sala_item";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Loader2Icon, PlusIcon, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { delete_sala } from "@/lib/db/actions/coaching/create_sala";

export const DeleteSalaDialog = ({
  sala_id,
  coaching_id,
}: {
  sala_id: string;
  coaching_id: string;
}) => {
  const { executeAsync, isExecuting } = useAction(delete_sala);
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="ml-4" variant={"outline"}>
            <Trash2 className="" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>Eliminar Sala</DialogHeader>

          <p className="text-neutral-300 text-md">
            ¿Estás seguro que deseas eliminar la sala?
          </p>

          <DialogFooter>
            <Button
              onClick={async () => {
                await executeAsync({
                  id: sala_id,
                  coaching_id,
                });
                setDialogOpen(false);
              }}
              variant="outline"
              className="transition"
            >
              {isExecuting ? (
                <Loader2Icon className="animate-spin mx-auto" />
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
