CREATE TABLE `match_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inputName` varchar(255) NOT NULL,
	`matchedName` varchar(255),
	`confidenceScore` int,
	`strategy` varchar(50),
	`context` varchar(100),
	`teamFilter` varchar(100),
	`success` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_logs_id` PRIMARY KEY(`id`)
);
