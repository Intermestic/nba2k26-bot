CREATE TABLE `scheduled_message_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`status` enum('success','failed','retrying') NOT NULL,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`errorMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduled_message_logs_id` PRIMARY KEY(`id`)
);
