"use client";

import { useMemo } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { authClient } from "@/lib/auth/client";
import { capture } from "@/lib/analytics/client";

interface MuxPlayerComponentProps {
  playbackId: string;
  title?: string;
  /** Enables joining Mux Data engagement back to a lesson and course. */
  videoId?: string;
  courseId?: string;
  /**
   * Subtitle track to switch on by default, e.g. the lesson's spoken language.
   *
   * Every generated and translated track is attached to the asset itself, so
   * the CC menu is populated by Mux with no work here — this only picks which
   * one starts enabled.
   */
  defaultSubtitlesLang?: string;
}

export default function MuxPlayerComponent({
  playbackId,
  title,
  videoId,
  courseId,
  defaultSubtitlesLang,
}: MuxPlayerComponentProps) {
  const { data: session } = authClient.useSession();

  // Part of the playback URL: a value that changed once a translation landed
  // would re-source the player mid-playback, so this is derived from what was
  // requested at upload and never from track readiness.
  const subtitleParams = useMemo(
    () =>
      defaultSubtitlesLang
        ? { default_subtitles_lang: defaultSubtitlesLang }
        : undefined,
    [defaultSubtitlesLang],
  );

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <MuxPlayer
        playbackId={playbackId}
        // `video_title` alone makes Mux Data unusable for per-user engagement:
        // there's no way to say who watched what, or to join a view back to a
        // lesson. These three fields are what turn it on, at no bundle cost.
        metadata={{
          video_title: title ?? "Video",
          video_id: videoId ?? playbackId,
          viewer_user_id: session?.user?.id,
        }}
        extraSourceParams={subtitleParams}
        streamType="on-demand"
        autoPlay={false}
        className="h-full w-full"
        accentColor="#EC4E39"
        style={{ aspectRatio: "16/9" }}
        onPlay={() =>
          capture("video_play", {
            course_id: courseId,
            module_item_id: videoId,
            provider: "mux",
          })
        }
        onEnded={() =>
          capture("video_completed", {
            course_id: courseId,
            module_item_id: videoId,
            provider: "mux",
          })
        }
      />
    </div>
  );
}
