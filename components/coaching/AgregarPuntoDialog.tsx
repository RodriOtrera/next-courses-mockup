"use client";

import { createSalaTema } from "@/lib/db/actions/coaching/create_sala_item";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { addPointInCoaching } from "@/lib/db/actions/coaching/add_point_coaching";

export const AddPointCoachingDialog = ({
  coaching_id,
}: {
  coaching_id: string;
}) => {
  const [salaName, setSalaName] = useState("");
  const { executeAsync, isExecuting } = useAction(addPointInCoaching);
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="flex mt-1" variant="outline">
            <PlusIcon size={15} className="mr-2" />
            <p className="text-sm">Agregar punto</p>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <h2>Nuevo Punto</h2>
          <Input
            onChange={(e) => setSalaName(e.target.value)}
            value={salaName}
            placeholder="Punto"
          />

          <DialogFooter>
            <Button
              onClick={async () => {
                await executeAsync({
                  id: crypto.randomUUID(),
                  text: salaName,
                  coaching_id,
                });
                setDialogOpen(false);
                setSalaName("");
              }}
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
