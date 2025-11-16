/**
 * Valid NBA teams for the league (canonical names)
 */
export const VALID_TEAMS = [
  'Free Agents',
  'Bucks',
  'Bulls',
  'Cavaliers',
  'Celtics',
  'Grizzlies',
  'Hawks',
  'Heat',
  'Hornets',
  'Jazz',
  'Kings',
  'Knicks',
  'Lakers',
  'Magic',
  'Mavs',
  'Nets',
  'Nuggets',
  'Pacers',
  'Pelicans',
  'Pistons',
  'Raptors',
  'Rockets',
  'Sixers',
  'Spurs',
  'Suns',
  'Timberwolves',
  'Trail Blazers',
  'Warriors',
  'Wizards',
] as const;

export type ValidTeam = typeof VALID_TEAMS[number];

/**
 * Team name aliases mapping to canonical names
 */
const TEAM_ALIASES: Record<string, ValidTeam> = {
  // 76ers / Sixers
  '76ers': 'Sixers',
  'seventy sixers': 'Sixers',
  
  // Mavericks
  'mavericks': 'Mavs',
  'Mavericks': 'Mavs',
  'dallas': 'Mavs',
  
  // Trail Blazers
  'trailblazers': 'Trail Blazers',
  'blazers': 'Trail Blazers',
  'portland': 'Trail Blazers',
  
  
  // Timberwolves
  'wolves': 'Timberwolves',
  'twolves': 'Timberwolves',
  't-wolves': 'Timberwolves',
  
  // Other common aliases
  'gsw': 'Warriors',
  'golden state': 'Warriors',
  'la lakers': 'Lakers',
  'philly': 'Sixers',
  'philadelphia': 'Sixers',
  'san antonio': 'Spurs',
  'new york': 'Knicks',
  'brooklyn': 'Nets',
  'milwaukee': 'Bucks',
  'miami': 'Heat',
  'boston': 'Celtics',
  'chicago': 'Bulls',
  'cleveland': 'Cavaliers',
  'detroit': 'Pistons',
  'indiana': 'Pacers',
  'charlotte': 'Hornets',
  'atlanta': 'Hawks',
  'orlando': 'Magic',
  'washington': 'Wizards',
  'toronto': 'Raptors',
  'memphis': 'Grizzlies',
  'houston': 'Rockets',
  'new orleans': 'Pelicans',
  'sacramento': 'Kings',
  'phoenix': 'Suns',
  'utah': 'Jazz',
  'denver': 'Nuggets',
  'minnesota': 'Timberwolves',
  
  // Free Agents aliases
  'fa': 'Free Agents',
  'free agent': 'Free Agents',
  'freeagents': 'Free Agents',
};

/**
 * Check if a team name is valid (including aliases)
 */
export function isValidTeam(team: string | null | undefined): boolean {
  if (!team) return false;
  const normalized = team.trim().toLowerCase();
  
  // Check canonical names
  const isCanonical = VALID_TEAMS.some(t => t.toLowerCase() === normalized);
  if (isCanonical) return true;
  
  // Check aliases
  return normalized in TEAM_ALIASES;
}

/**
 * Validate and normalize team name (case-insensitive, handles aliases)
 * Returns the canonical team name or null if invalid
 */
export function validateTeamName(team: string | null | undefined): ValidTeam | null {
  if (!team) return null;
  
  const normalized = team.trim().toLowerCase();
  
  // Check canonical names first
  const canonical = VALID_TEAMS.find(
    validTeam => validTeam.toLowerCase() === normalized
  );
  if (canonical) return canonical;
  
  // Check aliases
  const aliasMatch = TEAM_ALIASES[normalized];
  if (aliasMatch) return aliasMatch;
  
  return null;
}

/**
 * Get all valid team names (canonical only, no aliases)
 */
export function getAllTeams(): readonly ValidTeam[] {
  return VALID_TEAMS;
}
