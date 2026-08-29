CREATE TABLE `balls` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`innings` integer DEFAULT 1 NOT NULL,
	`over_number` integer NOT NULL,
	`ball_number` integer NOT NULL,
	`runs` integer DEFAULT 0 NOT NULL,
	`extras` integer DEFAULT 0 NOT NULL,
	`extra_type` text,
	`is_wicket` integer DEFAULT false,
	`wicket_type` text,
	`is_undone` integer DEFAULT false,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `finances` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`category` text DEFAULT 'OTHER',
	`tournament_id` text,
	`date` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`match_type` text DEFAULT 'NORMAL' NOT NULL,
	`tournament_id` text,
	`match_number` integer,
	`total_overs` integer DEFAULT 10 NOT NULL,
	`stage` text DEFAULT '',
	`team1_id` text NOT NULL,
	`team2_id` text NOT NULL,
	`toss_winner_id` text,
	`toss_decision` text,
	`batting_first_id` text,
	`match_date` text DEFAULT '',
	`match_time` text DEFAULT '',
	`match_venue` text DEFAULT '',
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`current_innings` integer DEFAULT 1,
	`winner_id` text,
	`result_desc` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`team1_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team2_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toss_winner_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batting_first_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`is_important` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`team_id` text,
	`role` text DEFAULT 'BATSMAN' NOT NULL,
	`matches` integer DEFAULT 0,
	`runs` integer DEFAULT 0,
	`wickets` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`initials` text DEFAULT '' NOT NULL,
	`logo` text DEFAULT '',
	`location` text DEFAULT '',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tournament_teams` (
	`tournament_id` text NOT NULL,
	`team_id` text NOT NULL,
	PRIMARY KEY(`tournament_id`, `team_id`),
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` text DEFAULT '',
	`venue` text DEFAULT '',
	`type` text DEFAULT 'SHORT' NOT NULL,
	`champions_prize` integer DEFAULT 0 NOT NULL,
	`runners_up_prize` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'UPCOMING' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
