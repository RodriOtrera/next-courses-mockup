import { UsersAndCoursesAdmin } from "@/components/admin/CourseAdmin";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema/course";

export type UserDB = AwaitedReturn<typeof getUsers>[number];

async function getUsers() {
  "use server";
  const users = await db.query.users.findMany({
    with: {
      users_to_courses: true,
    },
  });
  return users;
}
export const CoursesUsersServer = async () => {
  const users = await getUsers();
  const courses2 = await db.select().from(courses);

  return (
    <div className="w-full">
      <UsersAndCoursesAdmin courses={courses2} users={users} />
    </div>
  );
};