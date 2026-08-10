import { CourseProgressSelection } from "@/lib/db/actions/courses_progress_actions";
import { CourseProgressItem } from "./CourseProgressItem";

export function CourseProgressContainer({ progress }: { progress: CourseProgressSelection[] | undefined }) {
  if (progress == undefined || progress.length == 0) {
    return (
      <div className="  text-neutral-500   py-10 w-[315px] flex justify-center">
        <p> No tienes ningun curso comprado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-[350px] pb-2">
      {progress.map((e) => (
        <CourseProgressItem key={e.id} customWidth={315} courseProgress={e} />
      ))}
    </div>
  );
}
