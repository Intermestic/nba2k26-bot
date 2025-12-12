CREATE TABLE `player_aliases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` varchar(64) NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`alias` varchar(255) NOT NULL,
	`matchCount` int NOT NULL DEFAULT 0,
	`addedBy` int,
	`addedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_aliases_id` PRIMARY KEY(`id`)
);
