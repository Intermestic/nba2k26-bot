-- Activity conflicts table for flagging suspicious game results
CREATE TABLE IF NOT EXISTS activity_conflicts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  team1 VARCHAR(100) NOT NULL,
  team2 VARCHAR(100) NOT NULL,
  conflict_type VARCHAR(50) NOT NULL, -- 'double_win', 'double_loss', 'score_mismatch'
  team1_result VARCHAR(10), -- 'W' or 'L'
  team2_result VARCHAR(10), -- 'W' or 'L'
  team1_message_id VARCHAR(255),
  team2_message_id VARCHAR(255),
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP NULL,
  resolved_by VARCHAR(255),
  notes TEXT,
  INDEX idx_teams (team1, team2),
  INDEX idx_resolved (resolved),
  INDEX idx_detected_at (detected_at)
);
