CREATE TABLE `highlight_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`image` varchar(500) NOT NULL,
	`title` varchar(200) NOT NULL,
	`stat` varchar(100),
	`category` varchar(300),
	`link` varchar(500),
	`link_text` varchar(100),
	`display_location` enum('homepage','highlights','both') NOT NULL DEFAULT 'both',
	`card_type` enum('playoff','award','stat_leader','other') NOT NULL DEFAULT 'other',
	`priority` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `highlight_cards_id` PRIMARY KEY(`id`)
);
