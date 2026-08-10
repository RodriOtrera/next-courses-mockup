import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth_schema";
import { count } from "drizzle-orm";
import AnimatedCounter from "../ui/AnimatedCounter";
import { Users } from "lucide-react";

async function getUsersCount() {
  "use server";
  return await db.select({ count: count() }).from(users);
}

export default async function UsersCount() {
  const usersCount = await getUsersCount();

  return (
    <AnimatedCounter
      value={usersCount[0].count}
      label="Usuarios"
      icon={<Users className="w-4 h-4 text-blue-400" />}
    />
  );
}
