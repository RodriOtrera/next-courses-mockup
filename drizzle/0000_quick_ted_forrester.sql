CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `card` (
	`id` text PRIMARY KEY DEFAULT 'noID' NOT NULL,
	`price_dollars` real NOT NULL,
	`price_pesos` integer NOT NULL,
	`plan_id` text DEFAULT '2c9380848df1fd37018df77f1e5f0625'
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`user_id` text NOT NULL,
	`course_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coaching_items` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`coaching_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coachings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`price_usd` integer DEFAULT 0 NOT NULL,
	`plan_id` text,
	`description` text DEFAULT '' NOT NULL,
	`video_link` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `salas` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`img_url` text NOT NULL,
	`name` text NOT NULL,
	`coaching_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `salas_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`name` text NOT NULL,
	`link` text NOT NULL,
	`type` text NOT NULL,
	`sala_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `salas_temas` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`name` text NOT NULL,
	`sala_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coachingItems` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`price_usd` integer DEFAULT 0 NOT NULL,
	`public` integer DEFAULT false NOT NULL,
	`introductory_video` text,
	`beneficios` text DEFAULT '' NOT NULL,
	`descripcion` text DEFAULT '' NOT NULL,
	`duracion` text DEFAULT '' NOT NULL,
	`img_url` text,
	`exam_id` text,
	`mp_access_token` text,
	`slug` text NOT NULL,
	`slug_locked` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_unique` ON `courses` (`slug`);--> statement-breakpoint
CREATE TABLE `course_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`module_id` text NOT NULL,
	`module_number` integer DEFAULT 0 NOT NULL,
	`isFinished` integer DEFAULT false NOT NULL,
	`current_progress` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `ebook` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`price_usd` integer DEFAULT 0 NOT NULL,
	`img_url` text NOT NULL,
	`pdf_url` text NOT NULL,
	`card_color` text NOT NULL,
	`stats_values` text NOT NULL,
	`stats_names` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_ebook` (
	`id` integer PRIMARY KEY NOT NULL,
	`item_title` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`net_amount` integer NOT NULL,
	`payer_name` text,
	`payer_email` text
);
--> statement-breakpoint
CREATE TABLE `payment_on_users_ebooks` (
	`ebook_id` text NOT NULL,
	`user_id` text NOT NULL,
	`payment_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	PRIMARY KEY(`ebook_id`, `user_id`, `payment_id`)
);
--> statement-breakpoint
CREATE TABLE `email_broadcast` (
	`id` text PRIMARY KEY NOT NULL,
	`resend_broadcast_id` text,
	`cohort` text NOT NULL,
	`subject` text NOT NULL,
	`preview_text` text,
	`html` text NOT NULL,
	`recipient_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` integer,
	`sent_at` integer,
	`created_by` text NOT NULL,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `email_broadcast_status_idx` ON `email_broadcast` (`status`);--> statement-breakpoint
CREATE INDEX `email_broadcast_created_at_idx` ON `email_broadcast` (`created_at`);--> statement-breakpoint
CREATE TABLE `email_consent` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`source` text NOT NULL,
	`token_hash` text,
	`token_expires_at` integer,
	`confirmed_at` integer,
	`unsubscribed_at` integer,
	`consent_ip` text,
	`consent_user_agent` text,
	`resend_contact_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_consent_email_idx` ON `email_consent` (`email`);--> statement-breakpoint
CREATE INDEX `email_consent_user_idx` ON `email_consent` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_consent_status_idx` ON `email_consent` (`status`);--> statement-breakpoint
CREATE INDEX `email_consent_token_idx` ON `email_consent` (`token_hash`);--> statement-breakpoint
CREATE TABLE `frequently_asked_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`response` text NOT NULL,
	`course_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `xp_config` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`lesson_xp` integer DEFAULT 10 NOT NULL,
	`module_xp` integer DEFAULT 50 NOT NULL,
	`course_xp` integer DEFAULT 200 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `xp_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xp_ledger_award_idx` ON `xp_ledger` (`user_id`,`source`,`source_id`);--> statement-breakpoint
CREATE INDEX `xp_ledger_user_idx` ON `xp_ledger` (`user_id`);--> statement-breakpoint
CREATE INDEX `xp_ledger_user_course_idx` ON `xp_ledger` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `home_testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`user_name` text NOT NULL,
	`content` text NOT NULL,
	`user_img_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_program` (
	`payment_id` integer PRIMARY KEY NOT NULL,
	`item_title` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`net_amount` integer NOT NULL,
	`payer_name` text,
	`payer_email` text
);
--> statement-breakpoint
CREATE TABLE `payment_on_users_program` (
	`program_id` text NOT NULL,
	`user_id` text NOT NULL,
	`payment_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	PRIMARY KEY(`program_id`, `user_id`, `payment_id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`price_usd` integer DEFAULT 0 NOT NULL,
	`img_url` text NOT NULL,
	`pdf_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`mercadopago_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`paid_price` text,
	`active` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()),
	`updatedAt` integer DEFAULT (unixepoch()),
	`coaching_id` text
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`video_url` text NOT NULL,
	`semana_id` text NOT NULL,
	`Description` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `semanas` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`updatedAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `meeting` (
	`id` text PRIMARY KEY DEFAULT 'noID' NOT NULL,
	`link` text,
	`updatedAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`course_id` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `payment_schema` (
	`id` integer PRIMARY KEY NOT NULL,
	`item_title` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`net_amount` integer NOT NULL,
	`payer_name` text,
	`payer_email` text,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`rating` real NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `modules_items` (
	`id` text PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	` module_id` text NOT NULL,
	`pdf_url` text,
	`video_url` text,
	`mux_asset_id` text,
	`mux_playback_id` text,
	`questionary_id` text,
	`description` text,
	`transcription` text,
	`caption_source_language` text,
	`caption_detected_language` text,
	`caption_detected_confidence` real,
	`caption_targets` text,
	`description_attempts` integer DEFAULT 0 NOT NULL,
	`description_attempted_at` integer
);
--> statement-breakpoint
CREATE TABLE `video_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`module_item_id` text NOT NULL,
	`kind` text NOT NULL,
	`language_code` text NOT NULL,
	`status` text NOT NULL,
	`mux_track_id` text,
	`robots_job_id` text,
	`units_consumed` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_item_id`) REFERENCES `modules_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `video_tracks_item_language_idx` ON `video_tracks` (`module_item_id`,`kind`,`language_code`);--> statement-breakpoint
CREATE INDEX `video_tracks_item_idx` ON `video_tracks` (`module_item_id`);--> statement-breakpoint
CREATE INDEX `video_tracks_status_idx` ON `video_tracks` (`status`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`last_time_done` text
);
--> statement-breakpoint
CREATE TABLE `options` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`title` text NOT NULL,
	`isCorrect` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questionary` (
	`id` text PRIMARY KEY NOT NULL,
	`module_item_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text,
	`title` text NOT NULL,
	`questionary_id` text
);
--> statement-breakpoint
CREATE TABLE `usersToCourses` (
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	PRIMARY KEY(`user_id`, `course_id`)
);
--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`instagram` text NOT NULL,
	`qualities` text NOT NULL,
	`img_url` text NOT NULL,
	`course_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_log` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text,
	`user_id` text,
	`updated_at` integer DEFAULT (unixepoch()),
	`paid_amount` text,
	`amount_cents` integer,
	`product_id` text,
	`product_name` text,
	`payment_source` text,
	`currency` text DEFAULT 'ARS'
);
