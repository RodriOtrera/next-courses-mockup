"use client";
import { CourseProgressSelection } from "@/lib/db/actions/courses_progress_actions";
import { useRouter } from "next/navigation";
import HorizontalProgressBarCourse from "./HorizontalProgressBarCourse";
import { Button } from "../ui/button";

export const CourseProgressItem = ({
  customWidth,
  courseProgress,
}: {
  customWidth?: number;
  courseProgress: CourseProgressSelection;
}) => {
  const router = useRouter();
  return (
    <div>
      <button
        className="w-full   py-4 hover:bg-neutral-900 px-4 rounded-large"
        onClick={() => {
          router.push(
            `/module/${courseProgress.module_id}?course=${courseProgress.course_id}&course_progress=${courseProgress.id}`
          );
        }}
      >
        <div>
          <div className="flex flex-col items-start">
            <h2 className="font-bold">{courseProgress.courseTitle}</h2>
            <h2 className=" text-neutral-400 text-sm  pb-2">
              Modulo - {courseProgress.moduleTitle}
            </h2>
          </div>

          <div>
            <HorizontalProgressBarCourse
              maxWidth={!!customWidth ? customWidth - 35 : undefined}
              percentage={courseProgress.rating}
              thickness={8}
            />
          </div>
        </div>
      </button>
      {courseProgress.isFinished && !courseProgress.certification_id && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              if (courseProgress.exam_id == null) {
                throw Error("No se ha creado ningun examen para este curso");
              }
              router.push(
                `/examen?exam_id=${courseProgress.exam_id}&course_id=${courseProgress.course_id}`
              );
            }}
          >
            Dar examen
          </Button>
        </div>
      )}
      {!!courseProgress.certification_id && (
        <div className="flex justify-center mb-2">
          <Button
            variant="outline"
            onClick={() => {
              if (courseProgress.exam_id == null) {
                throw Error("No se ha creado ningun examen para este curso");
              }
              router.push(`/certificados/${courseProgress.certification_id}`);
            }}
          >
            Obtener certificado
          </Button>
        </div>
      )}
    </div>
  );
};
