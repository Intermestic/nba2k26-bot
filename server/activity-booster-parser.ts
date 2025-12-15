import { Message } from 'discord.js';
import Fuse from 'fuse.js';

/**
 * Activity Booster Message Parser
 * 
 * Parses activity booster posts to extract:
 * - Posting team (from Discord role)
 * - Opponent team (from message content)
 * - Result (W/L for both teams)
 */

// All valid team names
const VALID_TEAMS = [
  'Hawks', 'Celtics', 'Nets', 'Hornets', 'Bulls',
  'Cavaliers', 'Mavs', 'Nuggets', 'Pistons', 'Warriors',
  'Rockets', 'Pacers', 'Clippers', 'Lakers', 'Grizzlies',
  'Heat', 'Bucks', 'Timberwolves', 'Pelicans', 'Knicks',
  'Thunder', 'Magic', 'Sixers', 'Suns', 'Trail Blazers',
  'Kings', 'Spurs', 'Raptors', 'Jazz', 'Wizards'
];

// Team name aliases
const TEAM_ALIASES: Record<string, string> = {
  'raps': 'Raptors',
  'sixers': 'Sixers',
  '76ers': 'Sixers',
  'blazers': 'Trail Blazers',
  'trailblazers': 'Trail Blazers',
  'wolves': 'Timberwolves',
  'cavs': 'Cavaliers',
  'mavs': 'Mavs',
  'mavericks': 'Mavs',
  'grizz': 'Grizzlies',
};

export interface ParsedActivityBooster {
  postingTeam: string;
  opponentTeam: string;
  postingTeamResult: 'W' | 'L';
  opponentTeamResult: 'W' | 'L';
  messageId: string;
  timestamp: Date;
  rawMessage: string;
}

/**
 * Get team from user's Discord roles
 */
function getTeamFromRoles(message: Message): string | null {
  if (!message.member?.roles) return null;
  
  const roleNames = message.member.roles.cache.map(role => role.name);
  
  // Find first role that matches a valid team name
  for (const roleName of roleNames) {
    const normalized = normalizeTeamName(roleName);
    if (VALID_TEAMS.includes(normalized)) {
      return normalized;
    }
  }
  
  return null;
}

/**
 * Normalize team name using aliases
 */
function normalizeTeamName(name: string): string {
  const lower = name.toLowerCase().trim();
  return TEAM_ALIASES[lower] || name;
}

/**
 * Extract opponent team from message content using fuzzy matching
 */
function extractOpponentTeam(content: string, postingTeam: string): string | null {
  // Remove date lines (e.g., "Nov 24", "Feb 3rd", "Jan 3")
  const cleanContent = content.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(st|nd|rd|th)?\b/gi, '');
  
  // Look for "vs" or "v" pattern
  const vsMatch = cleanContent.match(/(?:vs?\.?|versus)\s+([a-z\s]+)/i);
  if (vsMatch) {
    const teamText = vsMatch[1].trim();
    const normalized = normalizeTeamName(teamText);
    
    // Check if it's a valid team
    if (VALID_TEAMS.includes(normalized)) {
      return normalized;
    }
    
    // Try fuzzy matching
    const fuse = new Fuse(VALID_TEAMS, {
      threshold: 0.3,
      includeScore: true,
    });
    
    const results = fuse.search(normalized);
    if (results.length > 0 && results[0].item !== postingTeam) {
      return results[0].item;
    }
  }
  
  // Fallback: Look for any team name mentioned in the content
  for (const team of VALID_TEAMS) {
    if (team === postingTeam) continue; // Skip posting team
    
    const regex = new RegExp(`\\b${team}\\b`, 'i');
    if (regex.test(cleanContent)) {
      return team;
    }
  }
  
  // Check aliases
  for (const [alias, team] of Object.entries(TEAM_ALIASES)) {
    if (team === postingTeam) continue;
    
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(cleanContent)) {
      return team;
    }
  }
  
  return null;
}

/**
 * Extract result from message content
 * Returns which team won
 */
function extractResult(content: string, postingTeam: string, opponentTeam: string): { winner: string; loser: string } | null {
  // Look for lines with W or L
  const lines = content.split('\n').map(l => l.trim());
  
  for (const line of lines) {
    // Check for "Team W" or "Team L" pattern
    const wMatch = line.match(/([a-z\s]+)\s+W\b/i);
    const lMatch = line.match(/([a-z\s]+)\s+L\b/i);
    
    if (wMatch) {
      const winnerText = wMatch[1].trim();
      const normalized = normalizeTeamName(winnerText);
      
      // Check if winner matches posting team or opponent
      if (normalized.toLowerCase() === postingTeam.toLowerCase() || 
          postingTeam.toLowerCase().includes(normalized.toLowerCase()) ||
          normalized.toLowerCase().includes(postingTeam.toLowerCase())) {
        return { winner: postingTeam, loser: opponentTeam };
      }
      
      if (normalized.toLowerCase() === opponentTeam.toLowerCase() ||
          opponentTeam.toLowerCase().includes(normalized.toLowerCase()) ||
          normalized.toLowerCase().includes(opponentTeam.toLowerCase())) {
        return { winner: opponentTeam, loser: postingTeam };
      }
    }
    
    if (lMatch) {
      const loserText = lMatch[1].trim();
      const normalized = normalizeTeamName(loserText);
      
      // Check if loser matches posting team or opponent
      if (normalized.toLowerCase() === postingTeam.toLowerCase() ||
          postingTeam.toLowerCase().includes(normalized.toLowerCase()) ||
          normalized.toLowerCase().includes(postingTeam.toLowerCase())) {
        return { winner: opponentTeam, loser: postingTeam };
      }
      
      if (normalized.toLowerCase() === opponentTeam.toLowerCase() ||
          opponentTeam.toLowerCase().includes(normalized.toLowerCase()) ||
          normalized.toLowerCase().includes(opponentTeam.toLowerCase())) {
        return { winner: postingTeam, loser: opponentTeam };
      }
    }
  }
  
  return null;
}

/**
 * Parse activity booster message
 */
export function parseActivityBoosterMessage(message: Message): ParsedActivityBooster | null {
  try {
    // Get posting team from Discord role
    const postingTeam = getTeamFromRoles(message);
    if (!postingTeam) {
      console.log(`[AB Parser] Could not determine posting team for message ${message.id}`);
      return null;
    }
    
    const content = message.content;
    
    // Extract opponent team
    const opponentTeam = extractOpponentTeam(content, postingTeam);
    if (!opponentTeam) {
      console.log(`[AB Parser] Could not find opponent team in message ${message.id}: "${content}"`);
      return null;
    }
    
    // Extract result
    const result = extractResult(content, postingTeam, opponentTeam);
    if (!result) {
      console.log(`[AB Parser] Could not determine result in message ${message.id}: "${content}"`);
      return null;
    }
    
    const postingTeamResult = result.winner === postingTeam ? 'W' : 'L';
    const opponentTeamResult = result.winner === opponentTeam ? 'W' : 'L';
    
    console.log(`[AB Parser] Parsed message ${message.id}: ${postingTeam} ${postingTeamResult} vs ${opponentTeam} ${opponentTeamResult}`);
    
    return {
      postingTeam,
      opponentTeam,
      postingTeamResult,
      opponentTeamResult,
      messageId: message.id,
      timestamp: message.createdAt,
      rawMessage: content,
    };
  } catch (error) {
    console.error(`[AB Parser] Error parsing message ${message.id}:`, error);
    return null;
  }
}
