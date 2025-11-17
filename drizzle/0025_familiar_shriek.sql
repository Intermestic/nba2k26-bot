CREATE TABLE `badge_abbreviations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`abbreviation` varchar(10) NOT NULL,
	`fullName` varchar(100) NOT NULL,
	`category` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `badge_abbreviations_id` PRIMARY KEY(`id`),
	CONSTRAINT `badge_abbreviations_abbreviation_unique` UNIQUE(`abbreviation`)
);
--> statement-breakpoint
CREATE TABLE `badge_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`badgeName` varchar(100) NOT NULL,
	`tier` enum('bronze','silver','gold') NOT NULL,
	`attribute1` varchar(50),
	`threshold1` int,
	`attribute2` varchar(50),
	`threshold2` int,
	`attribute3` varchar(50),
	`threshold3` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
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
	`gameNumber` int,
	`requestedBy` varchar(64) NOT NULL,
	`requestedByName` varchar(255),
	`team` varchar(100) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`messageId` varchar(64) NOT NULL,
	`status` enum('pending','approved','rejected','forwarded') NOT NULL DEFAULT 'pending',
	`approvedBy` varchar(64),
	`approvedAt` timestamp,
	`validationErrors` text,
	`ruleViolations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleName` varchar(100) NOT NULL,
	`ruleType` enum('game_requirement','attribute_check','badge_limit','cooldown') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`config` text NOT NULL,
	`errorMessage` text,
	`severity` enum('error','warning') NOT NULL DEFAULT 'error',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `validation_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `validation_rules_ruleName_unique` UNIQUE(`ruleName`)
);
