CREATE TABLE `player_swaps` (
  `id` int AUTO_INCREMENT NOT NULL,
  `playerId` varchar(64),
  `oldPlayerName` varchar(255) NOT NULL,
  `newPlayerName` varchar(255) NOT NULL,
  `team` varchar(100),
  `swapType` enum('dna_swap','player_replacement','other') NOT NULL,
  `swapDate` varchar(20) NOT NULL,
  `oldPlayerOvr` int,
  `newPlayerOvr` int,
  `notes` text,
  `flagged` int NOT NULL DEFAULT 0,
  `flagReason` text,
  `addedBy` int,
  `addedByName` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `player_swaps_id` PRIMARY KEY(`id`)
);
