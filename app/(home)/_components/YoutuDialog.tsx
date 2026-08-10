import YoutubePlayerCourse from "@/components/course/YoutubePlayer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { youtube_parser } from "@/lib/utils/youtubeParset";
import { Play } from "lucide-react";
import React from "react";

interface YouTubeDialogProps {
  videoLink: string;
  text: string;
}

const YouTubeDialog: React.FC<YouTubeDialogProps> = ({ videoLink }) => {
  
    const videoId = youtube_parser(videoLink);
 
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <button className="group relative mb-6 mt-3 rounded-full px-7 py-3 flex items-center text-sm font-bold tracking-wide bg-gradient-to-r from-[#b8780d] to-[#d4961e] text-black overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_rgba(212,150,30,0.4)]">
            <span className="absolute inset-0 bg-gradient-to-r from-[#e8b830] to-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black/20 group-hover:bg-black/30 transition-colors">
                <Play size={14} className="fill-black ml-0.5" />
              </span>
              VER MASTERCLASS GRATUITA
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] flex flex-col py-8 items-center max-w-[95vw] md:max-w-[1000px] overflow-y-auto">
          <YoutubePlayerCourse videoId={videoId!} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default YouTubeDialog;
