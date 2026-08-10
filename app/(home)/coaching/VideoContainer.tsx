import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VideoInsert } from "@/lib/db/schema/videos";
import { youtube_parser } from "@/lib/utils/youtubeParset";
import { PlayCircleIcon, TrashIcon } from "lucide-react";
import Image from "next/image";
import { deleteVideo } from "@/lib/db/actions/subscription/videos_actions";
import { YoutubePlayerCourse } from "../_components/YoutubeVideo";

const imageLink = (id: string) =>
  `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

const VideoContainer = ({
  video,
  admin = false,
}: {
  video: VideoInsert;
  admin?: boolean;
}) => {
  const videoId = youtube_parser(video.videoUrl);
  const videoImg = imageLink(videoId!);

  return (
    <div className="flex md:flex-row flex-col my-4 hover:bg-neutral-900  transition-all px-1 py-2 cursor-pointer rounded-lg">
      <div className="aspect-video min-w-[250px] rounded-xl overflow-hidden bg-neutral-800 flex justify-center items-center relative">
        <PlayCircleIcon className="h-12 w-12 text-neutral-400" />
        <Image
          src={videoImg}
          fill={true}
          alt={`Video: ${video.title}`}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col ml-1 md:ml-4 items-start mt-2 flex-1">
        <h1 className="text-md md:text-xl font-extrabold">{video.title}</h1>
        <p className="text-sm text-neutral-500 mt-1 min-w-full">
          {video.description}
        </p>
        {admin && (
          <form action={deleteVideo} className="self-end w-full flex justify-end">
            <input hidden name="id" defaultValue={video.id} />
            <Button
              variant="ghost"
              className="mt-4 border-red-800 mb-2 hover:border-neutral-800 ml-auto transition-all border text-red-700"
            >
              <TrashIcon className="mr-2 h-6 w-6 " />
              Eliminar Video
            </Button>
          </form>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-auto mr-2 ml-auto">
              <PlayCircleIcon className="mr-2" />
              Ver Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] flex flex-col py-8 items-center max-w-[95vw] md:max-w-[1000px] overflow-y-auto">
            <YoutubePlayerCourse videoId={youtube_parser(video.videoUrl)!} />
            <div className="flex w-full md:px-12 flex-col items-start ">
              <h1 className="font-bold text-lg">{video.title}</h1>
              <p className="text-sm text-stone-400 mt-1">{video.description}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VideoContainer;
