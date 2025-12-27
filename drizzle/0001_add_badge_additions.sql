CREATE TABLE IF NOT EXISTS `badge_additions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `playerId` varchar(64) NOT NULL,
  `playerName` varchar(255) NOT NULL,
  `badgeName` varchar(100) NOT NULL,
  `addedAt` timestamp NOT NULL DEFAULT (now()),
  `upgradeId` int,
  `metadata` text,
  PRIMARY KEY (`id`)
);
