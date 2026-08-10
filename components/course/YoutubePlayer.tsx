"use client";

import React from "react";
import YouTube from "react-youtube";
import { capture } from "@/lib/analytics/client";

const YoutubePlayerCourse = ({
  videoId,
  courseId,
}: {
  videoId: string;
  /** Optional: lets intro-video plays be attributed to a course. */
  courseId?: string;
}) => {
  return (
    <div className="w-full h-full">
      <YouTube
        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
        opts={{
          width: "100%",
          height: "100%",
        }}
        videoId={videoId}
        // Parity with the Mux player, which already reports these. On a course
        // page this is the intro video, so plays here are a strong interest
        // signal sitting between `product_viewed` and `checkout_started`.
        onPlay={() =>
          capture("video_play", {
            course_id: courseId,
            module_item_id: videoId,
            provider: "youtube",
          })
        }
        onEnd={() =>
          capture("video_completed", {
            course_id: courseId,
            module_item_id: videoId,
            provider: "youtube",
          })
        }
      />
    </div>
  );
};

export default YoutubePlayerCourse;
