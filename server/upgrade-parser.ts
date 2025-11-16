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
 * Parse upgrade request message
 * 
 * Supported formats:
 * - "5gm upgrade: Suggs SS +1 to silver"
 * - "Upgrade: Paolo Banchero Shifty Shooter bronze to silver"
 * - "10gm: Suggs SS bronze->silver midrange 87, 3pt 91"
 */
export async function parseUpgradeRequest(message: string): Promise<ParsedUpgrade | null> {
  const text = message.trim().toLowerCase();
  console.log('[Upgrade Parser] Input:', text);
  
  // Extract game number if present (e.g., "5gm", "10gm")
  const gameMatch = text.match(/(\d+)\s*gm/i);
  const gameNumber = gameMatch ? parseInt(gameMatch[1]) : undefined;
  
  // Remove "upgrade:", "gm upgrade:", etc. to get core content
  let core = text
    .replace(/^\d+\s*gm\s*(upgrade)?:?\s*/i, '')
    .replace(/^upgrade:?\s*/i, '')
    .trim();
  
  console.log('[Upgrade Parser] Core text:', core);
  
  // Try to extract badge name or abbreviation
  const db = await getDb();
  if (!db) return null;
  
  // Get all badge abbreviations for matching
  const badges = await db.select().from(badgeAbbreviations);
  
  // Try to find badge in the message (case-insensitive)
  let matchedBadge: typeof badges[0] | null = null;
  let badgePosition = -1;
  
  // First try abbreviations (shorter, more specific)
  for (const badge of badges) {
    const abbrevLower = badge.abbreviation.toLowerCase();
    const pos = core.indexOf(abbrevLower);
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
      const pos = core.indexOf(nameLower);
      if (pos !== -1) {
        matchedBadge = badge;
        badgePosition = pos;
        break;
      }
    }
  }
  
  if (!matchedBadge) {
    console.log('[Upgrade Parser] No badge found in message');
    return null;
  }
  
  console.log('[Upgrade Parser] Matched badge:', matchedBadge.badgeName);
  
  // Extract player name (everything before the badge)
  const playerName = core.substring(0, badgePosition).trim();
  
  // Extract level change (e.g., "+1 to silver", "bronze to silver", "bronze->silver")
  const levelMatch = core.match(/(none|bronze|silver|gold)?\s*(?:\+1|\->|to)\s*(bronze|silver|gold)/i);
  
  if (!levelMatch) {
    console.log('[Upgrade Parser] No level change found');
    return null;
  }
  
  const fromLevel = (levelMatch[1] || 'none') as 'none' | 'bronze' | 'silver' | 'gold';
  const toLevel = levelMatch[2] as 'bronze' | 'silver' | 'gold';
  
  console.log('[Upgrade Parser] Level change:', fromLevel, '->', toLevel);
  
  // Extract attributes if provided (e.g., "midrange 87, 3pt 91" or "midrange: 87 3pt: 91")
  const attributes: Record<string, number> = {};
  
  // Common attribute patterns
  const attrPatterns = [
    /(?:mid-?range|midrange|mid)\s*:?\s*(\d+)/i,
    /(?:3pt|three-?point|3-?point)\s*:?\s*(\d+)/i,
    /(?:driving\s+dunk|dd)\s*:?\s*(\d+)/i,
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
    /(?:agility|agi)\s*:?\s*(\d+)/i,
    /(?:speed|spd)\s*:?\s*(\d+)/i,
    /(?:interior\s+defense|idef|id)\s*:?\s*(\d+)/i,
  ];
  
  const attrNameMap: Record<string, string> = {
    'mid': 'Mid-Range Shot',
    'midrange': 'Mid-Range Shot',
    'mid-range': 'Mid-Range Shot',
    '3pt': 'Three-Point Shot',
    'three-point': 'Three-Point Shot',
    '3-point': 'Three-Point Shot',
    'dd': 'Driving Dunk',
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
    'agility': 'Agility',
    'spd': 'Speed',
    'speed': 'Speed',
    'id': 'Interior Defense',
    'idef': 'Interior Defense',
    'interior defense': 'Interior Defense',
  };
  
  for (const pattern of attrPatterns) {
    const match = core.match(pattern);
    if (match) {
      const attrKey = match[0].split(/\s*:?\s*/)[0].toLowerCase().trim();
      const normalizedKey = attrNameMap[attrKey] || attrKey;
      attributes[normalizedKey] = parseInt(match[1]);
    }
  }
  
  console.log('[Upgrade Parser] Extracted attributes:', attributes);
  
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
  
  return filtered.map(req => ({
    attribute: req.attribute,
    minValue: req[levelKey] || 0,
    minHeight: req.minHeight || undefined,
    maxHeight: req.maxHeight || undefined
  }));
}
