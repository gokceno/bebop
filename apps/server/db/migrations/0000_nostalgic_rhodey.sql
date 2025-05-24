CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `events_params` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`param_name` text,
	`param_value` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `events_traces` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`trace_data` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
