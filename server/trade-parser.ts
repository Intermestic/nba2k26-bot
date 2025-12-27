import { getDb } from './db';
import { players, matchLogs } from '../drizzle/schema';
import { extract } from 'fuzzball';
import { normalizeName, findByNormalizedName } from './name-normalizer';
import { eq, sql } from 'drizzle-orm';

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
  '76ers', 'Bucks', 'Bulls', 'Cavaliers', 'Cavs', 'Celtics', 'Grizzlies', 'Grizz',
  'Hawks', 'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic',
  'Mavs', 'Mavericks', 'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons',
  'Raptors', 'Rockets', 'Spurs', 'Suns', 'Timberwolves', 'Wolves', 'Trailblazers', 'Blazers',
  'Warriors', 'Wizards', 'Sixers'
];

/**
 * Normalize team names to match database values
 * Maps common abbreviations/variations to official team names
 */
function normalizeTeamName(teamName: string): string {
  const normalized = teamName.toLowerCase();
  
  // Team name mappings
  const teamMap: Record<string, string> = {
    'blazers': 'Trail Blazers',
    'trailblazers': 'Trail Blazers',
    'trail blazers': 'Trail Blazers',
    'mavs': 'Mavs',
    'mavericks': 'Mavs',
    'nuggets': 'Nuggets',
    '76ers': 'Sixers',
    'sixers': 'Sixers',
    'bucks': 'Bucks',
    'bulls': 'Bulls',
    'cavaliers': 'Cavaliers',
    'cavs': 'Cavaliers',
    'celtics': 'Celtics',
    'grizzlies': 'Grizzlies',
    'grizz': 'Grizzlies',
    'hawks': 'Hawks',
    'heat': 'Heat',
    'hornets': 'Hornets',
    'jazz': 'Jazz',
    'kings': 'Kings',
    'knicks': 'Knicks',
    'lakers': 'Lakers',
    'magic': 'Magic',
    'nets': 'Nets',
    'pacers': 'Pacers',
    'pelicans': 'Pelicans',
    'pistons': 'Pistons',
    'raptors': 'Raptors',
    'rockets': 'Rockets',
    'spurs': 'Spurs',
    'suns': 'Suns',
    'timberwolves': 'Timberwolves',
    'wolves': 'Timberwolves',
    'warriors': 'Warriors',
    'wizards': 'Wizards'
  };
  
  return teamMap[normalized] || teamName;
}

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
  
  const team1Raw = uniqueTeams[0];
  const team2Raw = uniqueTeams[1];
  console.log('[Trade Parser] Team1 (raw):', team1Raw, 'Team2 (raw):', team2Raw);
  
  // Try different parsing strategies
  
  // Strategy 1: "Team send: Player OVR (badges) ..." format (multi-line)
  // Updated to handle cases where team name appears without "send" keyword
  const sendPattern = new RegExp(
    `${team1Raw}\\s+send[s]?[:\\s]+([^]+?)(?:for|${team2Raw})`,
    'is'
  );
  const sendMatch = text.match(sendPattern);
  
  if (sendMatch) {
    // Also extract team2's players - try with "send" first
    let team2Pattern = new RegExp(
      `${team2Raw}\\s+send[s]?[:\\s]+([^]+?)(?:$|\\n\\n)`,
      'is'
    );
    let team2Match = text.match(team2Pattern);
    
    // If no "send", try just team name followed by players
    if (!team2Match) {
      team2Pattern = new RegExp(
        `${team2Raw}\\s*\\n([^]+?)(?:$|\\n\\n)`,
        'is'
      );
      team2Match = text.match(team2Pattern);
    }
    
    if (team2Match) {
      console.log('[Trade Parser] Using "Send" format strategy (Team1 sends)');
      console.log('[Trade Parser] Team1 raw:', sendMatch[1]);
      console.log('[Trade Parser] Team2 raw:', team2Match[1]);
      return {
        team1: normalizeTeamName(team1Raw),
        team1Players: parsePlayerListWithOVR(sendMatch[1]),
        team2: normalizeTeamName(team2Raw),
        team2Players: parsePlayerListWithOVR(team2Match[1])
      };
    }
  }
  
  // Strategy 1b: Team1 has no "send", but Team2 has "send"
  // Format: "Cavs \n Player \n\n Nuggets send \n Player"
  const team1NoSendPattern = new RegExp(
    `${team1Raw}\\s*\\n([^]+?)(?=${team2Raw})`,
    'is'
  );
  const team1NoSendMatch = text.match(team1NoSendPattern);
  
  if (team1NoSendMatch) {
    const team2SendPattern = new RegExp(
      `${team2Raw}\\s+send[s]?[:\\s]+([^]+?)(?:$|\\n\\n)`,
      'is'
    );
    const team2SendMatch = text.match(team2SendPattern);
    
    if (team2SendMatch) {
      console.log('[Trade Parser] Using mixed format strategy (Team1 no send, Team2 sends)');
      console.log('[Trade Parser] Team1 raw:', team1NoSendMatch[1]);
      console.log('[Trade Parser] Team2 raw:', team2SendMatch[1]);
      return {
        team1: normalizeTeamName(team1Raw),
        team1Players: parsePlayerListWithOVR(team1NoSendMatch[1]),
        team2: normalizeTeamName(team2Raw),
        team2Players: parsePlayerListWithOVR(team2SendMatch[1])
      };
    }
  }
  
  // Strategy 2: "Team A receives: ... Team B receives: ..." (multi-line support)
  const receivesPattern = new RegExp(
    `${team1Raw}\\s+(?:receives?|gets?)[:\\s]+([^]+?)(?=${team2Raw}|$).*?${team2Raw}\\s+(?:receives?|gets?)[:\\s]+([^]+?)(?:$|\\n\\n)`,
    'is'
  );
  const receivesMatch = text.match(receivesPattern);
  
  if (receivesMatch) {
    console.log('[Trade Parser] Using "Receives" format strategy');
    console.log('[Trade Parser] Team1 raw:', receivesMatch[1]);
    console.log('[Trade Parser] Team2 raw:', receivesMatch[2]);
    return {
      team1: normalizeTeamName(team1Raw),
      team1Players: parsePlayerListWithOVR(receivesMatch[1]),
      team2: normalizeTeamName(team2Raw),
      team2Players: parsePlayerListWithOVR(receivesMatch[2])
    };
  }
  
  // Strategy 3: "Team A trades ... to Team B for ..."
  const tradesPattern = new RegExp(
    `${team1Raw}\\s+trades?\\s+([^\\n]+?)\\s+to\\s+${team2Raw}\\s+for\\s+([^\\n]+)`,
    'is'
  );
  const tradesMatch = text.match(tradesPattern);
  
  if (tradesMatch) {
    return {
      team1: normalizeTeamName(team1Raw),
      team1Players: parsePlayerList(tradesMatch[2]), // Team1 receives what's after "for"
      team2: normalizeTeamName(team2Raw),
      team2Players: parsePlayerList(tradesMatch[1])  // Team2 receives what's after "trades"
    };
  }
  
  // Strategy 4: Split by "for" or "and" and try to extract players
  const parts = text.split(/\b(?:for|and)\b/i);
  if (parts.length >= 2) {
    return {
      team1: normalizeTeamName(team1Raw),
      team1Players: parsePlayerList(parts[0]),
      team2: normalizeTeamName(team2Raw),
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
  
  // Split by newlines, commas, AND "and" to handle multiple formats:
  // - Multi-line: "Player A\nPlayer B"
  // - Comma-separated: "Player A, Player B"
  // - And-separated: "Player A and Player B"
  const lines = text.split(/[\n,]|\s+and\s+/i).map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of lines) {
    // Skip lines that are just numbers and hyphens (totals like "245/33" or "159-21")
    if (/^[\d\-\/]+$/.test(line)) {
      console.log('[Trade Parser] Skipping total line:', line);
      continue;
    }
    
    // Skip lines that start with "Total:" or "Total"
    if (/^Total[:\s]/i.test(line.trim())) {
      console.log('[Trade Parser] Skipping total line:', line);
      continue;
    }
    
    // Skip Discord mentions (format: <@userID> or <@>)
    if (/<@!?\d*>/.test(line.trim())) {
      console.log('[Trade Parser] Skipping Discord mention:', line);
      continue;
    }
    
    // Extract player name by removing all numbers, slashes, and parentheses
    // This handles: "Trae young 88/16" → "Trae young"
    //               "Jarrett Allen 84-13" → "Jarrett Allen"
    //               "adem Bona75/5" → "adem Bona"
    //               "Gary trent77(8)" → "Gary trent" (missing space before number)
    //               "Nickeil Alexander-Walker 80 (11 badges)" → "Nickeil Alexander-Walker"
    let playerName = line
      .replace(/\d+[/\-]\d+/g, '')  // Remove OVR/badges format (both / and -)
      .replace(/\d+\s*\([^)]*\)/g, '')  // Remove OVR (X badges) format - match anything inside parens
      .replace(/\([^)]*\)/g, '')  // Remove any remaining parentheses with content
      .replace(/([a-z])(\d)/gi, '$1 $2')  // Add space before numbers (trent77 → trent 77)
      .replace(/\d+/g, '')  // Remove any remaining numbers
      .replace(/\//g, '')  // Remove slashes only (preserve hyphens in names like Alexander-Walker)
      .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
      .trim();
    
    // Only add non-empty player names (after trimming)
    if (playerName.length > 0 && playerName.trim().length > 0) {
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
  
  // Reject empty strings and placeholders
  if (!name || name.trim() === '' || name === '--') {
    console.log(`[Player Matcher] Rejecting invalid name: "${name}"`);
    return null;
  }
  
  try {
    // Get all players (optionally filtered by team)
    let allPlayers = await db.select().from(players);
    
    // Filter by team if specified
    if (teamFilter) {
      const normalizedTeam = normalizeTeamName(teamFilter);
      allPlayers = allPlayers.filter(p => p.team === normalizedTeam);
      console.log(`[Player Matcher] Searching for: "${name}" on team "${teamFilter}" (normalized: "${normalizedTeam}") (${allPlayers.length} players)`);
    } else {
      console.log(`[Player Matcher] Searching for: "${name}" in ${allPlayers.length} players`);
    }
    
    // Normalize search name (handles diacritics, punctuation, etc.)
    let searchName = normalizeName(name);
    
    // Common name variations that should match (normalized)
    const NAME_VARIATIONS: Record<string, string> = {
      'angelo russell': "dangelo russell",
      'mohammed bamba': 'mohamed bamba',
      'mo bamba': 'mohamed bamba'
    };
    
    // Check if search is a known variation
    if (NAME_VARIATIONS[searchName]) {
      console.log(`[Player Matcher] Name variation detected: "${searchName}" → "${NAME_VARIATIONS[searchName]}"`);
      searchName = NAME_VARIATIONS[searchName];
    }
    
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
      'kat': 'karl-anthony towns',
      'greek freak': 'giannis antetokounmpo',
      'king james': 'lebron james',
      'slim reaper': 'kevin durant',
      'the beard': 'james harden',
      'the brow': 'anthony davis'
    };
    
    // Check if search is a known nickname
    if (NICKNAMES[searchName]) {
      console.log(`[Player Matcher] Nickname detected: "${searchName}" → "${NICKNAMES[searchName]}"`);
      searchName = normalizeName(NICKNAMES[searchName]);
    }
    
    // Debug: Check if Vanderbilt is in the list
    if (searchName === 'vando') {
      const vanderbilt = allPlayers.find(p => p.name.toLowerCase().includes('vanderbilt'));
      console.log(`[Player Matcher] Vanderbilt in database:`, vanderbilt ? vanderbilt.name : 'NOT FOUND');
    }
    
    // Strategy 1: Exact match (normalized)
    let player = findByNormalizedName(searchName, allPlayers);
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
      }) || null;
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
    }) || null;
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
    
    // Strategy 4: Check player aliases (case-insensitive)
    try {
      const { playerAliases } = await import('../drizzle/schema');
      const aliasResults = await db.select({ player: players })
        .from(playerAliases)
        .innerJoin(players, eq(players.id, playerAliases.playerId))
        .where(sql`LOWER(${playerAliases.alias}) = ${searchName}`);
      
      // If team filter is specified, filter alias results by team
      if (aliasResults.length > 0) {
        let aliasPlayer = aliasResults[0].player;
        
        if (teamFilter) {
          const normalizedTeam = normalizeTeamName(teamFilter);
          const teamMatch = aliasResults.find(r => r.player.team === normalizedTeam);
          if (teamMatch) {
            aliasPlayer = teamMatch.player;
          } else if (aliasResults.length === 1) {
            // Only one alias match, use it even if team doesn't match
            aliasPlayer = aliasResults[0].player;
          } else {
            // Multiple alias matches but none match team - skip
            aliasPlayer = null as any;
          }
        }
        
        if (aliasPlayer) {
          await logMatch(name, aliasPlayer.name, 95, 'alias_match', context, teamFilter, true);
          return {
            id: aliasPlayer.id,
            name: aliasPlayer.name,
            team: aliasPlayer.team || 'Free Agent',
            overall: aliasPlayer.overall
          };
        }
      }
    } catch (error) {
      console.error('[Player Matcher] Error checking aliases:', error);
    }
    
    // Strategy 5: Check if search matches first name (for unique names like "Giannis")
    player = allPlayers.find(p => {
      const parts = p.name.split(' ');
      const firstName = parts[0].toLowerCase();
      return firstName === searchName || firstName.startsWith(searchName);
    }) || null;
    if (player) {
      await logMatch(name, player.name, 85, 'first_name', context, teamFilter, true);
      return {
        id: player.id,
        name: player.name,
        team: player.team || 'Free Agent',
        overall: player.overall
      };
    }
    
    // Strategy 6: Fuzzy match (fallback) - normalized names
    const normalizedPlayerNames = allPlayers.map(p => normalizeName(p.name));
    const matches = extract(searchName, normalizedPlayerNames);
    
    if (matches.length > 0 && matches[0][1] >= 60) {
      const matchedName = matches[0][0];
      player = allPlayers.find(p => normalizeName(p.name) === matchedName) || null;
      
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
      console.error(`[Trade Validation] ❌ Player not found on ${parsedTrade.team1}: "${playerName}"`);
      console.error(`[Trade Validation] Full trade context:`, JSON.stringify(parsedTrade, null, 2));
      errors.push(`Player not found on ${parsedTrade.team1}: ${playerName}`);
    }
  }
  
  // Resolve team 2 players (filter by team2 roster)
  for (const playerName of parsedTrade.team2Players) {
    const player = await findPlayerByFuzzyName(playerName, parsedTrade.team2, 'trade');
    if (player) {
      team2Players.push({ id: player.id, name: player.name, overall: player.overall });
    } else {
      console.error(`[Trade Validation] ❌ Player not found on ${parsedTrade.team2}: "${playerName}"`);
      console.error(`[Trade Validation] Full trade context:`, JSON.stringify(parsedTrade, null, 2));
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
