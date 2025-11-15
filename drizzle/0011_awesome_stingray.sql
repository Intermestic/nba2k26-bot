CREATE TABLE `cap_violations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team` varchar(100) NOT NULL,
	`totalOverall` int NOT NULL,
	`overCap` int NOT NULL,
	`playerCount` int NOT NULL,
	`alertSent` int NOT NULL DEFAULT 1,
	`resolved` int NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cap_violations_id` PRIMARY KEY(`id`)
);
