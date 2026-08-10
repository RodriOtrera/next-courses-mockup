import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { attachSession } from "./middleware/auth";
import { coursesRouter } from "./routes/courses";
import type { AppBindings } from "./context";

export const app = new Hono<AppBindings>().basePath("/api/v1");

app.use("*", logger());
app.use("*", attachSession);

app.get("/health", (c) => c.json({ data: { ok: true } }));

const routes = app.route("/courses", coursesRouter);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: { message: err.message } }, err.status);
  }
  console.error(err);
  return c.json({ error: { message: "Internal server error" } }, 500);
});

app.notFound((c) => c.json({ error: { message: "Not found" } }, 404));

export type AppType = typeof routes;
