import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "@/lib/auth";
import type { AppBindings } from "../context";

export const attachSession = createMiddleware<AppBindings>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("session", session);
  await next();
});

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  const session = c.get("session");
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  await next();
});
