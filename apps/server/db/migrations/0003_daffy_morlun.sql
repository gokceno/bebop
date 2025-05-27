PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_name` text,
	`originator` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
INSERT INTO `__new_events`("id", "event_name", "originator", "created_at") SELECT "id", "event_name", "originator", "created_at" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_events_params` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`param_name` text,
	`param_value` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
INSERT INTO `__new_events_params`("id", "event_id", "param_name", "param_value", "created_at") SELECT "id", "event_id", "param_name", "param_value", "created_at" FROM `events_params`;--> statement-breakpoint
DROP TABLE `events_params`;--> statement-breakpoint
ALTER TABLE `__new_events_params` RENAME TO `events_params`;--> statement-breakpoint
CREATE TABLE `__new_events_traces` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`trace_data` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
INSERT INTO `__new_events_traces`("id", "event_id", "trace_data", "created_at") SELECT "id", "event_id", "trace_data", "created_at" FROM `events_traces`;--> statement-breakpoint
DROP TABLE `events_traces`;--> statement-breakpoint
ALTER TABLE `__new_events_traces` RENAME TO `events_traces`;