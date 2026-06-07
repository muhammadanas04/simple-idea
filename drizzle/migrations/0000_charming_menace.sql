CREATE TABLE `features` (
	`id` text PRIMARY KEY NOT NULL,
	`idea_id` text NOT NULL,
	`description` text NOT NULL,
	`added_by` text NOT NULL,
	`avg_rating` real DEFAULT 0 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`proposed_by` text NOT NULL,
	`self_rating` integer NOT NULL,
	`avg_rating` real DEFAULT 0 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`idea_id` text NOT NULL,
	`rated_by` text NOT NULL,
	`score` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_rating_idx` ON `ratings` (`target_type`,`target_id`,`rated_by`);--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`idea_id` text NOT NULL,
	`content` text NOT NULL,
	`suggested_by` text NOT NULL,
	`avg_rating` real DEFAULT 0 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE cascade
);
