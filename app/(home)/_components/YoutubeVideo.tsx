"use client";

import useWindowDimensions from "@/lib/utils/useWindowDimensions";
import React from "react";
import YouTube from "react-youtube";

export const YoutubePlayerCourse = ({ videoId }: { videoId: string }) => {
  const { width } = useWindowDimensions();

  return (
    <div>
      <YouTube
        opts={{
          width: width > 800 ? width / 2 : width - 40,
          height: width > 800 ? (width * 0.5625) / 2 : 400,
        }}
        videoId={videoId}
      />
    </div>
  );
};

export const YoutubePlayerFixedWidth = ({
  videoId,
  height,
  width,
}: {
  videoId: string;
  width: number;
  height: number;
}) => {
  const { width: widthDevice } = useWindowDimensions();

  return (
    <div>
      <YouTube
        opts={{
          width: widthDevice < width ? widthDevice - 20 : width,
          height: widthDevice < width ? (9 * width) / 16 - 20 : height,
        }}
        videoId={videoId}
      />
    </div>
  );
};

