// Season 18 Standings - Updated Jan 31, 2026
// This file will be updated as the season progresses

export interface Standing {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  pct: number;
  gp: number;
  hofScr: number;
}

// Initial standings - all teams start at 0-0
// Rankings based on Season 17 final standings as starting point
export const season18Standings: Standing[] = [
  { rank: 1, team: "Toronto Raptors", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 2, team: "Atlanta Hawks", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 3, team: "Sacramento Kings", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 4, team: "Washington Wizards", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 5, team: "Houston Rockets", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 6, team: "Detroit Pistons", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 7, team: "Denver Nuggets", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 8, team: "San Antonio Spurs", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 9, team: "Milwaukee Bucks", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 10, team: "Utah Jazz", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 11, team: "Dallas Mavericks", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 12, team: "Cleveland Cavaliers", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 13, team: "Portland Trail Blazers", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 14, team: "Chicago Bulls", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 15, team: "Charlotte Hornets", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 16, team: "Indiana Pacers", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 17, team: "Los Angeles Lakers", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 18, team: "Philadelphia Sixers", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 19, team: "Golden State Warriors", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 20, team: "Orlando Magic", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 21, team: "Boston Celtics", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 22, team: "Miami Heat", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 23, team: "Minnesota Timberwolves", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 24, team: "Brooklyn Nets", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 25, team: "New Orleans Pelicans", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 26, team: "New York Knicks", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 27, team: "Memphis Grizzlies", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
  { rank: 28, team: "Phoenix Suns", wins: 0, losses: 0, pct: 0.000, gp: 0, hofScr: 0.0 },
];

// Game recaps for Season 18
export interface GameRecap {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  headline: string;
  topPerformer?: {
    player: string;
    team: string;
    stats: string;
  };
  highlightImage?: string;
}

// Game recaps will be added as the season progresses
export const season18GameRecaps: GameRecap[] = [];
