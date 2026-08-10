import { redirect } from "next/navigation";
import ButtonAsync from "./ButtonAsync";
import {
  setExamModuleProgress,
  setNextModuleProgress,
} from "@/lib/db/actions/courses_progress_actions";
import { Button } from "../ui/button";
import { moduleTimeline } from "@/lib/db/actions/edit/modules_actions";

export type ModuleNavigationI = {
  previous: string | undefined;
  currentModule: string;
  nextModuleId: string | undefined;
  isLastModule: boolean;
  exam_id: string | null;
  course_id: string;
  progress: number | null;
  amountOfModules: number;
  user_email: string;
  user_id: string;
  course_title: string;
};

const ModuleNavigationTimeline = async ({
  module_id,
  course_id,
}: {
  module_id: string;
  course_id: string;
}) => {
  const navigationTimeline = await moduleTimeline(course_id, module_id);
  return (
    <div className="flex flex-row justify-between items-center pt-4">
      <form
        action={async () => {
          "use server";
          if (navigationTimeline.previous != undefined) {
            redirect(
              `/module/${navigationTimeline.previous}?course=${navigationTimeline.course_id}`
            );
          }
        }}
      >
        <Button type="submit" variant="ghost">
          Anterior Modulo
        </Button>
      </form>

      {!navigationTimeline.isLastModule && (
        <ButtonAsync
          argument={navigationTimeline}
          title="Siguiente modulo"
          onClick={setNextModuleProgress}
        />
      )}
      {navigationTimeline.isLastModule &&
        !navigationTimeline.exam_id != null && (
          <ButtonAsync
            argument={navigationTimeline}
            title="Realizar Examen"
            onClick={setExamModuleProgress}
          />
        )}
    </div>
  );
};

export default ModuleNavigationTimeline;
