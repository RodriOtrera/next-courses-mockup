"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateMeeting } from "@/lib/db/actions/subscription/meeting_action";
import { Meeting } from "@/lib/db/schema/meeting";
import {
  Check,
  Cross,
  ListVideoIcon,
  Loader2Icon,
  XCircle,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

const UpdateMeeting = ({ meeting }: { meeting: Meeting }) => {
  const { execute, status } = useAction(updateMeeting, {
    onError: (err) => {
      console.log(err);
    },
    onSuccess: (data) => {
      setActiveLink(data != null);
    },
  });
  const [link, setLink] = useState(meeting.link);
  const [activeLink, setActiveLink] = useState(meeting.link != null);
  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-2xl">Zoom</h1>
      <Input
        value={link ?? ""}
        onChange={(e) => {
          setLink(e.target.value);
        }}
        className="my-2"
        type="url"
        placeholder="Link"
      />
      {activeLink ? (
        <h1 className="text-sm flex text-green-400 items-center">
          <Check className="mr-1 w-4" />
          Link habilitado
        </h1>
      ) : (
        <h1 className="text-sm flex text-red-600 items-center">
          <XCircle className="mr-1 w-4" />
          Link no habilitado
        </h1>
      )}

      <div className="ml-auto">
        {status == "executing" ? (
          <Loader2Icon className=" animate-spin" />
        ) : (
          <Button
            onClick={() => {
              execute({ link: link == "" ? null : link });
            }}
            variant="secondary"
            className=""
          >
            <ListVideoIcon className="mr-2 " />
            Actualizar
          </Button>
        )}
      </div>
    </div>
  );
};

export default UpdateMeeting;
