CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card" (
	"id" text PRIMARY KEY DEFAULT 'noID' NOT NULL,
	"price_dollars" real NOT NULL,
	"price_pesos" integer NOT NULL,
	"plan_id" text DEFAULT '2c9380848df1fd37018df77f1e5f0625'
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"user_id" text NOT NULL,
	"course_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_items" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"coaching_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coachings" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"price_usd" integer DEFAULT 0 NOT NULL,
	"plan_id" text,
	"description" text DEFAULT '' NOT NULL,
	"video_link" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salas" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"img_url" text NOT NULL,
	"name" text NOT NULL,
	"coaching_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salas_items" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"name" text NOT NULL,
	"link" text NOT NULL,
	"type" text NOT NULL,
	"sala_id" text NOT NULL,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salas_temas" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"name" text NOT NULL,
	"sala_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coachingItems" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"price_usd" integer DEFAULT 0 NOT NULL,
	"public" boolean DEFAULT false NOT NULL,
	"introductory_video" text,
	"beneficios" text DEFAULT '' NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"duracion" text DEFAULT '' NOT NULL,
	"img_url" text,
	"exam_id" text,
	"mp_access_token" text
);
--> statement-breakpoint
CREATE TABLE "course_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"module_number" integer DEFAULT 0 NOT NULL,
	"isFinished" boolean DEFAULT false NOT NULL,
	"current_progress" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ebook" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"price_usd" integer DEFAULT 0 NOT NULL,
	"img_url" text NOT NULL,
	"pdf_url" text NOT NULL,
	"card_color" text NOT NULL,
	"stats_values" jsonb NOT NULL,
	"stats_names" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_ebook" (
	"id" integer PRIMARY KEY NOT NULL,
	"item_title" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"net_amount" integer NOT NULL,
	"payer_name" text,
	"payer_email" text
);
--> statement-breakpoint
CREATE TABLE "payment_on_users_ebooks" (
	"ebook_id" text NOT NULL,
	"user_id" text NOT NULL,
	"payment_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_on_users_ebooks_ebook_id_user_id_payment_id_pk" PRIMARY KEY("ebook_id","user_id","payment_id")
);
--> statement-breakpoint
CREATE TABLE "frequently_asked_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"response" text NOT NULL,
	"course_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"user_name" text NOT NULL,
	"content" text NOT NULL,
	"user_img_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_program" (
	"payment_id" integer PRIMARY KEY NOT NULL,
	"item_title" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"net_amount" integer NOT NULL,
	"payer_name" text,
	"payer_email" text
);
--> statement-breakpoint
CREATE TABLE "payment_on_users_program" (
	"program_id" text NOT NULL,
	"user_id" text NOT NULL,
	"payment_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_on_users_program_program_id_user_id_payment_id_pk" PRIMARY KEY("program_id","user_id","payment_id")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"price_usd" integer DEFAULT 0 NOT NULL,
	"img_url" text NOT NULL,
	"pdf_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"mercadopago_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"paid_price" text,
	"active" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"coaching_id" text
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"video_url" text NOT NULL,
	"semana_id" text NOT NULL,
	"Description" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "semanas" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meeting" (
	"id" text PRIMARY KEY DEFAULT 'noID' NOT NULL,
	"link" text,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"course_id" text NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_schema" (
	"id" integer PRIMARY KEY NOT NULL,
	"item_title" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"net_amount" integer NOT NULL,
	"payer_name" text,
	"payer_email" text,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"rating" real NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules_items" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	" module_id" text NOT NULL,
	"pdf_url" text,
	"video_url" text,
	"mux_asset_id" text,
	"mux_playback_id" text,
	"questionary_id" text,
	"description" text,
	"transcription" text
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"last_time_done" text
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"title" text NOT NULL,
	"isCorrect" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionary" (
	"id" text PRIMARY KEY NOT NULL,
	"module_item_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text,
	"title" text NOT NULL,
	"questionary_id" text
);
--> statement-breakpoint
CREATE TABLE "usersToCourses" (
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "usersToCourses_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"instagram" text NOT NULL,
	"qualities" text NOT NULL,
	"img_url" text NOT NULL,
	"course_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_log" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text,
	"user_id" text,
	"updated_at" timestamp DEFAULT now(),
	"paid_amount" text,
	"amount_cents" integer,
	"product_id" text,
	"product_name" text,
	"payment_source" text,
	"currency" text DEFAULT 'ARS'
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");