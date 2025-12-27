CREATE TABLE `fa_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team` varchar(100) NOT NULL,
	`dropPlayer` varchar(255) NOT NULL,
	`signPlayer` varchar(255) NOT NULL,
	`signPlayerOvr` int,
	`bidAmount` int NOT NULL,
	`adminUser` varchar(255),
	`coinsRemaining` int NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fa_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_coins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team` varchar(100) NOT NULL,
	`coinsRemaining` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_coins_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_coins_team_unique` UNIQUE(`team`)
);
