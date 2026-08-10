import { UsersAndEbooksAdmin } from "@/components/admin/EbookAdmin";
import { db } from "@/lib/db";
import { getEbooks } from "@/lib/db/actions/products_actions";

async function getUsers() {
  "use server";
  const users = await db.query.users.findMany({
    with: {
      users_to_courses: true,
    },
  });
  return users;
}

export const EbooksUsersServer = async () => {
  const users = await getUsers();
  const ebooks = await getEbooks();

  return (
    <div className="py-24 w-full flex justify-center items-start">
      <UsersAndEbooksAdmin ebooks={ebooks} users={users} />
    </div>
  );
};
