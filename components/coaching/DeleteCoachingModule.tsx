"use client";
import React from "react";
import { Button } from "../ui/button";
import { useAction } from "next-safe-action/hooks";
import { deleteItemCoaching } from "@/lib/db/actions/coaching/create_sala_item";
import { Loader2 } from "lucide-react";

interface DeleteCoachingModuleButtonProps {
  sala_id: string;
  item_id: string;
}

const DeleteCoachingModuleButton: React.FC<DeleteCoachingModuleButtonProps> = ({
  item_id,
  sala_id,
}) => {
  const { executeAsync, isExecuting } = useAction(deleteItemCoaching);

  return (
    <Button
      onClick={async () => {
        executeAsync({
          id: item_id,
          sala_id,
        });
      }}
      variant={"outline"}
      className="top-16 right-3   my-auto  absolute"
    >
      {isExecuting ? <Loader2 /> : "Eliminar Modulo"}
    </Button>
  );
};

export default DeleteCoachingModuleButton;
