CREATE TABLE `upgrade_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`upgrades` json NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `upgrade_templates_name_unique` UNIQUE(`name`)
);
