-- Add upgrade_log table
CREATE TABLE IF NOT EXISTS `upgrade_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`userName` varchar(255) NOT NULL,
	`date` varchar(20) NOT NULL,
	`sourceType` varchar(50) NOT NULL,
	`sourceDetail` text,
	`upgradeType` enum('Badge','Attribute') NOT NULL,
	`badgeOrAttribute` varchar(255) NOT NULL,
	`fromValue` varchar(50),
	`toValue` varchar(50) NOT NULL,
	`notes` text,
	`flagged` int NOT NULL DEFAULT 0,
	`flagReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_log_id` PRIMARY KEY(`id`)
);
