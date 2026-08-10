import { getCourse } from "@/lib/db/actions/courses/get_courses";
import { notFound } from "next/navigation";
import MuxPlayerComponent from "@/components/mux/MuxPlayer";
import YoutubePlayerCourse from "@/components/course/YoutubePlayer";
import { youtube_parser } from "@/lib/utils/youtubeParset";
import { ChevronLeft, ChevronRight, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";
import { PreviewVideoUpload } from "@/components/course/PreviewVideoUpload";
import { GenerateDescriptionButton } from "@/components/course/GenerateDescriptionButton";
import { DescriptionBlock } from "@/components/course/DescriptionBlock";
import { CaptionStatus } from "@/components/mux/CaptionStatus";
import { QuestionaryEditor } from "@/components/questionary/QuestionaryEditor";
import { getQuestionary } from "@/lib/db/actions/courses/questionary_actionst";

export default async function PreviewModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id, moduleId } = await params;
  const course = await getCourse(id);

  // Build flat list of all module items
  const allItems = course.modules.flatMap((mod) =>
    mod.items.map((item) => ({
      ...item,
      moduleName: mod.title,
    }))
  );

  const currentIndex = allItems.findIndex((item) => item.id === moduleId);
  if (currentIndex === -1) notFound();

  const currentItem = allItems[currentIndex];
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  const isMuxVideo = !!currentItem.mux_playback_id;
  const isYoutube = !!currentItem.video_url;
  const youtubeId = isYoutube
    ? youtube_parser(currentItem.video_url!)
    : null;

  // What ASR actually found beats what the uploader declared; "auto" is not a
  // language the player can switch to.
  const detected = currentItem.caption_detected_language;
  const requested = currentItem.caption_source_language;
  const spokenLanguage =
    detected ?? (requested && requested !== "auto" ? requested : undefined);

  // Fetch existing questionary data if this is a questionnaire item
  let questionaryData = null;
  if (currentItem.type === "questionario" && currentItem.questionary_id) {
    try {
      questionaryData = await getQuestionary(currentItem.questionary_id);
    } catch {
      // Questionary not found — allow creating a new one
    }
  }

  return (
    <div className="p-6 md:px-12 md:py-8 space-y-6 w-full max-w-[900px] mx-auto">
      {/* Header: title + navigation */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-red-400/80 uppercase tracking-wider mb-1">
            {currentItem.moduleName}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white/90 md:text-3xl">
            {currentItem.title}
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          {prevItem ? (
            <Link
              href={`/editarCurso/${id}/preview/${prevItem.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.04] text-white/15">
              <ChevronLeft className="h-4 w-4" />
            </div>
          )}

          <span className="min-w-[90px] text-center text-xs font-bold uppercase tracking-widest text-white/40">
            Clase {currentIndex + 1}/{allItems.length}
          </span>

          {nextItem ? (
            <Link
              href={`/editarCurso/${id}/preview/${nextItem.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500/50 hover:bg-red-500/20 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.04] text-white/15">
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {/* Video player */}
      {currentItem.type === "video" && (
        <>
          {isMuxVideo ? (
            <>
              <MuxPlayerComponent
                playbackId={currentItem.mux_playback_id!}
                title={currentItem.title}
                defaultSubtitlesLang={spokenLanguage}
              />
              {/* Chips while subtitles are being generated, and the panel for
                  adding a language to a video that already finished. */}
              <CaptionStatus
                moduleItemId={currentItem.id!}
                courseId={id}
                autoStart
              />
            </>
          ) : youtubeId ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-black border border-white/[0.06]">
              <YoutubePlayerCourse videoId={youtubeId} />
            </div>
          ) : (
            <PreviewVideoUpload
              moduleItemId={currentItem.id!}
              moduleItemTitle={currentItem.title}
              courseId={id}
            />
          )}
        </>
      )}

      {/* PDF */}
      {currentItem.type === "pdf" && currentItem.pdf_url && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col items-center gap-3">
          <FileText className="h-10 w-10 text-blue-400/60" />
          <a
            href={currentItem.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            Abrir PDF
          </a>
        </div>
      )}

      {/* Questionnaire editor */}
      {currentItem.type === "questionario" && (
        <QuestionaryEditor
          moduleItemId={currentItem.id!}
          courseId={id}
          initialQuestions={questionaryData?.questions}
        />
      )}

      {/* Generate description button — shown when Mux video exists but no description */}
      {isMuxVideo && !currentItem.description && (
        <GenerateDescriptionButton
          playbackId={currentItem.mux_playback_id!}
          title={currentItem.title}
          moduleItemId={currentItem.id!}
        />
      )}

      {/* Description */}
      {currentItem.description && (
        <DescriptionBlock
          description={currentItem.description}
          transcription={currentItem.transcription}
          moduleItemId={currentItem.id!}
          courseId={id}
        />
      )}
    </div>
  );
}
