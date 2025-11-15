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
  const sendPattern = new RegExp(
    `${team1}\\s+send[s]?[:\\s]+([^]+?)(?:for|${team2}\\s+send)`,
    'is'
  );
  const sendMatch = text.match(sendPattern);
  
  if (sendMatch) {
    // Also extract team2's players
    const team2Pattern = new RegExp(
      `${team2}\\s+send[s]?[:\\s]+([^]+?)(?:$|\\n\\n)`,
      'is'
    );
    const team2Match = text.match(team2Pattern);
    
    if (team2Match) {
      console.log('[Trade Parser] Using "Send" format strategy');
      console.log('[Trade Parser] Team1 raw:', sendMatch[1]);
      console.log('[Trade Parser] Team2 raw:', team2Match[1]);
      return {
        team1,
        team1Players: parsePlayerListWithOVR(sendMatch[1]),
        team2,
        team2Players: parsePlayerListWithOVR(team2Match[1])
      };
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
 * Parse player list with OVR format: "Player OVR (badges) Player OVR (badges) ..."
 * Example: "AD 93 (22) Jaylen Brown 91 (21) Paul Reed 72 (8) 256"
 * Also handles multi-line format:
 * "81 Kyshawn George (7)
 *  80 Jordan Poole (13)
 *  161/20"
 */
function parsePlayerListWithOVR(text: string): string[] {
  // Remove the total OVR/badge count at the end (e.g., "161/20" or "256")
  let cleaned = text.replace(/\s+\d{2,3}(?:\/\d{1,2})?\s*$/, '').trim();
  
  // Pattern: OVR + Player Name + (badges)
  // Match: "Number Name(s) (Number)" (OVR first format)
  const ovrFirstPattern = /(\d{2})\s+([A-Za-z\s]+?)\s+\(\d+\)/g;
  const players: string[] = [];
  let match;
  
  while ((match = ovrFirstPattern.exec(cleaned)) !== null) {
    const playerName = match[2].trim();
    if (playerName) {
      players.push(playerName);
      console.log('[Trade Parser] Found player (OVR-first):', playerName);
    }
  }
  
  // If no players found, try original pattern (Name OVR (badges))
  if (players.length === 0) {
    const nameFirstPattern = /([A-Za-z\s]+?)\s+(\d{2})\s+\(\d+\)/g;
    while ((match = nameFirstPattern.exec(cleaned)) !== null) {
      const playerName = match[1].trim();
      if (playerName) {
        players.push(playerName);
        console.log('[Trade Parser] Found player (name-first):', playerName);
      }
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
 * Find player by fuzzy name matching
 */
export async function findPlayerByFuzzyName(name: string, teamFilter?: string): Promise<{ id: string; name: string; team: string; overall: number } | null> {
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
  
  // Resolve team 1 players (filter by team1 roster)
  for (const playerName of parsedTrade.team1Players) {
    const player = await findPlayerByFuzzyName(playerName, parsedTrade.team1);
    if (player) {
      team1Players.push({ id: player.id, name: player.name, overall: player.overall });
    } else {
      errors.push(`Player not found on ${parsedTrade.team1}: ${playerName}`);
    }
  }
  
  // Resolve team 2 players (filter by team2 roster)
  for (const playerName of parsedTrade.team2Players) {
    const player = await findPlayerByFuzzyName(playerName, parsedTrade.team2);
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
