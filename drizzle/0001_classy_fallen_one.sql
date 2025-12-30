CREATE TABLE `downloadHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`files` int DEFAULT 1,
	`size` varchar(50),
	`folder` varchar(255),
	`duration` int,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`source` enum('magnet','torrent-file') DEFAULT 'magnet',
	CONSTRAINT `downloadHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(500) NOT NULL,
	`size` bigint,
	`name` varchar(255) NOT NULL,
	`titleId` varchar(50),
	`version` int DEFAULT 0,
	`filename` varchar(255),
	`path` varchar(500),
	`indexedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `gameCache_path_unique` UNIQUE(`path`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tinfoilUser` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `tinfoilPass` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isApproved` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_tinfoilUser_unique` UNIQUE(`tinfoilUser`);