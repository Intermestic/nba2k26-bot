CREATE TABLE `transaction_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` varchar(64) NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`fromTeam` varchar(100),
	`toTeam` varchar(100) NOT NULL,
	`adminId` int,
	`adminName` varchar(255),
	`transactionType` enum('trade','signing','release','update') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_history_id` PRIMARY KEY(`id`)
);
