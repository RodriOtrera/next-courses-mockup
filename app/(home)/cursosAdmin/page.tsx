import { redirect } from "next/navigation";
import { listCourses } from "@/lib/db/queries/courses";
import { currentUser } from "@/lib/auth/server";
import { cn } from "@/lib/utils";
import { pageStyles } from "../_components/pagestyles";
import CourseContainer from "@/components/course/CourseContainer";
import CrearteCourseModal from "./CreateCourseModal";
import { noindexMetadata } from "@/lib/seo/private-metadata";

export const metadata = noindexMetadata("Administrar cursos");

// This page lists unpublished courses. It is not covered by the proxy matcher,
// so without an explicit guard it was statically prerendered at build time and
// served unpublished course data as public, indexable HTML.
export const dynamic = "force-dynamic";

async function Admin() {
  // Fail closed. `currentUser()` throws rather than returning null when auth is
  // misconfigured (e.g. BETTER_AUTH_SECRET unset), and an uncaught throw here
  // would render a 500 — which Google keeps re-crawling — on a page that must
  // simply be unreachable. Treat any failure as "not signed in".
  // `redirect()` stays outside the try: it signals via a thrown NEXT_REDIRECT
  // that must not be swallowed.
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user) redirect("/login");

  const data = await listCourses(true);

  return (
    <div className={cn("min-h-screen pt-56 ", pageStyles.padding)}>
      <h1 className="font-bold text-3xl  text-neutral-400 mb-8">DASHBOARD</h1>
      <CrearteCourseModal />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((e) => (
          <CourseContainer isAdmin={true} {...e} key={e.id} />
        ))}
      </div>

      <div className="h-40"></div>
    </div>
  );
}

export default Admin;
