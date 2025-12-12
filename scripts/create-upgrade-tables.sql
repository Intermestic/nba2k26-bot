-- Create upgrade rules table
CREATE TABLE IF NOT EXISTS upgrade_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upgradeType VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  ruleText TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create upgrade violations table
CREATE TABLE IF NOT EXISTS upgrade_violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upgradeLogId INT,
  playerId VARCHAR(64),
  playerName VARCHAR(255),
  upgradeType VARCHAR(100) NOT NULL,
  violationType VARCHAR(100) NOT NULL,
  ruleViolated TEXT NOT NULL,
  details TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  resolvedAt TIMESTAMP NULL,
  resolvedBy VARCHAR(255),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create upgrade audits table
CREATE TABLE IF NOT EXISTS upgrade_audits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auditType VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  totalChecked INT NOT NULL DEFAULT 0,
  violationsFound INT NOT NULL DEFAULT 0,
  startedAt TIMESTAMP NOT NULL,
  completedAt TIMESTAMP NULL,
  results TEXT,
  createdBy VARCHAR(255)
);
