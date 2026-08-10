import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getCourse, getCourses, getCoursesAdmin, userBoughtThisCourse } from "@/lib/db/actions/courses/get_courses";
import { getModule } from "@/lib/db/actions/courses/get_module";
import { getUserCourseProgress, setNextModuleProgress } from "@/lib/db/actions/courses_progress_actions";
import { requireAuth } from "../middleware/auth";
import type { AppBindings } from "../context";

// Mirrors ModuleNavigationI — the client posts that whole object, so every
// field it carries has to survive validation.
const progressBodySchema = z.object({
  course_id: z.string(),
  user_id: z.string(),
  user_email: z.string().email(),
  course_title: z.string(),
  currentModule: z.string(),
  previous: z.string().optional(),
  nextModuleId: z.string().optional(),
  isLastModule: z.boolean(),
  progress: z.number().nullable(),
  amountOfModules: z.number(),
  exam_id: z.string().nullable(),
});

export const coursesRouter = new Hono<AppBindings>()
  .get("/", async (c) => {
    const data = await getCourses();
    return c.json({ data });
  })
  .get("/admin", requireAuth, async (c) => {
    const data = await getCoursesAdmin();
    return c.json({ data });
  })
  .get("/:id", async (c) => {
    try {
      const data = await getCourse(c.req.param("id"));
      return c.json({ data });
    } catch {
      throw new HTTPException(404, { message: "Course not found" });
    }
  })
  .get("/:id/owned", requireAuth, async (c) => {
    const owned = await userBoughtThisCourse(c.req.param("id"));
    return c.json({ data: { owned } });
  })
  .get("/:id/modules/:moduleId", requireAuth, async (c) => {
    const progressId = c.req.query("progressId");
    if (!progressId) {
      throw new HTTPException(400, { message: "progressId query param required" });
    }
    const data = await getModule(c.req.param("moduleId"), c.req.param("id"), progressId);
    return c.json({ data });
  })
  .get("/progress/:userId", requireAuth, async (c) => {
    const session = c.get("session")!;
    if (session.user.id !== c.req.param("userId")) {
      throw new HTTPException(403, { message: "Forbidden" });
    }
    const data = await getUserCourseProgress(c.req.param("userId"));
    return c.json({ data });
  })
  .post("/progress/next", requireAuth, zValidator("json", progressBodySchema), async (c) => {
    const body = c.req.valid("json");
    // Built key-by-key so the optional-in-zod fields are still present keys,
    // which is what ModuleNavigationI requires.
    await setNextModuleProgress({
      course_id: body.course_id,
      user_id: body.user_id,
      user_email: body.user_email,
      course_title: body.course_title,
      currentModule: body.currentModule,
      previous: body.previous,
      nextModuleId: body.nextModuleId,
      isLastModule: body.isLastModule,
      progress: body.progress,
      amountOfModules: body.amountOfModules,
      exam_id: body.exam_id,
    });
    return c.json({ data: { ok: true } });
  });

export type CoursesRouter = typeof coursesRouter;
