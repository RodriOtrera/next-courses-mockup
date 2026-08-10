"use client";
import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAction } from "next-safe-action/hooks";
import { updateCoaching } from "@/lib/db/actions/coaching/update_coaching";
import { CoachingTypeSelect } from "@/lib/db/actions/get_coachings";
import { Loader2Icon } from "lucide-react";
import { Textarea } from "../ui/textarea";

interface UpdateCoachingButtonProps {
  coaching: CoachingTypeSelect;
}

const UpdateCoachingButton: React.FC<UpdateCoachingButtonProps> = ({
  coaching,
}) => {
  const { executeAsync, isExecuting } = useAction(updateCoaching);
  const [name, setname] = useState(coaching.name);
  const [price, setprice] = useState(coaching.price);
  const [videoLink, setvideoLink] = useState(coaching.video_link);
  const [description, setDescription] = useState(coaching.description);
  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Nombre"
        value={name}
        onChange={(e) => {
          setname(e.target.value);
        }}
      />
      <Input
        placeholder="Precio"
        value={price}
        onChange={(e) => {
          setprice(+e.target.value);
        }}
      />
      <Textarea
        placeholder="Descripcion"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
        }}
      />
      <Input
        placeholder="Video (Link)"
        value={videoLink}
        onChange={(e) => {
          setvideoLink(e.target.value);
        }}
      />
      <Button
        onClick={async () => {
          await executeAsync({
            coaching_id: coaching.id,
            name,
            price,
            description,
            video_link: videoLink,
          });
        }}
        variant="outline"
        className="w-full"
      >
        {isExecuting ? (
          <Loader2Icon className="animate-spin mx-auto" />
        ) : (
          "Guardar"
        )}
      </Button>
    </div>
  );
};

export default UpdateCoachingButton;
