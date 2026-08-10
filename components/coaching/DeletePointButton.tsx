"use client";
import { deletePointButton } from "@/lib/db/actions/coaching/create_sala_item";
import { Loader2, Trash } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import React from "react";
import { Button } from "../ui/button";

interface DeletePointButtonProps {
  coaching_id: string;
  item_id: string;
}

export const DeletePointButton: React.FC<DeletePointButtonProps> = ({
  item_id,
  coaching_id,
}) => {
  const { executeAsync, isExecuting } = useAction(deletePointButton);

  return (
    <>
      <Button
        size="sm"
        onClick={async () => {
          executeAsync({
            id: item_id,
            coaching_id,
          });
        }}
        variant={"outline"}
        className="ml-2"
      >
        {isExecuting ? (
          <Loader2 className="spin" size={18} />
        ) : (
          <Trash size={18} />
        )}
      </Button>
    </>
  );
};
