import type { auth } from "@/lib/auth";

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type AppBindings = {
  Variables: {
    session: AuthSession;
  };
};
