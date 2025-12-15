/**
 * NBA Team Color Mappings
 * Primary and secondary colors for all 30 NBA teams
 */

export interface TeamColors {
  primary: string;
  secondary: string;
  accent?: string;
}

export const TEAM_COLORS: Record<string, TeamColors> = {
  // Atlantic Division
  'Celtics': { primary: '#007A33', secondary: '#BA9653' },
  'Nets': { primary: '#000000', secondary: '#FFFFFF' },
  'Knicks': { primary: '#006BB6', secondary: '#F58426' },
  'Sixers': { primary: '#006BB6', secondary: '#ED174C' },
  'Raptors': { primary: '#CE1141', secondary: '#000000' },
  
  // Central Division
  'Bulls': { primary: '#CE1141', secondary: '#000000' },
  'Cavaliers': { primary: '#860038', secondary: '#FDBB30' },
  'Pistons': { primary: '#C8102E', secondary: '#1D42BA' },
  'Pacers': { primary: '#002D62', secondary: '#FDBB30' },
  'Bucks': { primary: '#00471B', secondary: '#EEE1C6' },
  
  // Southeast Division
  'Hawks': { primary: '#E03A3E', secondary: '#C1D32F' },
  'Hornets': { primary: '#1D1160', secondary: '#00788C' },
  'Heat': { primary: '#98002E', secondary: '#F9A01B' },
  'Magic': { primary: '#0077C0', secondary: '#C4CED4' },
  'Wizards': { primary: '#002B5C', secondary: '#E31837' },
  
  // Northwest Division
  'Nuggets': { primary: '#0E2240', secondary: '#FEC524' },
  'Timberwolves': { primary: '#0C2340', secondary: '#236192' },
  'Thunder': { primary: '#007AC1', secondary: '#EF3B24' },
  'Trail Blazers': { primary: '#E03A3E', secondary: '#000000' },
  'Jazz': { primary: '#002B5C', secondary: '#00471B' },
  
  // Pacific Division
  'Warriors': { primary: '#1D428A', secondary: '#FFC72C' },
  'Clippers': { primary: '#C8102E', secondary: '#1D428A' },
  'Lakers': { primary: '#552583', secondary: '#FDB927' },
  'Suns': { primary: '#1D1160', secondary: '#E56020' },
  'Kings': { primary: '#5A2D81', secondary: '#63727A' },
  
  // Southwest Division
  'Mavericks': { primary: '#00538C', secondary: '#002B5E' },
  'Rockets': { primary: '#CE1141', secondary: '#000000' },
  'Grizzlies': { primary: '#5D76A9', secondary: '#12173F' },
  'Pelicans': { primary: '#0C2340', secondary: '#C8102E' },
  'Spurs': { primary: '#C4CED4', secondary: '#000000' },
  
  // Alternate team names
  'Mavs': { primary: '#00538C', secondary: '#002B5E' },
  'Trailblazers': { primary: '#E03A3E', secondary: '#000000' },
};

/**
 * Get team colors for a given team name
 * Returns default colors if team not found
 */
export function getTeamColors(teamName: string): TeamColors {
  return TEAM_COLORS[teamName] || { primary: '#1e293b', secondary: '#0f172a' };
}

/**
 * Generate gradient background using team colors
 */
export function getTeamGradient(teamName: string): string {
  const colors = getTeamColors(teamName);
  return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
}

/**
 * Get contrasting text color based on background
 */
export function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
