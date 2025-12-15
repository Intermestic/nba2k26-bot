CREATE TABLE `failed_searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchTerm` varchar(255) NOT NULL,
	`attemptCount` int NOT NULL DEFAULT 1,
	`lastAttempted` timestamp NOT NULL DEFAULT (now()),
	`resolved` int NOT NULL DEFAULT 0,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failed_searches_id` PRIMARY KEY(`id`)
);
