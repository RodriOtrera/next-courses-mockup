CREATE TABLE "xp_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"lesson_xp" integer DEFAULT 10 NOT NULL,
	"module_xp" integer DEFAULT 50 NOT NULL,
	"course_xp" integer DEFAULT 200 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "xp_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "xp_ledger_award_idx" ON "xp_ledger" USING btree ("user_id","source","source_id");--> statement-breakpoint
CREATE INDEX "xp_ledger_user_idx" ON "xp_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "xp_ledger_user_course_idx" ON "xp_ledger" USING btree ("user_id","course_id");