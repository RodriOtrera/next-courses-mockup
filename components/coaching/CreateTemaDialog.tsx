"use client";

import { createSalaTema } from "@/lib/db/actions/coaching/create_sala_item";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";

export const CreateTemaSalaDialog = ({ sala_id }: { sala_id: string }) => {
  const [salaName, setSalaName] = useState("");
  const { executeAsync, isExecuting } = useAction(createSalaTema);
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="ml-4" variant={"outline"}>
            <PlusIcon className="mr-2" />
            Crear Tema
          </Button>
        </DialogTrigger>
        <DialogContent>
          <h2>Nuevo Tema</h2>
          <Input
            onChange={(e) => setSalaName(e.target.value)}
            value={salaName}
            placeholder="Nombre de la sala"
          />


          

          <DialogFooter>
            <Button
              onClick={async () => {
                await executeAsync({
                  id: crypto.randomUUID(),
                  name: salaName,
                  sala_id,

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
