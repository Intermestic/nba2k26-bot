/**
 * Upgrade Parser - Parses upgrade request messages from team channels
 * 
 * Supported formats:
 * - "PlayerName +1 BADGE to Tier (attribute1 value1, attribute2 value2)"
 * - "PlayerName +1 BADGE to Tier (attribute1 value1) 5GM"
 * - Multiple upgrades in one message (separated by newlines)
 * 
 * Examples:
 * - "Suggs +1 SS to Bronze (83 3pt)"
 * - "Suggs +1 CHL to Bronze (88 pd, 79 agl) 5GM"
 * - "Jaden Hardy +1 LIM to Gold (90 3pt)"
 */

export interface ParsedUpgrade {
  playerName: string;
  badgeName: string;
  fromLevel: "none" | "bronze" | "silver" | "gold";
  toLevel: "bronze" | "silver" | "gold";
  attributes?: Record<string, number>; // e.g., { "3pt": 83, "pd": 88 }
  gameNumber?: number; // e.g., 5 from "5GM"
}

/**
 * Parse upgrade requests from a message
 * Returns array of parsed upgrades (supports multiple upgrades per message)
 */
export async function parseUpgradeRequests(text: string): Promise<ParsedUpgrade[]> {
  const upgrades: ParsedUpgrade[] = [];
  
  // Split by newlines to handle multiple upgrades
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of lines) {
    const parsed = parseUpgradeLine(line);
    if (parsed) {
      upgrades.push(parsed);
    }
  }
  
  return upgrades;
}

/**
 * Parse a single upgrade line
 * Format: "PlayerName +1 BADGE to Tier (attributes) [GM]"
 */
function parseUpgradeLine(line: string): ParsedUpgrade | null {
  // Pattern: PlayerName +1 BADGE to Tier (attributes) [optional GM]
  // Example: "Suggs +1 SS to Bronze (83 3pt) 5GM"
  const pattern = /^(.+?)\s+\+1\s+([A-Z]{2,10})\s+to\s+(Bronze|Silver|Gold)\s*(?:\(([^)]+)\))?\s*(?:(\d+)GM)?/i;
  
  const match = line.match(pattern);
  if (!match) return null;
  
  const [, playerName, badgeName, toLevel, attributesStr, gameNumberStr] = match;
  
  // Parse attributes if present
  let attributes: Record<string, number> | undefined;
  if (attributesStr) {
    attributes = parseAttributes(attributesStr);
  }
  
  // Parse game number if present
  const gameNumber = gameNumberStr ? parseInt(gameNumberStr) : undefined;
  
  // Determine fromLevel based on toLevel
  const fromLevel = determineFromLevel(toLevel.toLowerCase() as "bronze" | "silver" | "gold");
  
  return {
    playerName: playerName.trim(),
    badgeName: badgeName.toUpperCase(),
    fromLevel,
    toLevel: toLevel.toLowerCase() as "bronze" | "silver" | "gold",
    attributes,
    gameNumber,
  };
}

/**
 * Parse attribute string into key-value pairs
 * Examples:
 * - "83 3pt" -> { "3pt": 83 }
 * - "88 pd, 79 agl" -> { "pd": 88, "agl": 79 }
 * - "90 3pt, 88 mid" -> { "3pt": 90, "mid": 88 }
 */
function parseAttributes(attributesStr: string): Record<string, number> {
  const attributes: Record<string, number> = {};
  
  // Split by comma or semicolon
  const parts = attributesStr.split(/[,;]/).map(p => p.trim());
  
  for (const part of parts) {
    // Pattern: "value attribute" or "attribute value"
    const match = part.match(/(\d+)\s+([a-z0-9]+)|([a-z0-9]+)\s+(\d+)/i);
    if (match) {
      const value = parseInt(match[1] || match[4]);
      const attr = (match[2] || match[3]).toLowerCase();
      attributes[attr] = value;
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
