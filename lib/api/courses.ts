import { api, unwrap, type ApiEnvelope } from "./client";
import type { Course, CourseGet } from "@/lib/db/actions/courses/get_courses";
import type { ModuleNavigationI } from "@/components/module/ModuleNavigation";
import type { CourseProgressSelect } from "@/lib/db/schema/course_progress";

export async function listCourses(): Promise<Course[]> {
  const res = await api.get<ApiEnvelope<Course[]>>("/courses");
  return unwrap(res.data);
}

export async function listCoursesAdmin(): Promise<Course[]> {
  const res = await api.get<ApiEnvelope<Course[]>>("/courses/admin");
  return unwrap(res.data);
}

export async function getCourse(courseId: string): Promise<CourseGet> {
  const res = await api.get<ApiEnvelope<CourseGet>>(`/courses/${courseId}`);
  return unwrap(res.data);
}

export async function isCourseOwned(courseId: string): Promise<boolean> {
  const res = await api.get<ApiEnvelope<{ owned: boolean }>>(`/courses/${courseId}/owned`);
  return unwrap(res.data).owned;
}

export async function getModule(params: {
  courseId: string;
  moduleId: string;
  progressId: string;
}) {
  const res = await api.get<ApiEnvelope<unknown>>(
    `/courses/${params.courseId}/modules/${params.moduleId}`,
    { params: { progressId: params.progressId } }
  );
  return unwrap(res.data);
}

export async function getCourseProgress(userId: string): Promise<CourseProgressSelect[]> {
  const res = await api.get<ApiEnvelope<CourseProgressSelect[]>>(`/courses/progress/${userId}`);
  return unwrap(res.data);
}

export async function advanceCourseProgress(body: ModuleNavigationI): Promise<void> {
  await api.post<ApiEnvelope<{ ok: true }>>("/courses/progress/next", body);
}
