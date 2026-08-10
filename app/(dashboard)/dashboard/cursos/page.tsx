import { getCoursesAdmin } from "@/lib/db/actions/courses/get_courses";
import CourseContainer from "@/components/course/CourseContainer";
import CrearteCourseModal from "@/app/(home)/cursosAdmin/CreateCourseModal";

async function Admin() {
  const data = await getCoursesAdmin();

  return (
    <div className="min-h-screen px-5 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Cursos <span className="text-red-400">.</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {data.length} cursos en total
          </p>
        </div>
        <CrearteCourseModal />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {data.map((e) => (
          <CourseContainer isAdmin={true} {...e} key={e.id} />
        ))}
      </div>
    </div>
  );
}

export default Admin;
