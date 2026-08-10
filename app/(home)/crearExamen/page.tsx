import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createExam,
  Questions,
} from "@/lib/db/actions/courses/questionary_actionst";
import CrearExamen from "./CrearExamen";

import { noindexMetadata } from "@/lib/seo/private-metadata";

export const metadata = noindexMetadata("Crear examen");

export default async function CrearExamenPage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string }>;
}) {
  const { course_id } = await searchParams;

  if (!course_id) {
    redirect("/cursosAdmin");
  }

  return (
    <CrearExamen
      course_id={course_id}
      createQuestionary={async (questions: Questions) => {
        "use server";
        await createExam(course_id, questions);
        // The catalogue lives at /courses; "/cursos" is not a route and this
        // call was a silent no-op.
        revalidatePath("/courses");
        revalidatePath(`/editarCurso/${course_id}`);
        redirect(`/editarCurso/${course_id}`);
      }}
    />
  );
}
