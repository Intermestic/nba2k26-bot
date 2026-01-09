import { Message } from 'discord.js';
import { getDb } from './db';
import { players, trades } from '../drizzle/schema';
import { extract } from 'fuzzball';
import { eq } from 'drizzle-orm';

/**
 * Improved trade parser that uses robust pattern matching
 * Handles various trade formats reliably
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
 * Parse player list from a section of text
 * Handles formats like:
 * - "Player Name 81 (10)"
 * - "Player Name 81 (10 badges)"
 * - "Player Name: 81 (10)"
 * - "• Player Name 81 (10)" (bullet points)
 */
function parsePlayerListWithOVR(text: string): Array<{ name: string; overall: number; salary: number }> {
  const players: Array<{ name: string; overall: number; salary: number }> = [];
  
  // Split by newlines and commas
  const lines = text.split(/[\n,]/).map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of lines) {
    // Skip total lines
    if (/^Total[:\s]/i.test(line) || /^[\d\-\/]+$/.test(line)) {
      continue;
    }
    
    // Skip Discord mentions and markdown
    if (/<@!?\d*>/.test(line) || /^\*+$/.test(line)) {
      continue;
    }
    
    // Remove bullet points and dashes at the start
    let cleanLine = line.replace(/^[•\-\*]\s*/, '');
    
    // Pattern: "Player Name OVR (salary)" or "Player Name: OVR (salary)"
    // Handles: "Devin Vassell 81 (10)", "Rudy Gobert 83 (12 badges)", "Collin Gillespie 79 (9)"
    const pattern = /^([A-Za-z\s\-'\.\.]+?)\s*:?\s*(\d+)\s*\(?\s*(\d+)\s*(?:badges)?\)?$/;
    const match = cleanLine.match(pattern);
    
    if (match) {
      const playerName = match[1].trim();
      const overall = parseInt(match[2]);
      const salary = parseInt(match[3]);
      
      // Validate player name (not a number or placeholder)
      if (playerName && playerName !== '--' && !/^\d+$/.test(playerName)) {
        players.push({
          name: playerName,
          overall,
          salary
        });
        console.log(`[Simple Parser] Parsed player: ${playerName} (${overall} OVR, ${salary} salary)`);
      }
    }
  }
  
  return players;
}

/**
 * Find teams in order of appearance in the text
 * Uses word boundary matching to avoid matching team names within player names
 * Also handles mentions like "@Pacers(nickname)" and "@Pacers"
 */
function findTeamsInOrder(text: string): string[] {
  const foundTeams: string[] = [];
  const matches: Array<{ team: string; index: number }> = [];
  
  // Find all team mentions with their positions
  for (const teamName of NBA_TEAMS) {
    // Use word boundary to match whole words only
    // Match at start of line, after whitespace/asterisks, or after @ (mentions)
    // Also match @TeamName(nickname) format
    const regex = new RegExp(`(?:^|\\s|\\*|@)(${teamName})(?:\\s|:|\\*|\\(|$)`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ team: teamName, index: match.index });
    }
  }
  
  // Sort by appearance order
  matches.sort((a, b) => a.index - b.index);
  
  // Extract unique teams in order
  for (const match of matches) {
    const normalized = normalizeTeamName(match.team);
    if (!foundTeams.includes(normalized)) {
      foundTeams.push(normalized);
    }
  }
  
  return foundTeams;
}

/**
 * Parse trade from Discord message using pattern matching
 * Handles "Team Send:" format and other common formats
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
    // Ensure message is fully fetched (not partial)
    if (message.partial) {
      console.log('[Simple Parser] Message is partial, fetching full message...');
      try {
        message = await message.fetch();
        console.log('[Simple Parser] Successfully fetched full message');
      } catch (fetchError) {
        console.error('[Simple Parser] Failed to fetch full message:', fetchError);
      }
    }
    
    // Get text from embed or message content
    let text = '';
    if (message.embeds.length > 0 && message.embeds[0].description) {
      text = message.embeds[0].description;
      console.log('[Simple Parser] Using embed description');
    } else if (message.embeds.length > 0) {
      // Try to extract text from embed title and fields
      const embed = message.embeds[0];
      const parts = [];
      if (embed.title) parts.push(embed.title);
      if (embed.description) parts.push(embed.description);
      if (embed.fields && embed.fields.length > 0) {
        for (const field of embed.fields) {
          if (field.name) parts.push(field.name);
          if (field.value) parts.push(field.value);
        }
      }
      text = parts.join('\n');
      if (text) {
        console.log('[Simple Parser] Using embed title, fields, and other content');
      }
    }
    
    if (!text && message.content) {
      text = message.content;
      console.log('[Simple Parser] Using message content');
    }
    
    if (!text) {
      console.log('[Simple Parser] No text content found in message or embeds');
      return null;
    }
    
    console.log('[Simple Parser] Parsing text:', text.substring(0, 300));
    
    // Find teams in order of appearance
    const foundTeams = findTeamsInOrder(text);
    
    if (foundTeams.length < 2) {
      console.log('[Simple Parser] Could not find at least 2 teams. Found:', foundTeams);
      return null;
    }
    
    console.log('[Simple Parser] Teams involved (in order):', foundTeams.join(', '));
    
    // Take first two teams in order of appearance
    const team1 = foundTeams[0];
    const team2 = foundTeams[1];
    
    // Build regex patterns to match "Team Send:" or "Team Sends:" (with optional asterisks)
    // Pattern explanation:
    // - \*{0,2} matches 0-2 asterisks (for markdown bold)
    // - Team name (literal string)
    // - \s+ matches whitespace
    // - sends? matches "send" or "sends"
    // - \*{0,2} matches 0-2 asterisks
    // - [:] matches colon
    // - ([^]+?) captures everything until the next team or end
    
    // Escape special regex characters in team names
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const team1Escaped = escapeRegex(team1);
    const team2Escaped = escapeRegex(team2);
    
    // Pattern for team1: capture everything from "Team1 Send(s):" until "Team2 Send(s):" or end
    // Also handle @Team(nickname) format
    const team1SendPattern = new RegExp(
      `(?:@?\\*{0,2}${team1Escaped}(?:\\([^)]*\\))?\\s+sends?\\*{0,2}\\s*:|\\*{0,2}${team1Escaped}\\s+sends?\\*{0,2}\\s*:)\\s*([^]*?)(?=@?\\*{0,2}${team2Escaped}(?:\\([^)]*\\))?\\s+sends?|$)`,
      'is'
    );
    
    // Pattern for team2: capture everything from "Team2 Send(s):" until end
    // Also handle @Team(nickname) format
    const team2SendPattern = new RegExp(
      `(?:@?\\*{0,2}${team2Escaped}(?:\\([^)]*\\))?\\s+sends?\\*{0,2}\\s*:|\\*{0,2}${team2Escaped}\\s+sends?\\*{0,2}\\s*:)\\s*([^]*?)$`,
      'is'
    );
    
    const team1Match = text.match(team1SendPattern);
    const team2Match = text.match(team2SendPattern);
    
    console.log(`[Simple Parser] Team1 pattern match: ${team1Match ? 'YES' : 'NO'}`);
    console.log(`[Simple Parser] Team2 pattern match: ${team2Match ? 'YES' : 'NO'}`);
    
    if (team1Match && team2Match) {
      console.log('[Simple Parser] Successfully matched "Team Send:" format');
      
      const team1Players = parsePlayerListWithOVR(team1Match[1]);
      const team2Players = parsePlayerListWithOVR(team2Match[1]);
      
      console.log(`[Simple Parser] Parsed ${team1Players.length} players for ${team1}, ${team2Players.length} players for ${team2}`);
      
      if (team1Players.length > 0 && team2Players.length > 0) {
        console.log(`[Simple Parser] Parsed trade: ${team1} (${team1Players.length} players) ↔ ${team2} (${team2Players.length} players)`);
        
        return {
          teams: [
            { name: team1, players: team1Players },
            { name: team2, players: team2Players }
          ],
          team1,
          team2,
          team1Players,
          team2Players
        };
      }
    }
    
    // Fallback 1: Try alternative format without "Sends:" - just look for teams and their players
    console.log('[Simple Parser] Pattern matching failed, trying alternative format...');
    const altTeam1Players = parsePlayerListWithOVR(text);
    if (altTeam1Players.length > 0) {
      console.log(`[Simple Parser] Found ${altTeam1Players.length} players in alternative format`);
      // If we found players, try to split them between the two teams
      const midpoint = Math.floor(altTeam1Players.length / 2);
      const team1Players = altTeam1Players.slice(0, midpoint);
      const team2Players = altTeam1Players.slice(midpoint);
      
      if (team1Players.length > 0 && team2Players.length > 0) {
        console.log(`[Simple Parser] Split players: ${team1} (${team1Players.length}) ↔ ${team2} (${team2Players.length})`);
        return {
          teams: [
            { name: team1, players: team1Players },
            { name: team2, players: team2Players }
          ],
          team1,
          team2,
          team1Players,
          team2Players
        };
      }
    }
    
    // Fallback 2: Try to find trade record in database by message ID
    console.log('[Simple Parser] Alternative format failed, attempting database fallback...');
    try {
      const db = await getDb();
      if (db) {
        const existingTrade = await db.select().from(trades).where(eq(trades.messageId, message.id)).limit(1);
        
        if (existingTrade.length > 0) {
          const trade = existingTrade[0];
          console.log('[Simple Parser] Found trade record in database, using cached data');
          
          const team1Players = JSON.parse(trade.team1Players);
          const team2Players = JSON.parse(trade.team2Players);
          
          return {
            teams: [
              { name: trade.team1, players: team1Players },
              { name: trade.team2, players: team2Players }
            ],
            team1: trade.team1,
            team2: trade.team2,
            team1Players,
            team2Players
          };
        }
      }
    } catch (dbError) {
      console.error('[Simple Parser] Database fallback also failed:', dbError);
    }
    
    console.log('[Simple Parser] Could not parse trade using any method');
    return null;
    
  } catch (error) {
    console.error('[Simple Parser] Error:', error);
    console.error('[Simple Parser] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}
