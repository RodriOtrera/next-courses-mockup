CREATE TABLE IF NOT EXISTS "video_tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"module_item_id" text NOT NULL,
	"kind" text NOT NULL,
	"language_code" text NOT NULL,
	"status" text NOT NULL,
	"mux_track_id" text,
	"robots_job_id" text,
	"units_consumed" integer,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "modules_items" ADD COLUMN IF NOT EXISTS "caption_source_language" text;--> statement-breakpoint
ALTER TABLE "modules_items" ADD COLUMN IF NOT EXISTS "caption_detected_language" text;--> statement-breakpoint
ALTER TABLE "modules_items" ADD COLUMN IF NOT EXISTS "caption_detected_confidence" real;--> statement-breakpoint
ALTER TABLE "modules_items" ADD COLUMN IF NOT EXISTS "caption_targets" text[];--> statement-breakpoint
ALTER TABLE "modules_items" ADD COLUMN IF NOT EXISTS "description_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "modules_items" ADD COLUMN IF NOT EXISTS "description_attempted_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_tracks" ADD CONSTRAINT "video_tracks_module_item_id_modules_items_id_fk" FOREIGN KEY ("module_item_id") REFERENCES "public"."modules_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "video_tracks_item_language_idx" ON "video_tracks" USING btree ("module_item_id","kind","language_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_tracks_item_idx" ON "video_tracks" USING btree ("module_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_tracks_status_idx" ON "video_tracks" USING btree ("status");
