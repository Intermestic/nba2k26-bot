CREATE TABLE `team_role_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discordUserId` varchar(64) NOT NULL,
	`discordUsername` varchar(255) NOT NULL,
	`teamName` varchar(100) NOT NULL,
	`action` enum('added','removed') NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_role_changes_id` PRIMARY KEY(`id`)
);
