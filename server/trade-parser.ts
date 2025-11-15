import { getDb } from './db';
import { players } from '../drizzle/schema';
import { extract } from 'fuzzball';

/**
 * Parsed trade structure
 */
export interface ParsedTrade {
  team1: string;
  team1Players: string[];
  team2: string;
  team2Players: string[];
}

/**
 * NBA team names for fuzzy matching
 */
const NBA_TEAMS = [
  '76ers', 'Bucks', 'Bulls', 'Cavaliers', 'Celtics', 'Clippers', 'Grizzlies',
  'Hawks', 'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic',
  'Mavs', 'Mavericks', 'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons',
  'Raptors', 'Rockets', 'Spurs', 'Suns', 'Thunder', 'Timberwolves', 'Trailblazers',
  'Warriors', 'Wizards'
];

/**
 * Parse trade message to extract teams and players
 * 
 * Common formats:
 * - "Team A trades Player X to Team B for Player Y"
 * - "Team A receives: Player X\nTeam B receives: Player Y"
 * - "Team A gets Player X, Team B gets Player Y"
 */
export function parseTrade(message: string): ParsedTrade | null {
  const text = message.trim();
  
  // Try to find team names in the message
  const teamMatches: Array<{ team: string; index: number }> = [];
  
  for (const team of NBA_TEAMS) {
    const regex = new RegExp(`\\b${team}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      teamMatches.push({ team, index: match.index });
    }
  }
  
  if (teamMatches.length < 2) {
    return null; // Need at least 2 teams
  }
  
  // Sort by appearance order
  teamMatches.sort((a, b) => a.index - b.index);
  
  // Take first two unique teams
  const uniqueTeams = Array.from(new Set(teamMatches.map(t => t.team)));
  if (uniqueTeams.length < 2) {
    return null;
  }
  
  const team1 = uniqueTeams[0];
  const team2 = uniqueTeams[1];
  
  // Try different parsing strategies
  
  // Strategy 1: "Team A receives: ... Team B receives: ..."
  const receivesPattern = new RegExp(
    `${team1}\\s+(?:receives?|gets?)[:\\s]+([^\\n]+?)(?=${team2}|$).*?${team2}\\s+(?:receives?|gets?)[:\\s]+([^\\n]+)`,
    'is'
  );
  const receivesMatch = text.match(receivesPattern);
  
  if (receivesMatch) {
    return {
      team1,
      team1Players: parsePlayerList(receivesMatch[1]),
      team2,
      team2Players: parsePlayerList(receivesMatch[2])
    };
  }
  
  // Strategy 2: "Team A trades ... to Team B for ..."
  const tradesPattern = new RegExp(
    `${team1}\\s+trades?\\s+([^\\n]+?)\\s+to\\s+${team2}\\s+for\\s+([^\\n]+)`,
    'is'
  );
  const tradesMatch = text.match(tradesPattern);
  
  if (tradesMatch) {
    return {
      team1,
      team1Players: parsePlayerList(tradesMatch[2]), // Team1 receives what's after "for"
      team2,
      team2Players: parsePlayerList(tradesMatch[1])  // Team2 receives what's after "trades"
    };
  }
  
  // Strategy 3: Split by "for" or "and" and try to extract players
  const parts = text.split(/\b(?:for|and)\b/i);
  if (parts.length >= 2) {
    return {
      team1,
      team1Players: parsePlayerList(parts[0]),
      team2,
      team2Players: parsePlayerList(parts[1])
    };
  }
  
  return null;
}

/**
 * Parse a string into a list of player names
 * Handles comma-separated lists, "and" separators, etc.
 */
function parsePlayerList(text: string): string[] {
  // Remove common words
  let cleaned = text
    .replace(/\b(receives?|gets?|trades?|to|from|for|and)\b/gi, '')
    .trim();
  
  // Split by commas, "and", or newlines
  const players = cleaned
    .split(/[,\n]|(?:\s+and\s+)/i)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  return players;
}

/**
 * Find player by fuzzy name matching
 */
export async function findPlayerByFuzzyName(name: string): Promise<{ id: string; name: string; team: string; overall: number } | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Get all players
    const allPlayers = await db.select().from(players);
    
    // Fuzzy match
    const matches = extract(name, allPlayers.map(p => p.name));
    
    if (matches.length > 0 && matches[0][1] >= 70) {
      const matchedName = matches[0][0];
      const player = allPlayers.find(p => p.name === matchedName);
      
      if (player) {
        return {
          id: player.id,
          name: player.name,
          team: player.team || 'Free Agent',
          overall: player.overall
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Trade Parser] Error finding player:', error);
    return null;
  }
}

/**
 * Validate and resolve all players in a trade
 */
export async function resolveTradePlayer(parsedTrade: ParsedTrade): Promise<{
  valid: boolean;
  team1: string;
  team1Players: Array<{ id: string; name: string; overall: number }>;
  team2: string;
  team2Players: Array<{ id: string; name: string; overall: number }>;
  errors: string[];
}> {
  const errors: string[] = [];
  const team1Players: Array<{ id: string; name: string; overall: number }> = [];
  const team2Players: Array<{ id: string; name: string; overall: number }> = [];
  
  // Resolve team 1 players
  for (const playerName of parsedTrade.team1Players) {
    const player = await findPlayerByFuzzyName(playerName);
    if (player) {
      team1Players.push({ id: player.id, name: player.name, overall: player.overall });
    } else {
      errors.push(`Player not found: ${playerName}`);
    }
  }
  
  // Resolve team 2 players
  for (const playerName of parsedTrade.team2Players) {
    const player = await findPlayerByFuzzyName(playerName);
    if (player) {
      team2Players.push({ id: player.id, name: player.name, overall: player.overall });
    } else {
      errors.push(`Player not found: ${playerName}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    team1: parsedTrade.team1,
    team1Players,
    team2: parsedTrade.team2,
    team2Players,
    errors
  };
}
