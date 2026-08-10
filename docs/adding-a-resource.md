# Adding a new resource

Template for exposing an existing server action (or adding a fresh one) through the Hono + axios layer. Use **modules** as a worked example.

## 1. The server action is the source of truth

Actions live in `lib/db/actions/`. Keep them pure: no `redirect()`, no `revalidatePath()` inside the part you want reachable from HTTP, since those are Next-only.

```ts
// lib/db/actions/modules/get_modules.ts
"use server";
import { db } from "@/lib/db";
import { modules } from "@/lib/db/schema/modules";
import { eq } from "drizzle-orm";

export async function listModules(courseId: string) {
  return db.query.modules.findMany({
    where: eq(modules.course_id, courseId),
    with: { items: true },
  });
}
export type ModuleRow = Awaited<ReturnType<typeof listModules>>[number];
```

## 2. Hono route

```ts
// lib/hono/routes/modules.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { listModules } from "@/lib/db/actions/modules/get_modules";
import { requireAuth } from "../middleware/auth";
import type { AppBindings } from "../context";

export const modulesRouter = new Hono<AppBindings>()
  .get(
    "/",
    requireAuth,
    zValidator("query", z.object({ courseId: z.string() })),
    async (c) => {
      const { courseId } = c.req.valid("query");
      const data = await listModules(courseId);
      return c.json({ data });
    },
  );
```

## 3. Mount it in the server

```ts
// lib/hono/server.ts
import { modulesRouter } from "./routes/modules";
// ...
app.route("/courses", coursesRouter);
app.route("/modules", modulesRouter);
```

## 4. Typed axios caller

```ts
// lib/api/modules.ts
import { api, unwrap, type ApiEnvelope } from "./client";
import type { ModuleRow } from "@/lib/db/actions/modules/get_modules";

export async function listModules(courseId: string): Promise<ModuleRow[]> {
  const res = await api.get<ApiEnvelope<ModuleRow[]>>("/modules", {
    params: { courseId },
  });
  return unwrap(res.data);
}
```

Re-export from `lib/api/index.ts`:

```ts
export * as modules from "./modules";
```

## 5. Consume it

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { modules } from "@/lib/api";

export function ModuleList({ courseId }: { courseId: string }) {
  const { data } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: () => modules.listModules(courseId),
  });
  return <ul>{data?.map((m) => <li key={m.id}>{m.title}</li>)}</ul>;
}
```

## Conventions

- **One route file per top-level resource**. Sub-resources (`/courses/:id/modules`) live on the parent router.
- **Envelope every response** as `{ data }` or `{ error: { message } }`. Never return a bare array or primitive.
- **Validate inputs with zod** — body, query, and params. Don't trust `c.req.param()` without a schema for anything other than opaque ids.
- **Types flow from the action**, not from the route. Export `type Foo = Awaited<ReturnType<typeof getFoo>>` once at the action and reuse it on both ends.
- **Don't duplicate business logic**. If a route wants to do more than the action, extract a new action — don't fork the logic into Hono.
- **Auth belongs at the route**, not in the action. Actions assume they have a user; Hono's `requireAuth` is the gate.
- **Mutations that change UI state** — after a successful axios POST, invalidate the relevant react-query keys from the caller. Don't try to `revalidatePath` from inside a Hono handler; that API only works in Next server contexts.

## When NOT to add an HTTP route

If a feature is only ever triggered from a `<form action={fn}>` in a server component, leave it as a pure server action. The HTTP layer exists for:

- Client-side fetching with react-query / SWR.
- External consumers (mobile app, webhook, partner).
- Anywhere you need the request/response to be inspectable by curl.
