ALTER TABLE `fa_transactions` ADD `batchId` varchar(255);--> statement-breakpoint
ALTER TABLE `fa_transactions` ADD `rolledBack` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `fa_transactions` ADD `rolledBackAt` timestamp;--> statement-breakpoint
ALTER TABLE `fa_transactions` ADD `rolledBackBy` varchar(255);--> statement-breakpoint
ALTER TABLE `fa_transactions` ADD `previousTeam` varchar(100);