import { TitleOfProduts } from "../_components/TitleOfProducts";
import CourseContainer from "./CourseContainer";
import { getCourses } from "@/lib/db/actions/courses/get_courses";

interface CoursesSectionProps {
  isAdmin: boolean;
}

export default async function CoursesSection({ isAdmin }: CoursesSectionProps) {
  const courses = await getCourses();

  return (
    <section>
      <TitleOfProduts
        title="CURSOS"
        content="EN LOS CURSOS PODRAS TENER LA INFORMACION COMPLETA DEL ELEMENTO CON VIDEOS, PDFS Y CUESTIONARIOS PARA PROBAR TU SABIDURIA."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseContainer key={course.id} {...course} isAdmin={isAdmin} />
        ))}
      </div>
    </section>
  );
}
