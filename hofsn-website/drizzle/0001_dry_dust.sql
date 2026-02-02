CREATE TABLE `playoff_games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`season` varchar(10) NOT NULL,
	`round` enum('first','second','conference_finals','finals') NOT NULL,
	`matchup_id` varchar(50) NOT NULL,
	`game_number` int NOT NULL,
	`home_team` varchar(100) NOT NULL,
	`away_team` varchar(100) NOT NULL,
	`home_score` int,
	`away_score` int,
	`winner` varchar(100),
	`played_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playoff_games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playoff_series` (
	`id` int AUTO_INCREMENT NOT NULL,
	`season` varchar(10) NOT NULL,
	`round` enum('first','second','conference_finals','finals') NOT NULL,
	`matchup_id` varchar(50) NOT NULL,
	`seed1` int NOT NULL,
	`team1` varchar(100) NOT NULL,
	`seed2` int NOT NULL,
	`team2` varchar(100) NOT NULL,
	`team1_wins` int NOT NULL DEFAULT 0,
	`team2_wins` int NOT NULL DEFAULT 0,
	`series_winner` varchar(100),
	`is_complete` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playoff_series_id` PRIMARY KEY(`id`),
	CONSTRAINT `playoff_series_matchup_id_unique` UNIQUE(`matchup_id`)
);
