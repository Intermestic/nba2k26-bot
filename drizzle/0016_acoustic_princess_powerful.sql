CREATE TABLE `team_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discordUserId` varchar(64) NOT NULL,
	`discordUsername` varchar(255),
	`team` varchar(100) NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_assignments_discordUserId_unique` UNIQUE(`discordUserId`)
);
