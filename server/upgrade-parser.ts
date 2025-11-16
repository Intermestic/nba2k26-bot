import { getDb } from './db';
import { badgeAbbreviations, badgeRequirements } from '../drizzle/schema';
import { findPlayerByFuzzyName } from './trade-parser';

/**
 * Parsed upgrade request structure
 */
export interface ParsedUpgrade {
  gameNumber?: number; // e.g., 5 from "5gm upgrade"
  playerName: string;
  badgeName: string; // Full badge name (resolved from abbreviation)
  badgeAbbreviation?: string; // Original abbreviation if used
  fromLevel: 'none' | 'bronze' | 'silver' | 'gold';
  toLevel: 'bronze' | 'silver' | 'gold';
  attributes?: Record<string, number>; // Provided attribute values
}

/**
 * Parse upgrade request message - now handles multiple players and upgrades
 * 
 * Supported formats:
 * - Single player: "5gm upgrade: Suggs SS +1 to silver"
 * - Multiple players:
 *   ```
 *   Suggs
 *   +1 SS (83 3pt)
 *   +1 PTZ (84 dunk)
 *   
 *   Giddey
 *   +1 CHL to bronze (88 pd)
 *   ```
 */
export async function parseUpgradeRequests(message: string): Promise<ParsedUpgrade[]> {
  const upgrades: ParsedUpgrade[] = [];
  
  console.log('[Upgrade Parser] Input:', message);
  
  // Extract game number if present at the start (e.g., "5gm", "Game 5")
  const gameMatch = message.match(/(?:^|\n)(?:game\s+)?(\d+)\s*gm/i);
  const globalGameNumber = gameMatch ? parseInt(gameMatch[1]) : undefined;
  
  const db = await getDb();
  if (!db) return [];
  
  // Get all badge abbreviations for matching
  const badges = await db.select().from(badgeAbbreviations);
  
  // Split message by double line breaks or player name patterns
  // Player names are typically on their own line before upgrades
  const lines = message.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentPlayer: string | null = null;
  let currentGameNumber = globalGameNumber;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Skip header lines
    if (lineLower.includes('welcome') || lineLower.includes('upgrade') && !lineLower.match(/\+\d/)) {
      continue;
    }
    
    // Check if line contains a game number
    const lineGameMatch = line.match(/(?:game\s+)?(\d+)\s*gm/i);
    if (lineGameMatch) {
      currentGameNumber = parseInt(lineGameMatch[1]);
      // Remove game number from line for further processing
      const cleanLine = line.replace(/(?:game\s+)?(\d+)\s*gm/i, '').trim();
      if (cleanLine.length === 0) continue;
    }
    
    // Check if this line is an upgrade (+1, +2, +3 pattern) or contains a badge
    const isUpgradeLine = lineLower.match(/^\+\d/) || badges.some(b => 
      lineLower.includes(b.abbreviation.toLowerCase()) || 
      lineLower.includes(b.badgeName.toLowerCase())
    );
    
    if (!isUpgradeLine) {
      // This is likely a player name
      currentPlayer = line.trim();
      console.log('[Upgrade Parser] Found player:', currentPlayer);
      continue;
    }
    
    // Parse this upgrade line
    if (currentPlayer) {
      const parsed = await parseSingleUpgrade(lineLower, currentPlayer, currentGameNumber, badges);
      if (parsed) {
        upgrades.push(parsed);
        console.log('[Upgrade Parser] Parsed upgrade:', parsed);
      }
    }
  }
  
  console.log(`[Upgrade Parser] Total upgrades parsed: ${upgrades.length}`);
  return upgrades;
}

/**
 * Parse a single upgrade line for a known player
 */
async function parseSingleUpgrade(
  line: string,
  playerName: string,
  gameNumber: number | undefined,
  badges: Array<{ badgeName: string; abbreviation: string }>
): Promise<ParsedUpgrade | null> {
  // Try to find badge in the line (case-insensitive)
  let matchedBadge: typeof badges[0] | null = null;
  let badgePosition = -1;
  
  // First try abbreviations (shorter, more specific)
  for (const badge of badges) {
    const abbrevLower = badge.abbreviation.toLowerCase();
    const pos = line.indexOf(abbrevLower);
    if (pos !== -1) {
      matchedBadge = badge;
      badgePosition = pos;
      break;
    }
  }
  
  // If no abbreviation match, try full names
  if (!matchedBadge) {
    for (const badge of badges) {
      const nameLower = badge.badgeName.toLowerCase();
      const pos = line.indexOf(nameLower);
      if (pos !== -1) {
        matchedBadge = badge;
        badgePosition = pos;
        break;
      }
    }
  }
  
  if (!matchedBadge) {
    console.log('[Upgrade Parser] No badge found in line:', line);
    return null;
  }
  
  // Extract level change (e.g., "+1 to silver", "bronze to silver", "to bronze")
  const levelMatch = line.match(/(none|bronze|silver|gold)?\s*(?:\+\d+|\->|to)\s*(bronze|silver|gold)/i);
  
  if (!levelMatch) {
    console.log('[Upgrade Parser] No level change found in line:', line);
    return null;
  }
  
  const fromLevel = (levelMatch[1] || 'none') as 'none' | 'bronze' | 'silver' | 'gold';
  const toLevel = levelMatch[2] as 'bronze' | 'silver' | 'gold';
  
  // Extract attributes if provided (e.g., "(88 pd 79 agl)" or "midrange 87, 3pt 91")
  const attributes: Record<string, number> = {};
  
  // Common attribute patterns
  const attrPatterns = [
    /(?:mid-?range|midrange|mid)\s*:?\s*(\d+)/i,
    /(?:3pt|three-?point|3-?point)\s*:?\s*(\d+)/i,
    /(?:driving\s+dunk|dd|dunk)\s*:?\s*(\d+)/i,
    /(?:standing\s+dunk|sd)\s*:?\s*(\d+)/i,
    /(?:close\s+shot|close)\s*:?\s*(\d+)/i,
    /(?:layup)\s*:?\s*(\d+)/i,
    /(?:strength|str)\s*:?\s*(\d+)/i,
    /(?:ball\s+handle|handle|bh)\s*:?\s*(\d+)/i,
    /(?:pass\s+accuracy|passing|pa)\s*:?\s*(\d+)/i,
    /(?:speed\s+with\s+ball|swb)\s*:?\s*(\d+)/i,
    /(?:perimeter\s+defense|pdef|pd)\s*:?\s*(\d+)/i,
    /(?:steal|stl)\s*:?\s*(\d+)/i,
    /(?:block|blk)\s*:?\s*(\d+)/i,
    /(?:vertical|vert)\s*:?\s*(\d+)/i,
    /(?:post\s+control|pc)\s*:?\s*(\d+)/i,
    /(?:agility|agi|agl)\s*:?\s*(\d+)/i,
    /(?:speed|spd)\s*:?\s*(\d+)/i,
    /(?:interior\s+defense|idef|id)\s*:?\s*(\d+)/i,
    /(?:free\s+throw|ft)\s*:?\s*(\d+)/i,
  ];
  
  const attrNameMap: Record<string, string> = {
    'mid': 'Mid-Range Shot',
    'midrange': 'Mid-Range Shot',
    'mid-range': 'Mid-Range Shot',
    '3pt': 'Three-Point Shot',
    'three-point': 'Three-Point Shot',
    '3-point': 'Three-Point Shot',
    'dd': 'Driving Dunk',
    'dunk': 'Driving Dunk',
    'driving dunk': 'Driving Dunk',
    'sd': 'Standing Dunk',
    'standing dunk': 'Standing Dunk',
    'close': 'Close Shot',
    'close shot': 'Close Shot',
    'layup': 'Layup',
    'str': 'Strength',
    'strength': 'Strength',
    'bh': 'Ball Handle',
    'handle': 'Ball Handle',
    'ball handle': 'Ball Handle',
    'pa': 'Pass Accuracy',
    'passing': 'Pass Accuracy',
    'pass accuracy': 'Pass Accuracy',
    'swb': 'Speed With Ball',
    'speed with ball': 'Speed With Ball',
    'pd': 'Perimeter Defense',
    'pdef': 'Perimeter Defense',
    'perimeter defense': 'Perimeter Defense',
    'stl': 'Steal',
    'steal': 'Steal',
    'blk': 'Block',
    'block': 'Block',
    'vert': 'Vertical',
    'vertical': 'Vertical',
    'pc': 'Post Control',
    'post control': 'Post Control',
    'agi': 'Agility',
    'agl': 'Agility',
    'agility': 'Agility',
    'spd': 'Speed',
    'speed': 'Speed',
    'id': 'Interior Defense',
    'idef': 'Interior Defense',
    'interior defense': 'Interior Defense',
    'ft': 'Free Throw',
    'free throw': 'Free Throw',
  };
  
  for (const pattern of attrPatterns) {
    const match = line.match(pattern);
    if (match) {
      const attrKey = match[0].split(/\s*:?\s*/)[0].toLowerCase().trim();
      const normalizedKey = attrNameMap[attrKey] || attrKey;
      attributes[normalizedKey] = parseInt(match[1]);
    }
  }
  
  return {
    gameNumber,
    playerName,
    badgeName: matchedBadge.badgeName,
    badgeAbbreviation: matchedBadge.abbreviation,
    fromLevel,
    toLevel,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined
  };
}

/**
 * Legacy function for backward compatibility - returns first upgrade only
 */
export async function parseUpgradeRequest(message: string): Promise<ParsedUpgrade | null> {
  const upgrades = await parseUpgradeRequests(message);
  return upgrades.length > 0 ? upgrades[0] : null;
}

/**
 * Get badge requirements for a specific badge and level
 */
export async function getBadgeRequirements(badgeName: string, level: 'bronze' | 'silver' | 'gold'): Promise<Array<{
  attribute: string;
  minValue: number;
  minHeight?: string;
  maxHeight?: string;
}>> {
  const db = await getDb();
  if (!db) return [];
  
  const reqs = await db
    .select()
    .from(badgeRequirements);  
  
  const filtered = reqs.filter(req => req.badgeName === badgeName);
  
  const levelKey = level === 'bronze' ? 'bronzeMin' : level === 'silver' ? 'silverMin' : 'goldMin';
  
  const results = filtered.map(req => ({
    attribute: req.attribute,
    minValue: req[levelKey] || 0,
    minHeight: req.minHeight || undefined,
    maxHeight: req.maxHeight || undefined
  }));
  
  // Filter out requirements with 0 value (means this level doesn't exist for this badge)
  return results.filter(r => r.minValue > 0);
}
