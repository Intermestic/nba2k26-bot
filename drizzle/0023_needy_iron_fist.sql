ALTER TABLE `players` ADD `height` varchar(10);--> statement-breakpoint
ALTER TABLE `players` ADD `isRookie` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `draftYear` int;