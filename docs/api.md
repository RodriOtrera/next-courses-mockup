# HTTP API — Hono + axios

The HTTP layer is a thin Hono app mounted under `/api/v1`. It wraps the existing server actions in `lib/db/actions/` so that the same business logic is callable from three places:

1. **Server components / server actions** — call the action function directly.
2. **Client components** — use the typed axios callers in `lib/api/*`.
3. **External clients** (mobile, curl, webhooks) — hit the HTTP endpoint.

## Layout

```
app/api/v1/[[...route]]/route.ts   ← Next.js catch-all, hands off to Hono
lib/hono/
  server.ts                        ← Hono app, middleware, error handler
  context.ts                       ← typed Variables (session, etc.)
  middleware/auth.ts               ← attachSession + requireAuth
  routes/
    courses.ts                     ← /courses/* endpoints
lib/api/
  client.ts                        ← axios instance, envelope helpers
  courses.ts                       ← typed callers for course routes
  index.ts                         ← barrel re-export
```

## Response envelope

Every handler returns one of two shapes. Keep this consistent as you add routes.

```ts
// success
{ data: T }

// error  (status ∈ 4xx | 5xx)
{ error: { message: string } }
```

`lib/api/client.ts` exposes `unwrap()`, `isApiError()`, and `messageOf()` to work with these uniformly.

## Auth

The mockup uses **better-auth** with the email-OTP plugin (`lib/auth/index.ts`). Session cookies are forwarded automatically because the axios instance sets `withCredentials: true` and the browser is on the same origin.

Inside Hono:

- `attachSession` runs on every request and puts the session on `c.var.session`.
- `requireAuth` short-circuits with a 401 if there is no session.

```ts
import { requireAuth } from "../middleware/auth";

router.get("/private", requireAuth, (c) => {
  const session = c.get("session")!;  // non-null inside requireAuth
  return c.json({ data: { userId: session.user.id } });
});
```

## Validation

Use `@hono/zod-validator` to parse JSON bodies, query strings, and route params. Validation errors become `400`s automatically.

```ts
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

router.post(
  "/progress/next",
  requireAuth,
  zValidator("json", z.object({ course_id: z.string(), /* ... */ })),
  async (c) => {
    const body = c.req.valid("json");
    // ...
  },
);
```

## Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Path | Auth | Wraps | Notes |
|---|---|---|---|---|
| `GET`  | `/health` | – | – | Liveness probe. |
| `GET`  | `/courses` | – | `getCourses()` | Public courses + computed rating. |
| `GET`  | `/courses/admin` | ✓ | `getCoursesAdmin()` | Includes unpublished. |
| `GET`  | `/courses/:id` | – | `getCourse(id)` | Full detail with modules, instructors, testimonials. |
| `GET`  | `/courses/:id/owned` | ✓ | `userBoughtThisCourse(id)` | `{ owned: boolean }`. |
| `GET`  | `/courses/:id/modules/:moduleId?progressId=…` | ✓ | `getModule(...)` | Returns the module item or falls back to the first module of the course. |
| `GET`  | `/courses/progress/:userId` | ✓ (self) | `getUserCourseProgress(userId)` | 403 if `userId` ≠ session user. |
| `POST` | `/courses/progress/next` | ✓ | `setNextModuleProgress(body)` | Advances progress and may trigger completion emails. |

## Using axios from the client

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { courses } from "@/lib/api";

export function CourseList() {
  const { data, isPending, error } = useQuery({
    queryKey: ["courses"],
    queryFn: courses.listCourses,
  });

  if (isPending) return <p>Cargando…</p>;
  if (error) return <p>{messageOf(error)}</p>;
  return (
    <ul>{data.map((c) => <li key={c.id}>{c.title}</li>)}</ul>
  );
}
```

Mutations:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { courses } from "@/lib/api";

const qc = useQueryClient();
const advance = useMutation({
  mutationFn: courses.advanceCourseProgress,
  onSuccess: () => qc.invalidateQueries({ queryKey: ["progress"] }),
});
```

## Calling from a server component

You rarely want to go through HTTP on the server. Prefer importing the action directly:

```ts
import { getCourses } from "@/lib/db/actions/courses/get_courses";
const list = await getCourses();
```

If you do need HTTP on the server (e.g. proxying to an external caller), the axios client auto-resolves a base URL from `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → `http://localhost:3000`.

## Error handling

Handlers throw `HTTPException` from `hono/http-exception` to return typed error responses:

```ts
import { HTTPException } from "hono/http-exception";

if (!course) throw new HTTPException(404, { message: "Course not found" });
```

The global `app.onError` in `lib/hono/server.ts` converts any thrown `Error` into the standard envelope. Don't wrap handler bodies in try/catch unless you need to transform the error — let it bubble.

## Runtime

`app/api/v1/[[...route]]/route.ts` sets `export const runtime = "nodejs"`. The courses actions use `@neondatabase/serverless` (works on both node and edge) but several wrapped actions rely on `@mux/mux-node`, `nodemailer`, etc. that require node. Keep this as `nodejs` unless you split edge-safe endpoints into a separate group.

## Env vars

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection. |
| `RESEND_FROM`, `RESEND_API_KEY` | OTP delivery via better-auth. |
| `NEXT_PUBLIC_APP_URL` | Optional explicit base URL for server-side axios. |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | better-auth session signing + CORS. |

## Extending

See [adding-a-resource.md](./adding-a-resource.md).
