CREATE TABLE `bid_windows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`windowId` varchar(64) NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`status` enum('active','locked','closed') NOT NULL DEFAULT 'active',
	`statusMessageId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bid_windows_id` PRIMARY KEY(`id`),
	CONSTRAINT `bid_windows_windowId_unique` UNIQUE(`windowId`)
);
--> statement-breakpoint
CREATE TABLE `fa_bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` varchar(64),
	`playerName` varchar(255) NOT NULL,
	`bidderDiscordId` varchar(64) NOT NULL,
	`bidderName` varchar(255),
	`team` varchar(100) NOT NULL,
	`bidAmount` int NOT NULL,
	`windowId` varchar(64) NOT NULL,
	`messageId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fa_bids_id` PRIMARY KEY(`id`)
);
