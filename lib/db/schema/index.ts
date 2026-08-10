import * as auth from "./auth_schema";
import * as ebooks from "./ebook_schema";
import * as programs from "./program_schema";
import * as subscriptions from "./subscrition_schema";
import * as videos from "./videos";
import * as semanas from "./semanas";
import * as meeting from "./meeting";
import * as card_price from "./card_price";
import * as certifications from "./certifications";
import * as course_progress from "./course_progress";
import * as modules from "./modules";
import * as payment_schema from "./payment_schema";
import * as testimonials from "./testimonials";
import * as modules_items from "./modules_items";
import * as video_tracks from "./video_tracks";
import * as course from "./course";
import * as exams from "./questionary_or_exam";
import * as usersToCourses from "./users_to_courses";
import * as instructors from "./instructors";
import * as frequently_asked_questions from "./frequently_asked_questions";
import * as coachingItems from "./coaching_items";
import * as home_testimonials from "./home_testimonials";
import * as coachings from "./coachings";
import * as payment_log_schema from "./payment_log_schema";
import * as gamification from "./gamification";

export * from "./auth_schema";
export * from "./ebook_schema";
export * from "./program_schema";
// Both ebook_schema and program_schema export a `PaymentInsertSchema`. The
// ebook one is what consumers of this barrel mean; re-export it explicitly so
// the star exports above don't collide. The program variant stays reachable
// via `@/lib/db/schema/program_schema`.
export type { PaymentInsertSchema } from "./ebook_schema";
export * from "./subscrition_schema";
export * from "./videos";
export * from "./semanas";
export * from "./meeting";
export * from "./card_price";
export * from "./certifications";
export * from "./course_progress";
export * from "./modules";
export * from "./payment_schema";
export * from "./testimonials";
export * from "./modules_items";
export * from "./video_tracks";
export * from "./course";
export * from "./questionary_or_exam";
export * from "./users_to_courses";
export * from "./instructors";
export * from "./frequently_asked_questions";
export * from "./coaching_items";
export * from "./home_testimonials";
export * from "./coachings";
export * from "./payment_log_schema";
export * from "./gamification";

// The user table is exported twice (`user` and the `users` alias). Registering
// the same physical table under two keys leaves one key with empty relations,
// which breaks `db.query.users(...).with` — keep only the `users` key.
const { user: _userAlias, ...authSchema } = auth;

const schema = {
  ...authSchema,
  ...ebooks,
  ...instructors,
  ...testimonials,
  ...coachings,
  ...coachingItems,
  ...home_testimonials,
  ...payment_log_schema,
  ...programs,
  ...exams,
  ...frequently_asked_questions,
  ...usersToCourses,
  ...course,
  ...subscriptions,
  ...semanas,
  ...videos,
  ...meeting,
  ...card_price,
  ...certifications,
  ...course_progress,
  ...modules,
  ...payment_schema,
  ...modules_items,
  ...video_tracks,
  ...gamification,
};

export default schema;
