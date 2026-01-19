/**
 * Trade Parser
 * 
 * Parses trade messages from Discord to extract:
 * - Teams involved
 * - Players being traded
 * - Movement direction (who goes where)
 * 
 * Handles various formats:
 * - "Team1 Sends: Player1, Player2 / Team2 Sends: Player3"
 * - Embed format with fields
 * - "@Team(nickname) Sends:" format
 */

import { logger } from '../services/logger';

// NBA team names for detection
const NBA_TEAMS = [
  '76ers', 'Sixers', 'Bucks', 'Bulls', 'Cavaliers', 'Cavs', 'Celtics', 'Grizzlies',
  'Hawks', 'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic',
  'Mavs', 'Mavericks', 'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons',
  'Raptors', 'Rockets', 'Spurs', 'Suns', 'Timberwolves', 'Wolves',
  'Trail Blazers', 'Blazers', 'Warriors', 'Wizards', 'Clippers', 'Thunder'
];

// Team name aliases for normalization
const TEAM_ALIASES: Record<string, string> = {
  '76ers': 'Sixers',
  'sixers': 'Sixers',
  'cavaliers': 'Cavaliers',
  'cavs': 'Cavaliers',
  'grizzlies': 'Grizzlies',
  'mavericks': 'Mavericks',
  'mavs': 'Mavericks',
  'timberwolves': 'Timberwolves',
  'wolves': 'Timberwolves',
  'trail blazers': 'Trail Blazers',
  'blazers': 'Trail Blazers',
  'trailblazers': 'Trail Blazers'
};

export interface ParsedPlayer {
  name: string;
  overall?: number;
  salary?: number;
}

export interface ParsedTrade {
  teams: string[];
  movements: Array<{
    playerName: string;
    fromTeam: string;
    toTeam: string;
  }>;
  rawTeamData?: Array<{
    name: string;
    players: ParsedPlayer[];
  }>;
}

class TradeParserClass {
  /**
   * Normalize team name to standard form
   */
  private normalizeTeamName(team: string): string {
    const lower = team.toLowerCase().trim();
    return TEAM_ALIASES[lower] || team.trim();
  }

  /**
   * Find teams in order of appearance in text
   */
  private findTeamsInOrder(text: string): string[] {
    const foundTeams: string[] = [];
    const matches: Array<{ team: string; index: number }> = [];

    for (const teamName of NBA_TEAMS) {
      // Match team names with word boundaries
      // Also handles @Team(nickname) format
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
      const normalized = this.normalizeTeamName(match.team);
      if (!foundTeams.includes(normalized)) {
        foundTeams.push(normalized);
      }
    }

    return foundTeams;
  }

  /**
   * Parse player list from text section
   * Handles formats like:
   * - "Player Name 81 (10)"
   * - "Player Name 81 (10 badges)"
   * - "Player Name: 81 (10)"
   */
  private parsePlayerList(text: string): ParsedPlayer[] {
    const players: ParsedPlayer[] = [];
    const lines = text.split(/[\n,]/).map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      // Skip total lines and metadata
      if (/^Total[:\s]/i.test(line) || /^[\d\-\/]+$/.test(line)) {
        continue;
      }

      // Skip Discord mentions and markdown
      if (/<@!?\d*>/.test(line) || /^\*+$/.test(line)) {
        continue;
      }

      // Remove bullet points and dashes
      let cleanLine = line.replace(/^[•\-\*]\s*/, '');

      // Pattern: "Player Name OVR (salary)" or "Player Name: OVR (salary)"
      const pattern = /^([A-Za-z\s\-'\.]+?)\s*:?\s*(\d+)\s*\(?\s*(\d+)\s*(?:badges)?\)?$/;
      const match = cleanLine.match(pattern);

      if (match) {
        const playerName = match[1].trim();
        const overall = parseInt(match[2]);
        const salary = parseInt(match[3]);

        // Validate player name
        if (playerName && playerName !== '--' && !/^\d+$/.test(playerName)) {
          players.push({ name: playerName, overall, salary });
          logger.debug(`Parsed player: ${playerName} (${overall} OVR)`);
        }
      } else {
        // Try simpler pattern: just player name
        const simplePattern = /^([A-Za-z\s\-'\.]+)$/;
        const simpleMatch = cleanLine.match(simplePattern);
        if (simpleMatch) {
          const playerName = simpleMatch[1].trim();
          if (playerName && playerName.length > 2 && !/^\d+$/.test(playerName)) {
            players.push({ name: playerName });
            logger.debug(`Parsed player (simple): ${playerName}`);
          }
        }
      }
    }

    return players;
  }

  /**
   * Parse trade from text content
   */
  parse(text: string): ParsedTrade | null {
    if (!text || text.trim().length === 0) {
      return null;
    }

    logger.debug('Parsing trade text:', text.substring(0, 200));

    // Find teams in order of appearance
    const foundTeams = this.findTeamsInOrder(text);

    if (foundTeams.length < 2) {
      logger.debug('Could not find at least 2 teams');
      return null;
    }

    logger.info(`Teams found: ${foundTeams.join(', ')}`);

    const team1 = foundTeams[0];
    const team2 = foundTeams[1];

    // Build regex patterns for "Team Sends:" format
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const team1Escaped = escapeRegex(team1);
    const team2Escaped = escapeRegex(team2);

    // Pattern for team1: capture until team2's section
    const team1SendPattern = new RegExp(
      `(?:@?\\*{0,2}${team1Escaped}(?:\\([^)]*\\))?\\s+sends?\\*{0,2}\\s*:|\\*{0,2}${team1Escaped}\\s+sends?\\*{0,2}\\s*:)\\s*([^]*?)(?=@?\\*{0,2}${team2Escaped}(?:\\([^)]*\\))?\\s+sends?|$)`,
      'is'
    );

    // Pattern for team2: capture until end
    const team2SendPattern = new RegExp(
      `(?:@?\\*{0,2}${team2Escaped}(?:\\([^)]*\\))?\\s+sends?\\*{0,2}\\s*:|\\*{0,2}${team2Escaped}\\s+sends?\\*{0,2}\\s*:)\\s*([^]*?)$`,
      'is'
    );

    const team1Match = text.match(team1SendPattern);
    const team2Match = text.match(team2SendPattern);

    if (team1Match && team2Match) {
      const team1Players = this.parsePlayerList(team1Match[1]);
      const team2Players = this.parsePlayerList(team2Match[1]);

      if (team1Players.length > 0 && team2Players.length > 0) {
        logger.info(`Parsed trade: ${team1} (${team1Players.length} players) ↔ ${team2} (${team2Players.length} players)`);

        // Build movements: team1 sends to team2, team2 sends to team1
        const movements: ParsedTrade['movements'] = [];

        for (const player of team1Players) {
          movements.push({
            playerName: player.name,
            fromTeam: team1,
            toTeam: team2,
          });
        }

        for (const player of team2Players) {
          movements.push({
            playerName: player.name,
            fromTeam: team2,
            toTeam: team1,
          });
        }

        return {
          teams: [team1, team2],
          movements,
          rawTeamData: [
            { name: team1, players: team1Players },
            { name: team2, players: team2Players },
          ],
        };
      }
    }

    // Fallback: try to find any players in the text
    logger.debug('Standard format failed, trying fallback...');
    const allPlayers = this.parsePlayerList(text);

    if (allPlayers.length >= 2) {
      // Split players between teams (rough heuristic)
      const midpoint = Math.floor(allPlayers.length / 2);
      const team1Players = allPlayers.slice(0, midpoint);
      const team2Players = allPlayers.slice(midpoint);

      const movements: ParsedTrade['movements'] = [];

      for (const player of team1Players) {
        movements.push({
          playerName: player.name,
          fromTeam: team1,
          toTeam: team2,
        });
      }

      for (const player of team2Players) {
        movements.push({
          playerName: player.name,
          fromTeam: team2,
          toTeam: team1,
        });
      }

      return {
        teams: [team1, team2],
        movements,
        rawTeamData: [
          { name: team1, players: team1Players },
          { name: team2, players: team2Players },
        ],
      };
    }

    logger.warn('Could not parse trade from text');
    return null;
  }
}

// Export singleton
export const TradeParser = new TradeParserClass();
