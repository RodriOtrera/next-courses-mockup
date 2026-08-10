import { currentUser } from "@/lib/auth/server";
import { getUserCourseProgress } from "@/lib/db/actions/courses_progress_actions";
import { TitleOfProduts } from "../_components/TitleOfProducts";
import { MyCoursesClient } from "./MyCoursesAndCoachingClient";

export async function MyCoursesSection() {
  const user = await currentUser();
  if (!user) return null;

  const courseProgress = await getUserCourseProgress(user.id);
  if (courseProgress.length === 0) return null;

  return (
    <section>
      <TitleOfProduts
        title="MIS CURSOS"
        content="ACCEDE A TUS CURSOS COMPRADOS Y CONTINUA DONDE LO DEJASTE."
      />
      <MyCoursesClient courseProgress={courseProgress} />
    </section>
  );
}
