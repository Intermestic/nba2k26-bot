/**
 * Upgrade Parser - Parses upgrade request messages from team channels
 * 
 * Supported formats:
 * 1. Badge upgrades: "+1 BADGE to Tier (attributes)" or "+1 BADGE (attributes)"
 * 2. Attribute stat increases: "+X stat to value"
 * 3. Structured messages with headers and bullet points
 * 
 * Examples:
 * - "Suggs +1 SS (83 3pt)"
 * - "Suggs +1 CHL to bronze (88 pd 79 agl)"
 * - "Kat +3 Mid to 72"
 * - "Brooks +1 SS (90+ mid)"
 * 
 * Structured format:
 * **Welcomes**
 * - Suggs
 * +1 SS (83 3pt)
 * +1 PTZ (84 dunk 94 vert)
 * - Giddey
 * +1 CHL to bronze (88 pd 79 agl)
 */

export interface ParsedUpgrade {
  playerName: string;
  upgradeType: "badge" | "stat";
  
  // Badge upgrade fields
  badgeName?: string;
  fromLevel?: "none" | "bronze" | "silver" | "gold";
  toLevel?: "bronze" | "silver" | "gold";
  attributes?: Record<string, number>; // e.g., { "3pt": 83, "pd": 88 }
  
  // Stat upgrade fields
  statName?: string;
  statIncrease?: number;
  newStatValue?: number;
  
  gameNumber?: number; // e.g., 5 from "5GM" or "Game 5"
}

/**
 * Parse upgrade requests from a message
 * Returns array of parsed upgrades (supports multiple players and upgrades)
 */
export async function parseUpgradeRequests(text: string): Promise<ParsedUpgrade[]> {
  const upgrades: ParsedUpgrade[] = [];
  
  // Split by newlines
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentPlayer: string | null = null;
  let currentGameNumber: number | undefined = undefined;
  
  for (const line of lines) {
    // Skip headers (lines starting with ** or containing only **text**)
    if (line.startsWith('**') || /^\*\*[^*]+\*\*$/.test(line)) {
      // Check if header contains game number (e.g., "**Game 5**")
      const gameMatch = line.match(/Game\s+(\d+)/i);
      if (gameMatch) {
        currentGameNumber = parseInt(gameMatch[1]);
      }
      continue;
    }
    
    // Check if line is a player name (starts with - or bullet point)
    if (line.startsWith('-') || line.startsWith('•')) {
      currentPlayer = line.replace(/^[-•]\s*/, '').trim();
      continue;
    }
    
    // Try to parse as upgrade line
    const parsed = parseUpgradeLine(line, currentPlayer, currentGameNumber);
    if (parsed) {
      upgrades.push(parsed);
    }
  }
  
  return upgrades;
}

/**
 * Parse a single upgrade line
 * Supports both badge upgrades and stat increases
 */
function parseUpgradeLine(line: string, contextPlayer: string | null, contextGameNumber?: number): ParsedUpgrade | null {
  // Try badge upgrade first
  const badgeUpgrade = parseBadgeUpgrade(line, contextPlayer, contextGameNumber);
  if (badgeUpgrade) return badgeUpgrade;
  
  // Try stat increase
  const statUpgrade = parseStatIncrease(line, contextPlayer, contextGameNumber);
  if (statUpgrade) return statUpgrade;
  
  return null;
}

/**
 * Parse badge upgrade line
 * Formats:
 * - "PlayerName +1 BADGE to Tier (attributes)"
 * - "PlayerName +1 BADGE (attributes)"
 * - "+1 BADGE to Tier (attributes)" (uses context player)
 * - "+1 BADGE (attributes)" (uses context player)
 */
function parseBadgeUpgrade(line: string, contextPlayer: string | null, contextGameNumber?: number): ParsedUpgrade | null {
  // Pattern 1: PlayerName +1 BADGE to Tier (attributes) [GM]
  let pattern = /^(.+?)\s+\+1\s+([A-Z]{2,10})\s+to\s+(Bronze|Silver|Gold)\s*(?:\(([^)]+)\))?\s*(?:(\d+)GM)?/i;
  let match = line.match(pattern);
  
  if (!match) {
    // Pattern 2: PlayerName +1 BADGE (attributes) [GM]
    pattern = /^(.+?)\s+\+1\s+([A-Z]{2,10})\s*(?:\(([^)]+)\))?\s*(?:(\d+)GM)?/i;
    match = line.match(pattern);
    
    if (!match) {
      // Pattern 3: +1 BADGE to Tier (attributes) [GM] (no player name, use context)
      pattern = /^\+1\s+([A-Z]{2,10})\s+to\s+(Bronze|Silver|Gold)\s*(?:\(([^)]+)\))?\s*(?:(\d+)GM)?/i;
      match = line.match(pattern);
      
      if (match && contextPlayer) {
        const [, badgeName, toLevel, attributesStr, gameNumberStr] = match;
        return buildBadgeUpgrade(contextPlayer, badgeName, toLevel, attributesStr, gameNumberStr, contextGameNumber);
      }
      
      // Pattern 4: +1 BADGE (attributes) [GM] (no player name, no tier, use context)
      pattern = /^\+1\s+([A-Z]{2,10})\s*(?:\(([^)]+)\))?\s*(?:(\d+)GM)?/i;
      match = line.match(pattern);
      
      if (match && contextPlayer) {
        const [, badgeName, attributesStr, gameNumberStr] = match;
        return buildBadgeUpgrade(contextPlayer, badgeName, undefined, attributesStr, gameNumberStr, contextGameNumber);
      }
      
      return null;
    }
    
    // Pattern 2 matched
    const [, playerName, badgeName, attributesStr, gameNumberStr] = match;
    return buildBadgeUpgrade(playerName, badgeName, undefined, attributesStr, gameNumberStr, contextGameNumber);
  }
  
  // Pattern 1 matched
  const [, playerName, badgeName, toLevel, attributesStr, gameNumberStr] = match;
  return buildBadgeUpgrade(playerName, badgeName, toLevel, attributesStr, gameNumberStr, contextGameNumber);
}

/**
 * Build badge upgrade object from parsed components
 */
function buildBadgeUpgrade(
  playerName: string,
  badgeName: string,
  toLevel: string | undefined,
  attributesStr: string | undefined,
  gameNumberStr: string | undefined,
  contextGameNumber?: number
): ParsedUpgrade {
  // Parse attributes if present
  let attributes: Record<string, number> | undefined;
  if (attributesStr) {
    attributes = parseAttributes(attributesStr);
  }
  
  // Parse game number
  const gameNumber = gameNumberStr ? parseInt(gameNumberStr) : contextGameNumber;
  
  // Determine levels
  const toLevelNormalized = toLevel?.toLowerCase() as "bronze" | "silver" | "gold" | undefined;
  const fromLevel = toLevelNormalized ? determineFromLevel(toLevelNormalized) : undefined;
  
  return {
    playerName: playerName.trim(),
    upgradeType: "badge",
    badgeName: badgeName.toUpperCase(),
    fromLevel,
    toLevel: toLevelNormalized,
    attributes,
    gameNumber,
  };
}

/**
 * Parse stat increase line
 * Formats:
 * - "PlayerName +X stat to value"
 * - "+X stat to value" (uses context player)
 * 
 * Examples:
 * - "Kat +3 Mid to 72"
 * - "+2 3pt to 86"
 * - "+3 ft to 76"
 */
function parseStatIncrease(line: string, contextPlayer: string | null, contextGameNumber?: number): ParsedUpgrade | null {
  // Pattern 1: PlayerName +X stat to value
  let pattern = /^(.+?)\s+\+(\d+)\s+([a-z0-9]+)\s+to\s+(\d+)/i;
  let match = line.match(pattern);
  
  if (match) {
    const [, playerName, increase, statName, newValue] = match;
    return {
      playerName: playerName.trim(),
      upgradeType: "stat",
      statName: statName.toLowerCase(),
      statIncrease: parseInt(increase),
      newStatValue: parseInt(newValue),
      gameNumber: contextGameNumber,
    };
  }
  
  // Pattern 2: +X stat to value (use context player)
  pattern = /^\+(\d+)\s+([a-z0-9]+)\s+to\s+(\d+)/i;
  match = line.match(pattern);
  
  if (match && contextPlayer) {
    const [, increase, statName, newValue] = match;
    return {
      playerName: contextPlayer,
      upgradeType: "stat",
      statName: statName.toLowerCase(),
      statIncrease: parseInt(increase),
      newStatValue: parseInt(newValue),
      gameNumber: contextGameNumber,
    };
  }
  
  return null;
}

/**
 * Parse attribute string into key-value pairs
 * Examples:
 * - "83 3pt" -> { "3pt": 83 }
 * - "88 pd 79 agl" -> { "pd": 88, "agl": 79 }
 * - "90+ mid" -> { "mid": 90 }
 * - "84 dunk 94 vert" -> { "dunk": 84, "vert": 94 }
 */
function parseAttributes(attributesStr: string): Record<string, number> {
  const attributes: Record<string, number> = {};
  
  // Remove commas and split by whitespace
  const parts = attributesStr.replace(/,/g, ' ').split(/\s+/).filter(p => p.length > 0);
  
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    
    // Check if it's a number (possibly with +)
    const valueMatch = part.match(/^(\d+)\+?$/);
    if (valueMatch && i + 1 < parts.length) {
      const value = parseInt(valueMatch[1]);
      const attr = parts[i + 1].toLowerCase();
      attributes[attr] = value;
      i += 2;
    } else {
      i++;
    }
  }
  
  return attributes;
}

/**
 * Determine the "from" level based on the "to" level
 * Bronze = from none
 * Silver = from bronze
 * Gold = from silver
 */
function determineFromLevel(toLevel: "bronze" | "silver" | "gold"): "none" | "bronze" | "silver" | "gold" {
  switch (toLevel) {
    case "bronze":
      return "none";
    case "silver":
      return "bronze";
    case "gold":
      return "silver";
  }
}
