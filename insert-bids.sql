-- Get the current PM window ID first
SET @windowId = (SELECT windowId FROM bid_windows WHERE windowId LIKE '%-PM' ORDER BY startTime DESC LIMIT 1);

-- Insert manual bids
INSERT INTO fa_bids (windowId, team, playerName, bidAmount, dropPlayer, discordUserId, discordUsername, status, createdAt) VALUES
(@windowId, 'Hawks', 'Dayron Sharpe', 1, 'Terrance Mann', 'hawks_user', 'hawks', 'pending', '2025-01-15 11:49:00'),
(@windowId, 'Rockets', 'Day''Ron Sharpe', 25, 'Hunter Dickinson', 'rockets_user', 'rockets', 'pending', '2025-01-15 11:58:00'),
(@windowId, 'Nuggets', 'Bruce Brown', 1, 'Kenrich Williams', 'nuggets_user', 'nuggets', 'pending', '2025-01-15 11:58:00'),
(@windowId, 'Nuggets', 'Chris Paul', 1, 'Leonard Miller', 'nuggets_user', 'nuggets', 'pending', '2025-01-15 11:59:00'),
(@windowId, 'Raptors', 'Bruce Brown', 6, 'Dean Wade', 'raptors_user', 'raptors', 'pending', '2025-01-15 13:20:00'),
(@windowId, 'Raptors', 'Dayron Sharpe', 29, 'Alex Len', 'raptors_user', 'raptors', 'pending', '2025-01-15 15:34:00'),
(@windowId, 'Rockets', 'Day''Ron Sharpe', 35, 'Hunter Dickinson', 'rockets_user', 'rockets', 'pending', '2025-01-15 15:48:00'),
(@windowId, 'Raptors', 'Johnathan Mogbo', 3, 'Dario Saric', 'raptors_user', 'raptors', 'pending', '2025-01-15 16:25:00'),
(@windowId, 'Raptors', 'Bruce Brown', 6, 'Dean Wade', 'raptors_user', 'raptors', 'pending', '2025-01-15 16:26:00'),
(@windowId, 'Hornets', 'Patrick Williams', 1, 'Kyle Lowry', 'hornets_user', 'hornets', 'pending', '2025-01-15 17:17:00'),
(@windowId, 'Hornets', 'Daniel Theis', 1, 'Caleb Martin', 'hornets_user', 'hornets', 'pending', '2025-01-15 18:35:00');

SELECT 'Bids inserted successfully!' as message;
