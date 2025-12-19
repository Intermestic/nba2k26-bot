export interface ParsedPlayer {
  name: string;
  rating: number;
  badges: number;
}

export interface ParsedTeamTrade {
  teamName: string;
  sends: ParsedPlayer[];
  receives: ParsedPlayer[];
  sendsTotalRating: number;
  sendsTotalBadges: number;
  receivesTotalRating: number;
  receivesTotalBadges: number;
}

export interface ParsedTrade {
  teams: ParsedTeamTrade[];
  isValid: boolean;
  errors: string[];
}

/**
 * Parse a player line like "Ausar Thompson 82 (13)" or "Jaden McDaniels 83 (15)"
 * Returns { name, rating, badges } or null if invalid
 */
function parsePlayerLine(line: string): ParsedPlayer | null {
  // Trim whitespace
  line = line.trim();
  
  // Pattern: "Player Name Rating (Badges)"
  // Example: "Ausar Thompson 82 (13)"
  const match = line.match(/^(.+?)\s+(\d+)\s+\((\d+)\)$/);
  
  if (!match) {
    return null;
  }
  
  const [, name, ratingStr, badgesStr] = match;
  
  return {
    name: name.trim(),
    rating: parseInt(ratingStr, 10),
    badges: parseInt(badgesStr, 10),
  };
}

/**
 * Parse the entire trade text
 * Format:
 * **Team Name Sends/Receives**
 * Player1 Rating (Badges) / Player2 Rating (Badges)
 * --
 * Total Rating (Total Badges) / Total Rating (Total Badges)
 */
export function parseTrade(tradeText: string): ParsedTrade {
  const result: ParsedTrade = {
    teams: [],
    isValid: true,
    errors: [],
  };
  
  if (!tradeText || !tradeText.trim()) {
    result.isValid = false;
    result.errors.push('Trade text is empty');
    return result;
  }
  
  // Split by lines
  const lines = tradeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentTeam: ParsedTeamTrade | null = null;
  let inPlayerSection = false;
  
  for (const line of lines) {
    // Check for team header: **Team Name Sends/Receives:**
    const teamHeaderMatch = line.match(/^\*\*(.+?)\s+Sends\s*\/\s*Receives:?\*\*$/i);
    
    if (teamHeaderMatch) {
      // Save previous team if exists
      if (currentTeam) {
        result.teams.push(currentTeam);
      }
      
      // Start new team
      currentTeam = {
        teamName: teamHeaderMatch[1].trim(),
        sends: [],
        receives: [],
        sendsTotalRating: 0,
        sendsTotalBadges: 0,
        receivesTotalRating: 0,
        receivesTotalBadges: 0,
      };
      inPlayerSection = true;
      continue;
    }
    
    // Check for separator line (--) which indicates end of player section
    if (line === '--' || line.startsWith('--')) {
      inPlayerSection = false;
      continue;
    }
    
    // Check for total line: "235 (27) / 227 (20)"
    const totalMatch = line.match(/^(\d+)\s+\((\d+)\)\s*\/\s*(\d+)\s+\((\d+)\)$/);
    if (totalMatch && currentTeam) {
      currentTeam.sendsTotalRating = parseInt(totalMatch[1], 10);
      currentTeam.sendsTotalBadges = parseInt(totalMatch[2], 10);
      currentTeam.receivesTotalRating = parseInt(totalMatch[3], 10);
      currentTeam.receivesTotalBadges = parseInt(totalMatch[4], 10);
      continue;
    }
    
    // Parse player line: "Player1 Rating (Badges) / Player2 Rating (Badges)"
    if (inPlayerSection && currentTeam && line.includes('/')) {
      const [sendsPart, receivesPart] = line.split('/').map(s => s.trim());
      
      const sendsPlayer = parsePlayerLine(sendsPart);
      const receivesPlayer = parsePlayerLine(receivesPart);
      
      if (sendsPlayer) {
        currentTeam.sends.push(sendsPlayer);
      } else if (sendsPart) {
        result.errors.push(`Could not parse sends player: "${sendsPart}"`);
      }
      
      if (receivesPlayer) {
        currentTeam.receives.push(receivesPlayer);
      } else if (receivesPart) {
        result.errors.push(`Could not parse receives player: "${receivesPart}"`);
      }
    }
  }
  
  // Save last team
  if (currentTeam) {
    result.teams.push(currentTeam);
  }
  
  // Validate
  if (result.teams.length === 0) {
    result.isValid = false;
    result.errors.push('No teams found in trade text');
  }
  
  // Check if any team has no players
  for (const team of result.teams) {
    if (team.sends.length === 0 && team.receives.length === 0) {
      result.isValid = false;
      result.errors.push(`Team "${team.teamName}" has no players`);
    }
  }
  
  if (result.errors.length > 0) {
    result.isValid = false;
  }
  
  return result;
}
