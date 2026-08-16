ALTER TABLE "courses" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "slug_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_slug_unique" UNIQUE("slug");