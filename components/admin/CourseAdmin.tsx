"use client";

import React, { useEffect, useState } from "react";
import { CourseOnly } from "@/lib/db/schema/course";
import CoursesSearch from "./CoursesSearch";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { addCourseAction } from "@/lib/db/actions/courses/add_course_action";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { UserDB } from "./CoursesUsersServer";
import UsersSearch from "./UsersSearch";

export const UsersAndCoursesAdmin = ({
  courses,
  users,
}: {
  users: UserDB[];
  courses: CourseOnly[];
}) => {
  const [userSelected, setuserSelected] = useState<UserDB | null>(null);
  const [courseSelected, setcourseSelected] = useState<CourseOnly | null>(null);
  const { executeAsync, isExecuting, hasSucceeded } =
    useAction(addCourseAction);

  const searchParams = useSearchParams();

  const course_id = searchParams.get("course_id");
  const user_id = searchParams.get("user_id");

  useEffect(() => {
    if (course_id && user_id) {
      const course = courses.find((e) => e.id == course_id);
      const user = users.find((e) => e.id == user_id);
      if (course && user) {
        setcourseSelected(course);
        setuserSelected(user);
      }
    }
  }, [course_id, user_id, courses, users]);

  return (
    <div className="flex flex-col">
      <UsersSearch
        userSelect={userSelected}
        handleUserSelect={(user) => {
          setuserSelected(user);
        }}
        users={users}
      />
      <CoursesSearch
        courseSelect={courseSelected}
        handleCourseSelect={(course) => {
          setcourseSelected(course);
        }}
        courses={courses}
      />{" "}
      {isExecuting ? (
        <Loader2 className="mt-4 text-green-400 self-end animate-spin" />
      ) : (
        <Button
          disabled={!userSelected || !courseSelected}
          className="mt-4 self-end"
          variant="outline"
          onClick={async () => {
            await executeAsync({
              course_id: courseSelected!.id,
              user_id: userSelected!.id,
            });

            toast.success(
              `Curso ${courseSelected?.title} agregado a ${userSelected?.email}`
            );
          }}
        >
          Confirmar agregar curso
        </Button>
      )}
      {/* {hasSucceeded && (
        <p className="text-green-400">
          Curso agregado a {userSelected?.email} con exito
        </p>
      )} */}
    </div>
  );
};
