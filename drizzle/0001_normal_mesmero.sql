CREATE TABLE `players` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`overall` int NOT NULL,
	`photoUrl` text,
	`playerPageUrl` text,
	`nbaId` varchar(64),
	`source` varchar(64),
	`badgeCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
