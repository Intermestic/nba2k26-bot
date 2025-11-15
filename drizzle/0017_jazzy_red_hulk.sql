CREATE TABLE `team_assignment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`discordUserId` varchar(64) NOT NULL,
	`previousTeam` varchar(100),
	`newTeam` varchar(100) NOT NULL,
	`changedBy` int,
	`changedByDiscordId` varchar(64),
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`reason` text,
	CONSTRAINT `team_assignment_history_id` PRIMARY KEY(`id`)
);
