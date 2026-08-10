"use client";
import { actionOnServer } from "@/lib/db/actions/test_action";
import { ModuleItemInsert } from "@/lib/db/schema/modules_items";
import { youtube_parser } from "@/lib/utils/youtubeParset";
import { BookCheck, FileTextIcon, PlayCircleIcon } from "lucide-react";
import Image from "next/image";

const previewImageUrl = (module_item: ModuleItemInsert) => {
  if (module_item.mux_playback_id) {
    return `https://image.mux.com/${module_item.mux_playback_id}/thumbnail.jpg?time=5&width=320&height=180`;
  }
  if (module_item.video_url) {
    const youtube_id = youtube_parser(module_item.video_url);
    if (youtube_id) {
      return `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg`;
    }
  }
  return null;
};

const ModuleItemContainer = ({
  module_item,
  index,
  module_index,
  course_id,
  admin = false,
}: {
  module_item: ModuleItemInsert;
  index: number;
  module_index: number;
  course_id: string;
  admin?: boolean;
}) => {
  const preview_url = previewImageUrl(module_item);

  return (
    <div
      onClick={() => {
        actionOnServer(course_id, module_item.id!, admin);
      }}
      className="flex flex-1 cursor-pointer hover:bg-white/[0.06] py-2.5 px-3 my-0.5 bg-white/[0.02] rounded-lg justify-between items-center transition-colors group"
    >
      <span className="flex-1 min-w-0 flex items-center gap-2.5 text-sm text-white/50 group-hover:text-white/70 transition-colors">
        <span className="text-xs font-mono text-white/25 w-8 shrink-0">
          {module_index}.{index}
        </span>
        <span className="relative w-16 h-9 shrink-0 rounded-md overflow-hidden bg-white/[0.04] border border-white/[0.06]">
          {preview_url ? (
            <>
              <Image
                src={preview_url}
                alt={module_item.title}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircleIcon className="w-4 h-4 text-white/80" />
              </span>
            </>
          ) : (
            <span className="flex w-full h-full items-center justify-center">
              {module_item.type == "video" ? (
                <PlayCircleIcon className="w-4 h-4 text-red-400/60" />
              ) : module_item.type == "pdf" ? (
                <FileTextIcon className="w-4 h-4 text-blue-400/60" />
              ) : (
                <BookCheck className="w-4 h-4 text-green-400/60" />
              )}
            </span>
          )}
        </span>
        <span className="truncate">{module_item.title}</span>
      </span>
      <div className="min-w-5 pl-2">
        {module_item.type == "video" ? (
          <PlayCircleIcon className="w-4 h-4 text-red-400/60" />
        ) : module_item.type == "pdf" ? (
          <FileTextIcon className="w-4 h-4 text-blue-400/60" />
        ) : (
          <BookCheck className="w-4 h-4 text-green-400/60" />
        )}
      </div>
    </div>
  );
};

export default ModuleItemContainer;
