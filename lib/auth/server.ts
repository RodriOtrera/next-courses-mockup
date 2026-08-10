import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Returns the currently authenticated user from the BetterAuth session, or
 * `null` when there is no active session.
 *
 * This project uses BetterAuth — NOT Clerk. Always import `currentUser` from
 * here in Server Components, server actions and route handlers. Do not import
 * from `@clerk/nextjs/server`; that package is not installed and will break the
 * build. The returned user has BetterAuth's shape (`id`, `name`, `email`,
 * `emailVerified`, `image`, ...), so read the email as `user.email`.
 */
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
