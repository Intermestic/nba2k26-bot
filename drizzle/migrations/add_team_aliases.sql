CREATE TABLE IF NOT EXISTS `team_aliases` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `alias` varchar(100) NOT NULL UNIQUE,
  `canonicalName` varchar(100) NOT NULL,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default aliases
INSERT INTO `team_aliases` (`alias`, `canonicalName`) VALUES
  ('Cavs', 'Cavaliers'),
  ('cavs', 'Cavaliers'),
  ('Trailblazers', 'Trail Blazers'),
  ('trailblazers', 'Trail Blazers')
ON DUPLICATE KEY UPDATE `canonicalName` = VALUES(`canonicalName`);
