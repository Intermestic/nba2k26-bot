CREATE TABLE `validation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleKey` varchar(100) NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`description` text,
	`ruleType` enum('boolean','numeric','text') NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`numericValue` int,
	`textValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `validation_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `validation_rules_ruleKey_unique` UNIQUE(`ruleKey`)
);
