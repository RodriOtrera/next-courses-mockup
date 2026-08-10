import { ModuleVideoType } from "@/lib/db/schema/modules_items";
import YoutubePlayerCourse from "../course/YoutubePlayer";
import MuxPlayerComponent from "../mux/MuxPlayer";
import { youtube_parser } from "@/lib/utils/youtubeParset";

const ModuleVideo = ({ moduleVideo }: { moduleVideo: ModuleVideoType }) => {
  const isMuxVideo = !!moduleVideo.mux_playback_id;

  // What ASR actually found beats what the uploader declared; "auto" is not a
  // language the player can switch to.
  const requested = moduleVideo.caption_source_language;
  const spokenLanguage =
    moduleVideo.caption_detected_language ??
    (requested && requested !== "auto" ? requested : undefined);

  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-xs font-medium text-red-400/80 uppercase tracking-wider mb-1">
          Modulo
        </h2>
        <h1 className="font-bold text-2xl md:text-3xl text-white/90">
          {moduleVideo.title}
        </h1>
      </div>
      {isMuxVideo ? (
        // No lesson id on this type, so MuxPlayer falls back to the playback id
        // as `video_id`; that still joins back via modules_items.mux_playback_id.
        <MuxPlayerComponent
          playbackId={moduleVideo.mux_playback_id!}
          title={moduleVideo.title}
          defaultSubtitlesLang={spokenLanguage}
        />
      ) : moduleVideo.video_url ? (
        (() => {
          const videoId = youtube_parser(moduleVideo.video_url);
          return videoId ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-black border border-white/[0.06]">
              <YoutubePlayerCourse videoId={videoId} />
            </div>
          ) : (
            <div>Not found</div>
          );
        })()
      ) : (
        <div>Not found</div>
      )}
      {moduleVideo.description && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
            Descripcion
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            {moduleVideo.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default ModuleVideo;
