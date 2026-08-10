"use server";

import { db } from "../..";
import { users } from "../../schema/auth_schema";
import { payment_log_schema } from "../../schema/payment_log_schema";
import { count } from "drizzle-orm";

export async function getHomeStats() {
  const [usersCount] = await db
    .select({ count: count() })
    .from(users);

  const [salesCount] = await db
    .select({ count: count() })
    .from(payment_log_schema);

  return {
    users: usersCount.count,
    sales: salesCount.count,
  };
}
