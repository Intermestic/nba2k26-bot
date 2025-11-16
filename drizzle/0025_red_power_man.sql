CREATE TABLE `badge_abbreviations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`badgeName` varchar(100) NOT NULL,
	`abbreviation` varchar(10) NOT NULL,
	`description` text,
	`category` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badge_abbreviations_id` PRIMARY KEY(`id`),
	CONSTRAINT `badge_abbreviations_badgeName_unique` UNIQUE(`badgeName`),
	CONSTRAINT `badge_abbreviations_abbreviation_unique` UNIQUE(`abbreviation`)
);
--> statement-breakpoint
CREATE TABLE `badge_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(50) NOT NULL,
	`badgeName` varchar(100) NOT NULL,
	`attribute` varchar(100) NOT NULL,
	`bronzeMin` int,
	`silverMin` int,
	`goldMin` int,
	`minHeight` varchar(10),
	`maxHeight` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badge_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_upgrades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` varchar(64) NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`badgeName` varchar(100) NOT NULL,
	`fromLevel` enum('none','bronze','silver','gold') NOT NULL,
	`toLevel` enum('bronze','silver','gold') NOT NULL,
	`upgradeType` enum('badge_level','new_badge','attribute') NOT NULL,
	`gameNumber` int,
	`requestId` int,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_upgrades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upgrade_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` varchar(64),
	`playerName` varchar(255) NOT NULL,
	`badgeName` varchar(100) NOT NULL,
	`fromLevel` enum('none','bronze','silver','gold') NOT NULL,
	`toLevel` enum('bronze','silver','gold') NOT NULL,
	`attributes` text,
	`requestedBy` varchar(64) NOT NULL,
	`requestedByName` varchar(255),
	`team` varchar(100) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`messageId` varchar(64) NOT NULL,
	`status` enum('pending','approved','rejected','forwarded') NOT NULL DEFAULT 'pending',
	`validationErrors` text,
	`ruleViolations` text,
	`approvedBy` varchar(64),
	`approvedAt` timestamp,
	`forwardedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_requests_id` PRIMARY KEY(`id`)
);
