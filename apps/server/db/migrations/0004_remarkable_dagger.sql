CREATE TABLE `events_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`claim_name` text,
	`claim_value` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `originator`;