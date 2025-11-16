import { getDb } from './db';
import { players, matchLogs } from '../drizzle/schema';
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
  '76ers', 'Bucks', 'Bulls', 'Cavaliers', 'Celtics', 'Grizzlies',
  'Hawks', 'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic',
  'Mavs', 'Mavericks', 'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons',
  'Raptors', 'Rockets', 'Spurs', 'Suns', 'Timberwolves', 'Trailblazers',
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
  console.log('[Trade Parser] Input text:', text);
  
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
    console.log('[Trade Parser] Not enough teams found:', teamMatches.length);
    return null; // Need at least 2 teams
  }
  
  console.log('[Trade Parser] Found teams:', teamMatches);
  
  // Sort by appearance order
  teamMatches.sort((a, b) => a.index - b.index);
  
  // Take first two unique teams
  const uniqueTeams = Array.from(new Set(teamMatches.map(t => t.team)));
  if (uniqueTeams.length < 2) {
    console.log('[Trade Parser] Not enough unique teams:', uniqueTeams);
    return null;
  }
  
  const team1 = uniqueTeams[0];
  const team2 = uniqueTeams[1];
  console.log('[Trade Parser] Team1:', team1, 'Team2:', team2);
  
  // Try different parsing strategies
  
  // Strategy 1: "Team send: Player OVR (badges) ..." format (multi-line)
  // This strategy is very flexible - accepts:
  // - "Team send: players"
  // - "Team sends: players"
  // - "Team: players"
  // - "Team\nplayers" (just team name followed by player list)
  
  // Try to match team1's section with optional "send/sends" keyword
  const team1Pattern = new RegExp(
    `${team1}\\s*(?:send[s]?)?[:\\s]*\\n?([^]+?)(?:${team2}|$)`,
    'is'
  );
  const team1Match = text.match(team1Pattern);
  
  if (team1Match) {
    // Try to match team2's section with optional "send/sends" keyword
    const team2Pattern = new RegExp(
      `${team2}\\s*(?:send[s]?)?[:\\s]*\\n?([^]+?)(?:$|\\n\\n)`,
      'is'
    );
    const team2Match = text.match(team2Pattern);
    
    if (team2Match) {
      console.log('[Trade Parser] Using flexible format strategy');
      console.log('[Trade Parser] Team1 raw:', team1Match[1]);
      console.log('[Trade Parser] Team2 raw:', team2Match[1]);
      
      const team1Players = parsePlayerListWithOVR(team1Match[1]);
      const team2Players = parsePlayerListWithOVR(team2Match[1]);
      
      // Only return if we found players for both teams
      if (team1Players.length > 0 && team2Players.length > 0) {
        return {
          team1,
          team1Players,
          team2,
          team2Players
        };
      }
    }
  }
  
  // Strategy 2: "Team A receives: ... Team B receives: ..."
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
 * Parse player list - extract player names from lines, ignoring all numbers
 * Supports formats:
 * - "Trae young 88/16"
 * - "jarrett allen 84/13"
 * - "Caleb Martin 73/4"
 * - "adem Bona75/5"
 */
function parsePlayerListWithOVR(text: string): string[] {
  const players: string[] = [];
  
  // Split by newlines to process each line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of lines) {
    // Skip lines that are just numbers (totals like "245/33")
    if (/^\d+\/\d+$/.test(line)) {
      continue;
    }
    
    // Extract player name by removing all numbers, slashes, and parentheses
    // This handles: "Trae young 88/16" → "Trae young"
    //               "adem Bona75/5" → "adem Bona"
    const playerName = line
      .replace(/\d+\/\d+/g, '')  // Remove OVR/badges format
      .replace(/\d+\s*\(\d+\)/g, '')  // Remove OVR (badges) format
      .replace(/\(\d+\)/g, '')  // Remove standalone (badges)
      .replace(/\d+/g, '')  // Remove any remaining numbers
      .trim();
    
    if (playerName.length > 0) {
      players.push(playerName);
      console.log('[Trade Parser] Found player:', playerName);
    }
  }
  
  return players;
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
 * Log a match attempt to the database
 */
async function logMatch(inputName: string, matchedName: string | null, confidenceScore: number | null, strategy: string, context: string, teamFilter: string | undefined, success: boolean) {
  try {
    const db = await getDb();
    if (!db) return;
    
    await db.insert(matchLogs).values({
      inputName,
      matchedName,
      confidenceScore,
      strategy,
      context,
      teamFilter: teamFilter || null,
      success
    });
    
    // Log low-confidence matches to console
    if (success && confidenceScore && confidenceScore < 90) {
      console.log(`[Match Log] ⚠️ Low confidence (${confidenceScore}%): "${inputName}" → "${matchedName}" [${strategy}]`);
    }
  } catch (error) {
    console.error('[Match Log] Failed to log match:', error);
  }
}

/**
 * Find player by fuzzy name matching
 */
export async function findPlayerByFuzzyName(name: string, teamFilter?: string, context: string = 'unknown'): Promise<{ id: string; name: string; team: string; overall: number } | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Get all players (optionally filtered by team)
    let allPlayers = await db.select().from(players);
    
    // Filter by team if specified
    if (teamFilter) {
      allPlayers = allPlayers.filter(p => p.team === teamFilter);
      console.log(`[Player Matcher] Searching for: "${name}" on team "${teamFilter}" (${allPlayers.length} players)`);
    } else {
      console.log(`[Player Matcher] Searching for: "${name}" in ${allPlayers.length} players`);
    }
    
    let searchName = name.trim().toLowerCase();
    
    // Nickname mapping
    const NICKNAMES: Record<string, string> = {
      'ad': 'anthony davis',
      'vando': 'jarred vanderbilt',
      'giannis': 'giannis antetokounmpo',
      'lebron': 'lebron james',
      'kd': 'kevin durant',
      'pg': 'paul george',
      'kawhi': 'kawhi leonard',
      'dame': 'damian lillard',
      'steph': 'stephen curry',
      'cp3': 'chris paul',
      'pg13': 'paul george',
      'greek freak': 'giannis antetokounmpo',
      'king james': 'lebron james',
      'slim reaper': 'kevin durant',
      'the beard': 'james harden',
      'the brow': 'anthony davis'
    };
    
    // Check if search is a known nickname
    if (NICKNAMES[searchName]) {
      console.log(`[Player Matcher] Nickname detected: "${searchName}" → "${NICKNAMES[searchName]}"`);
      searchName = NICKNAMES[searchName];
    }
    
    // Debug: Check if Vanderbilt is in the list
    if (searchName === 'vando') {
      const vanderbilt = allPlayers.find(p => p.name.toLowerCase().includes('vanderbilt'));
      console.log(`[Player Matcher] Vanderbilt in database:`, vanderbilt ? vanderbilt.name : 'NOT FOUND');
    }
    
    // Strategy 1: Exact match (case insensitive)
    let player = allPlayers.find(p => p.name.toLowerCase() === searchName);
    if (player) {
      await logMatch(name, player.name, 100, 'exact_match', context, teamFilter, true);
      return {
        id: player.id,
        name: player.name,
        team: player.team || 'Free Agent',
        overall: player.overall
      };
    }
    
    // Strategy 2: Check if search is initials (e.g., "AD" for "Anthony Davis")
    if (searchName.length <= 4 && /^[a-z]+$/.test(searchName)) {
      player = allPlayers.find(p => {
        const parts = p.name.split(' ');
        const initials = parts.map(part => part[0].toLowerCase()).join('');
        return initials === searchName;
      });
      if (player) {
        await logMatch(name, player.name, 95, 'initials', context, teamFilter, true);
        return {
          id: player.id,
          name: player.name,
          team: player.team || 'Free Agent',
          overall: player.overall
        };
      }
    }
    
    // Strategy 3: Check if search matches last name (or is contained in it)
    player = allPlayers.find(p => {
      const parts = p.name.split(' ');
      const lastName = parts[parts.length - 1].toLowerCase();
      const matches = lastName === searchName || lastName.startsWith(searchName) || lastName.includes(searchName);
      if (searchName === 'vando') {
        console.log(`[Player Matcher] Checking "${p.name}": lastName="${lastName}", matches=${matches}`);
      }
      return matches;
    });
    if (player) {
      console.log(`[Player Matcher] Found via Strategy 3 (last name): "${player.name}"`);
      await logMatch(name, player.name, 90, 'last_name', context, teamFilter, true);
      return {
        id: player.id,
        name: player.name,
        team: player.team || 'Free Agent',
        overall: player.overall
      };
    }
    console.log(`[Player Matcher] Strategy 3 failed for "${searchName}"`);
    
    // Strategy 3.5: Fuzzy match on last names only (for nicknames like "Vando")
    if (searchName.length >= 4) {
      const lastNameMatches = allPlayers.map(p => {
        const parts = p.name.split(' ');
        const lastName = parts[parts.length - 1];
        return { player: p, lastName };
      });
      
      const fuzzyLastNames = extract(searchName, lastNameMatches.map(m => m.lastName));
      
      if (fuzzyLastNames.length > 0 && fuzzyLastNames[0][1] >= 60) {
        const matchedLastName = fuzzyLastNames[0][0];
        const match = lastNameMatches.find(m => m.lastName === matchedLastName);
        
        if (match) {
          console.log(`[Player Matcher] Found via Strategy 3.5 (fuzzy last name): "${match.player.name}" (score: ${fuzzyLastNames[0][1]})`);
          await logMatch(name, match.player.name, fuzzyLastNames[0][1], 'fuzzy_last_name', context, teamFilter, true);
          return {
            id: match.player.id,
            name: match.player.name,
            team: match.player.team || 'Free Agent',
            overall: match.player.overall
          };
        }
      }
    }
    
    // Strategy 4: Check if search matches first name (for unique names like "Giannis")
    player = allPlayers.find(p => {
      const parts = p.name.split(' ');
      const firstName = parts[0].toLowerCase();
      return firstName === searchName || firstName.startsWith(searchName);
    });
    if (player) {
      await logMatch(name, player.name, 85, 'first_name', context, teamFilter, true);
      return {
        id: player.id,
        name: player.name,
        team: player.team || 'Free Agent',
        overall: player.overall
      };
    }
    
    // Strategy 5: Fuzzy match (fallback)
    const matches = extract(name, allPlayers.map(p => p.name));
    
    if (matches.length > 0 && matches[0][1] >= 60) {
      const matchedName = matches[0][0];
      player = allPlayers.find(p => p.name === matchedName);
      
      if (player) {
        await logMatch(name, player.name, matches[0][1], 'fuzzy_full_name', context, teamFilter, true);
        return {
          id: player.id,
          name: player.name,
          team: player.team || 'Free Agent',
          overall: player.overall
        };
      }
    }
    
    // No match found - log failure
    await logMatch(name, null, null, 'no_match', context, teamFilter, false);
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
  
  // Resolve team 1 players (filter by team1 roster)
  for (const playerName of parsedTrade.team1Players) {
    const player = await findPlayerByFuzzyName(playerName, parsedTrade.team1, 'trade');
    if (player) {
      team1Players.push({ id: player.id, name: player.name, overall: player.overall });
    } else {
      errors.push(`Player not found on ${parsedTrade.team1}: ${playerName}`);
    }
  }
  
  // Resolve team 2 players (filter by team2 roster)
  for (const playerName of parsedTrade.team2Players) {
    const player = await findPlayerByFuzzyName(playerName, parsedTrade.team2, 'trade');
    if (player) {
      team2Players.push({ id: player.id, name: player.name, overall: player.overall });
    } else {
      errors.push(`Player not found on ${parsedTrade.team2}: ${playerName}`);
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
