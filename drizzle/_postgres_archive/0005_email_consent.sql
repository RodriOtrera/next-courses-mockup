-- Marketing consent + broadcast audit log.
--
-- Hand-trimmed after `drizzle-kit generate`: the generator also re-emitted the
-- whole of 0004 (video_tracks / modules_items caption columns) because 0004 was
-- authored by hand and has no snapshot in drizzle/meta. Those objects already
-- exist, so only the two new tables are kept here. 0005_snapshot.json does
-- describe the full state, which is correct and puts future diffs back in sync.
--
-- Written re-runnable (`IF NOT EXISTS`, `EXCEPTION WHEN duplicate_object`)
-- because scripts/apply-migration.ts applies statements one at a time with no
-- transaction — the Neon HTTP driver has none — and swallows "already exists".

CREATE TABLE IF NOT EXISTS "email_consent" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"source" text NOT NULL,
	"token_hash" text,
	"token_expires_at" timestamp,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"consent_ip" text,
	"consent_user_agent" text,
	"resend_contact_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_broadcast" (
	"id" text PRIMARY KEY NOT NULL,
	"resend_broadcast_id" text,
	"cohort" text NOT NULL,
	"subject" text NOT NULL,
	"preview_text" text,
	"html" text NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"created_by" text NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_consent" ADD CONSTRAINT "email_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_consent_email_idx" ON "email_consent" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_consent_user_idx" ON "email_consent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_consent_status_idx" ON "email_consent" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_consent_token_idx" ON "email_consent" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_broadcast_status_idx" ON "email_broadcast" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_broadcast_created_at_idx" ON "email_broadcast" USING btree ("created_at");
