import { InferSelectModel, relations } from "drizzle-orm";
import { usersToCourses } from "./users_to_courses";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { testimonials } from "./testimonials";
import { modules } from "./modules";
import { payment_schema } from "./payment_schema";
import { course_progress } from "./course_progress";
import { certifications } from "./certifications";
import { instructors } from "./instructors";
import { exams } from "./questionary_or_exam";
import { frequentlyAskedQuestions } from "./frequently_asked_questions";


export const courses = pgTable('courses', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    price: integer('price').default(0).notNull(),
    price_usd: integer('price_usd').default(0).notNull(),
    is_public: boolean('public').default(false).notNull(),
    introductory_video: text('introductory_video'),
    beneficios: text('beneficios').default("").notNull(),
    descripcion: text('descripcion').default("").notNull(),
    duracion: text('duracion').default("").notNull(),
    img_url: text("img_url"),
    exam_id: text("exam_id"),
    mp_access_token: text("mp_access_token"),

    // Public URL key. `id` remains the primary key and the identifier embedded
    // in MercadoPago/PayPal references and PostHog events — the slug is a
    // presentation concern only, so nothing downstream has to be repointed.
    //
    // Nullable during the backfill, tightened to NOT NULL once every row has a
    // value. NULL is used rather than a '' default on purpose: an empty string
    // looks valid and would silently produce courses reachable at `/cursos/`,
    // whereas NULL makes an incomplete backfill fail loudly at the gate.
    slug: text('slug').notNull().unique('courses_slug_unique'),

    // One-way latch, set the first time the course is published. Gating slug
    // regeneration on this rather than on current `is_public` matters:
    // unpublish → edit title → republish is an ordinary admin workflow, and
    // reading `is_public` would silently unfreeze an already-indexed URL.
    slug_locked: boolean('slug_locked').default(false).notNull(),

    // Honest `lastModified` for the sitemap. Without it the only options are
    // omitting the field or emitting `new Date()`, and Google discounts
    // sitemaps whose lastmod it learns not to trust.
    updated_at: timestamp('updated_at').defaultNow(),
})


export const courses_relations = relations(courses, ({ many, one }) => ({
    users_to_courses: many(usersToCourses),
    testimonials: many(testimonials),
    modules: many(modules),
    payments: many(payment_schema),
    course_progress: many(course_progress),
    certifications: many(certifications),
    instructors: many(instructors),
    exam: one(exams, {
        fields: [courses.exam_id],
        references: [exams.id]
    }),
    frequentlyAskedQuestions: many(frequentlyAskedQuestions)

}))


export type CourseOnly = InferSelectModel<typeof courses>