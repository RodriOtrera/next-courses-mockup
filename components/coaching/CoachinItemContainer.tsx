"use client";
import { SelectCoachingItem } from "@/lib/db/schema/coachings";
import { Download } from "lucide-react";
import React from "react";
import VideoSala from "./VideoSalas";

interface CoachinItemContainerProps {
  item: SelectCoachingItem;
}

const CoachingItemContainer: React.FC<CoachinItemContainerProps> = ({
  item,
}) => {
  if (item.type === "video") {
    return <VideoSala video={item} />;
  }

  return (
    <div
      onClick={() => {
        window.open(item.link);
      }}
      className="
  bg-neutral-900
  rounded-xl
w-full
  flex 
  py-4
  justify-center
  items-center
  flex-col
  hover:bg-neutral-800
  transition-colors
    cursor-pointer
  "
    >
      <Download size={35} className="mb-2 text-green-400" />
      <h2 className="text-xs text-neutral-400">(PDF)</h2>
      <p className="text-md font-semibold mt-1">{item.name} </p>
    </div>
  );
};

export default CoachingItemContainer;
