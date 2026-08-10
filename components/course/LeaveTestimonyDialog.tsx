"use client";

import { useState } from "react";
import { Rating } from "./Rating";
import { useAction } from "next-safe-action/hooks";
import { Textarea } from "../ui/textarea";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";
import { createTestimony } from "@/lib/db/actions/testimony";

interface TestimonyDialog {
  course_id: string;
  onSent: () => void;
}

const LeaveTestimonyDialog = ({ course_id, onSent }: TestimonyDialog) => {
  const [starsValue, setStarsValue] = useState<number>(0);
  const [content, setContent] = useState("");
  const { execute, status } = useAction(createTestimony, {
    onSuccess: () => {
      onSent();
    },
  });
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Agregar Testimonio</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>Testimonio</DialogHeader>
          <div className="flex justify-center scale-125 mb-2">
            <Rating
              onValueChanges={(value) => {
                setStarsValue(value);
                console.log("This is the new value");
              }}
              size="small"
            />
          </div>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
            }}
            maxLength={140}
            placeholder="Tu opinión"
            name="content"
          />
          <DialogFooter>
            {status == "executing" ? (
              <Loader2 color="success animate-spin" />
            ) : (
              <>
                {" "}
                <Button variant="ghost">Cancelar</Button>
                <Button
                  onClick={() => {
                    execute({
                      course_id: course_id,
                      rating: starsValue,
                      content,
                    });
                  }}
                  color="success"
                >
                  Guardar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveTestimonyDialog;
