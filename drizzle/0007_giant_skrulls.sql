CREATE TABLE `discord_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookUrl` text NOT NULL,
	`messageId` varchar(64),
	`websiteUrl` text NOT NULL,
	`autoUpdateEnabled` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discord_config_id` PRIMARY KEY(`id`)
);
