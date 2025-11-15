/**
 * Valid NBA teams for the league
 */
export const VALID_TEAMS = [
  'Free Agents',
  '76ers',
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
  'Spurs',
  'Suns',
  'Timberwolves',
  'Trailblazers',
  'Warriors',
  'Wizards',
] as const;

export type ValidTeam = typeof VALID_TEAMS[number];

/**
 * Check if a team name is valid
 */
export function isValidTeam(team: string | null | undefined): team is ValidTeam {
  if (!team) return false;
  return VALID_TEAMS.includes(team as ValidTeam);
}

/**
 * Validate and normalize team name (case-insensitive)
 * Returns the properly cased team name or null if invalid
 */
export function validateTeamName(team: string | null | undefined): ValidTeam | null {
  if (!team) return null;
  
  const normalized = team.trim();
  const found = VALID_TEAMS.find(
    validTeam => validTeam.toLowerCase() === normalized.toLowerCase()
  );
  
  return found || null;
}
