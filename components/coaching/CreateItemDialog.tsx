"use client";

import {
  createSalaItem,
  createSalaTema,
} from "@/lib/db/actions/coaching/create_sala_item";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "../uploaders/UploadButton";
import { Textarea } from "../ui/textarea";

export const CreateItemDialog = ({
  sala_id,
  tema_id,
}: {
  sala_id: string;
  tema_id: string;
}) => {
  const [salaName, setSalaName] = useState("");
  const [link, setlink] = useState<undefined | string>();
  const [type, setType] = useState<"video" | "pdf">("video");
  const [description, setDescription] = useState("");
  const { executeAsync, isExecuting } = useAction(createSalaItem);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { control: pdfControl } = useUploadFile({
    route: "pdfUploader",
    api: "/api/upload",
  });

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="ml-4" variant={"outline"}>
            <PlusIcon className="mr-2" />
            Crear modulo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <h2>Nuevo Tema</h2>
          <Input
            onChange={(e) => setSalaName(e.target.value)}
            value={salaName}
            placeholder="Titulo"
          />
          <Select
            onValueChange={(value) => {
              setType(value as "video" | "pdf");
              setlink(undefined);
            }}
            value={type}
            name="module_type"
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de modulo" />
            </SelectTrigger>
            <SelectContent>
              {["video", "pdf"].map((e) => (
                <SelectItem
                  key={e}
                  value={e}
                  onClick={() => {
                    setType(e as "video" | "pdf");
                  }}
                >
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {type === "pdf" &&
            (!!link ? (
              <p className="text-green-400 text-sm ml-2">PDF subido!</p>
            ) : (
              <UploadButton
                control={pdfControl}
                accept="application/pdf"
                label="SUBIR PDF"
                onUploadComplete={(url) => setlink(url)}
              />
            ))}

          {type === "video" && (
            <>
              {" "}
              <Input
                onChange={(e) => setlink(e.target.value)}
                value={link}
                placeholder="Link de Youtube"
              />
              <Textarea
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                placeholder="Descripcion (Opcional)"
              />
            </>
          )}

          <DialogFooter>
            <Button
              disabled={!link || link.length === 0}
              onClick={async () => {
                await executeAsync({
                  id: crypto.randomUUID(),
                  name: salaName,
                  sala_id,
                  tema_id,
                  link: link!,
                  type,
                  description,
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
