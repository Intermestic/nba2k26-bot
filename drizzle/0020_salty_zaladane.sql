CREATE TABLE `bot_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`command` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`responseTemplate` text,
	`permissions` varchar(50),
	`category` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `bot_commands_id` PRIMARY KEY(`id`),
	CONSTRAINT `bot_commands_command_unique` UNIQUE(`command`)
);
--> statement-breakpoint
CREATE TABLE `bot_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`category` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `bot_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `bot_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`description` text,
	`category` varchar(50),
	`variables` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `message_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_templates_key_unique` UNIQUE(`key`)
);
