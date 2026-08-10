import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { PlusIcon, VideoIcon } from "lucide-react";
import React, { ReactNode } from "react";

const DialogCustom = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mx-4">
            <VideoIcon className="mr-2" /> Agregar Video
          </Button>
        </DialogTrigger>

        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>Agregar Video </DialogTitle>
            <DialogDescription>El contenido es el siguiente</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DialogCustom;
