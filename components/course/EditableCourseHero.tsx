"use client";

import React from "react";
import { ClockIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Rating } from "./Rating";
import { EditableImage } from "../uploaders/EditableImage";
import { updateCourseImage } from "@/lib/db/actions/edit/course_edit_actions";

type EditableCourseHeroProps = {
  id: string;
  title: string;
  img_url?: string | null;
  rating?: number | null;
  duracion?: string | null;
};

/**
 * Hero used on the editable course page. Same look as `BackGroundCourse`, but the
 * cover image is editable in place: hover to reveal the replace overlay, upload via
 * better-upload, and persist with the `updateCourseImage` safe action.
 */
const EditableCourseHero: React.FC<EditableCourseHeroProps> = ({
  id,
  title,
  img_url,
  rating,
  duracion,
}) => {
  const { execute } = useAction(updateCourseImage, {
    onSuccess: () => toast.success("Imagen actualizada"),
    onError: () => toast.error("No se pudo actualizar la imagen"),
  });

  return (
    <div className="relative">
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {/* Editable cover image (base layer) */}
        <EditableImage
          src={img_url}
          alt={title}
          title="Cambiar imagen"
          fill
          priority
          className="object-cover"
          containerClassName="absolute inset-0"
          onUploadComplete={(url) => execute({ courseId: id, imgUrl: url })}
        />

        {/* Gradient overlays — let pointer events fall through to the image */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />

        {/* Title / rating overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-end">
          <div className="w-full max-w-6xl mx-auto px-6 pb-10">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-2xl">
                {title}
              </h1>
              <div className="flex items-center gap-4">
                <Rating
                  initialValue={rating || 4.5}
                  readonly={true}
                  size="small"
                  showValue={true}
                />
                {duracion && (
                  <div className="flex items-center gap-1.5 text-neutral-300 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    {duracion}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditableCourseHero;
