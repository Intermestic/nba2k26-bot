import { Message } from 'discord.js';
import { getDb } from './db';
import { players } from '../drizzle/schema';
import { extract } from 'fuzzball';

/**
 * Simple, format-agnostic trade parser
 * Uses fuzzy matching to identify teams and players regardless of format
 */

const NBA_TEAMS = [
  '76ers', 'Sixers', 'Bucks', 'Bulls', 'Cavaliers', 'Cavs', 'Celtics', 'Grizzlies',
  'Hawks', 'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic',
  'Mavs', 'Mavericks', 'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons',
  'Raptors', 'Rockets', 'Spurs', 'Suns', 'Timberwolves', 'Wolves',
  'Trail Blazers', 'Blazers', 'Warriors', 'Wizards'
];

const TEAM_ALIASES: Record<string, string> = {
  '76ers': 'Sixers',
  'sixers': 'Sixers',
  'cavaliers': 'Cavaliers',
  'cavs': 'Cavaliers',
  'grizzlies': 'Grizzlies',
  'mavericks': 'Mavs',
  'mavs': 'Mavs',
  'timberwolves': 'Timberwolves',
  'wolves': 'Timberwolves',
  'trail blazers': 'Trail Blazers',
  'blazers': 'Trail Blazers',
  'trailblazers': 'Trail Blazers'
};

function normalizeTeamName(team: string): string {
  const lower = team.toLowerCase().trim();
  return TEAM_ALIASES[lower] || team.trim();
}

/**
 * Extract all potential player names from text
 * Looks for capitalized words that could be names
 */
function extractPotentialPlayerNames(text: string): string[] {
  // Remove common words and numbers
  const cleaned = text
    .replace(/\b(send|sends|receive|receives|get|gets|trade|trades|to|from|for|and|total|ovr|badges?)\b/gi, '')
    .replace(/\d+\s*\([^)]*\)/g, '') // Remove "80 (12)" patterns
    .replace(/--/g, '\n'); // Convert -- to newlines
  
  // Split by newlines and extract names
  const lines = cleaned.split(/\n/);
  const names: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, lines with just numbers, or lines that are team names
    if (!trimmed || /^\d+$/.test(trimmed) || /^total/i.test(trimmed)) continue;
    
    // Check if this line is a team name
    const isTeamName = NBA_TEAMS.some(team => 
      trimmed.toLowerCase().includes(team.toLowerCase())
    );
    if (isTeamName) continue;
    
    // Extract the name part (before any numbers)
    const nameMatch = trimmed.match(/^([A-Za-z\s\-'\.]+)/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (name.length > 2) { // At least 3 characters
        names.push(name);
      }
    }
  }
  
  return names;
}

/**
 * Parse trade from Discord message using pure fuzzy matching
 * Format-agnostic - works with any format as long as it has team names and player names
 */
export async function parseTradeFromMessage(message: Message): Promise<{
  teams: Array<{
    name: string;
    players: Array<{ name: string; overall: number; salary: number }>;
  }>;
  // Legacy 2-team format for backward compatibility
  team1?: string;
  team2?: string;
  team1Players?: Array<{ name: string; overall: number; salary: number }>;
  team2Players?: Array<{ name: string; overall: number; salary: number }>;
} | null> {
  try {
    // Get text from embed or message content
    let text = '';
    if (message.embeds.length > 0 && message.embeds[0].description) {
      text = message.embeds[0].description;
    } else if (message.content) {
      text = message.content;
    }
    
    if (!text) {
      console.log('[Simple Parser] No text content found');
      return null;
    }
    
    console.log('[Simple Parser] Parsing text:', text.substring(0, 200));
    
    // Step 1: Find team names using fuzzy matching
    const foundTeams: string[] = [];
    for (const teamName of NBA_TEAMS) {
      if (text.toLowerCase().includes(teamName.toLowerCase())) {
        const normalized = normalizeTeamName(teamName);
        if (!foundTeams.includes(normalized)) {
          foundTeams.push(normalized);
        }
      }
    }
    
    if (foundTeams.length < 2) {
      console.log('[Simple Parser] Could not find at least 2 teams. Found:', foundTeams);
      return null;
    }
    
    console.log('[Simple Parser] Teams involved:', foundTeams.join(', '));
    
    // Step 2: Extract all potential player names
    const potentialNames = extractPotentialPlayerNames(text);
    console.log('[Simple Parser] Potential player names:', potentialNames);
    
    if (potentialNames.length === 0) {
      console.log('[Simple Parser] No player names found');
      return null;
    }
    
    // Step 3: Get all players from database
    const db = await getDb();
    if (!db) {
      console.log('[Simple Parser] Database not available');
      return null;
    }
    
    const allPlayers = await db.select().from(players);
    console.log('[Simple Parser] Loaded', allPlayers.length, 'players from database');
    
    // Step 4: Match each potential name to a real player using fuzzy matching
    // Create a map to track players by team
    const teamPlayersMap = new Map<string, Array<{ name: string; overall: number; salary: number }>>();
    foundTeams.forEach(team => teamPlayersMap.set(team, []));
    
    for (const potentialName of potentialNames) {
      // Fuzzy match against all players
      const playerNames = allPlayers.map(p => p.name);
      const matches = extract(potentialName, playerNames, { limit: 1, cutoff: 51 });
      
      if (matches.length > 0) {
        const [bestMatch, score] = matches[0];
        const matchedPlayer = allPlayers.find(p => p.name === bestMatch);
        
        if (matchedPlayer) {
          console.log(`[Simple Parser] Matched "${potentialName}" → "${matchedPlayer.name}" (${score}% confident, team: ${matchedPlayer.team})`);
          
          const playerData = {
            name: matchedPlayer.name,
            overall: matchedPlayer.overall,
            salary: matchedPlayer.salaryCap || 0
          };
          
          // Assign to correct team based on player's CURRENT team
          const playerTeam = foundTeams.find(t => t === matchedPlayer.team);
          if (playerTeam) {
            teamPlayersMap.get(playerTeam)!.push(playerData);
          } else {
            // Player is on a team not involved in the trade
            console.log(`[Simple Parser] Player ${matchedPlayer.name} is on ${matchedPlayer.team}, which is not in the trade teams: ${foundTeams.join(', ')}`);
            // Try to assign to first team with no players yet, otherwise first team
            const emptyTeam = foundTeams.find(t => teamPlayersMap.get(t)!.length === 0);
            const targetTeam = emptyTeam || foundTeams[0];
            teamPlayersMap.get(targetTeam)!.push(playerData);
          }
        }
      } else {
        console.log(`[Simple Parser] No match found for "${potentialName}" (< 51% confidence)`);
      }
    }
    
    // Build result with flexible team structure
    const teams = foundTeams.map(teamName => ({
      name: teamName,
      players: teamPlayersMap.get(teamName) || []
    }));
    
    // Log results
    teams.forEach(team => {
      console.log(`[Simple Parser] ${team.name} sends ${team.players.length} players`);
    });
    
    // Validate that all teams have at least one player
    const teamsWithoutPlayers = teams.filter(t => t.players.length === 0);
    if (teamsWithoutPlayers.length > 0) {
      console.log('[Simple Parser] Some teams have no players:', teamsWithoutPlayers.map(t => t.name).join(', '));
      return null;
    }
    
    // Build result with both new format and legacy format for backward compatibility
    const result: any = { teams };
    
    // Add legacy 2-team format if exactly 2 teams
    if (teams.length === 2) {
      result.team1 = teams[0].name;
      result.team2 = teams[1].name;
      result.team1Players = teams[0].players;
      result.team2Players = teams[1].players;
    }
    
    return result;
    
  } catch (error) {
    console.error('[Simple Parser] Error:', error);
    return null;
  }
}
