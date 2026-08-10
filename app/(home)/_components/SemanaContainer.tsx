import { LockIcon, PlayCircleIcon } from "lucide-react";
import React from "react";
import DialogCustom from "./DialogCustom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { VideoInsert } from "@/lib/db/schema/videos";
import VideoContainer from "../coaching/VideoContainer";
import { Semana } from "@/lib/db/actions/subscription/semanas_actions";
import { createVideo } from "@/lib/db/actions/subscription/videos_actions";

const SemanaContainer = ({
  index,
  semana,
  admin = false,
  isAvailable,
}: {
  index: number;
  semana: Semana;
  admin?: boolean;
  isAvailable: boolean;
}) => {
  return (
    <div className="">
      <div className="flex items-center my-2 ">
        <h1 className="text-xl flex  font-bold text-neutral-300 border-b">
        {!isAvailable &&   <LockIcon className="mr-2" />}
          SEMANA {index}
        </h1>
        {admin && (
          <DialogCustom>
            <form action={createVideo} className="flex flex-col">
              <Input placeholder="Titulo del video" name="title" />
              <Textarea
                className="my-3"
                placeholder="Descripcion (Opcional)"
                name="description"
              />

              <Input placeholder="Video URL (Link)" name="video_url" />

              <input hidden={true} defaultValue={semana.id} name="semana_id" />
              <DialogClose asChild>
                <Button type="submit" variant="outline" className="mt-6">
                  Guardar
                </Button>
              </DialogClose>
            </form>
          </DialogCustom>
        )}
      </div>
      {isAvailable &&
        semana.videos.map((e) => (
          <VideoContainer admin={admin} key={e.id} video={e} />
        ))}

      <div className="bg-neutral-800 h-[0.25px] w-full my-8" />
    </div>
  );
};

export default SemanaContainer;
