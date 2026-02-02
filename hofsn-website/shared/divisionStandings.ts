// Season 17 Division Standings

export interface TeamStanding {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  pct: number;
  gb: string;
}

export interface DivisionStandings {
  name: string;
  teams: TeamStanding[];
}

export const season17DivisionStandings: DivisionStandings[] = [
  {
    name: "Atlantic Division",
    teams: [
      { rank: 1, team: "Toronto Raptors", wins: 38, losses: 7, pct: 0.844, gb: "—" },
      { rank: 2, team: "Washington Wizards", wins: 28, losses: 9, pct: 0.757, gb: "6.0" },
      { rank: 3, team: "San Antonio Spurs", wins: 22, losses: 13, pct: 0.629, gb: "11.0" },
      { rank: 4, team: "Brooklyn Nets", wins: 11, losses: 6, pct: 0.647, gb: "13.0" },
      { rank: 5, team: "Milwaukee Bucks", wins: 9, losses: 8, pct: 0.529, gb: "15.0" },
      { rank: 6, team: "Houston Rockets", wins: 14, losses: 20, pct: 0.412, gb: "18.5" },
      { rank: 7, team: "New Orleans Pelicans", wins: 0, losses: 5, pct: 0.000, gb: "18.0" }
    ]
  },
  {
    name: "Central Division",
    teams: [
      { rank: 1, team: "Detroit Pistons", wins: 34, losses: 4, pct: 0.895, gb: "0.5" },
      { rank: 2, team: "Denver Nuggets", wins: 21, losses: 2, pct: 0.913, gb: "6.0" },
      { rank: 3, team: "Atlanta Hawks", wins: 26, losses: 11, pct: 0.703, gb: "8.0" },
      { rank: 4, team: "Sacramento Kings", wins: 14, losses: 12, pct: 0.538, gb: "14.5" },
      { rank: 5, team: "Charlotte Hornets", wins: 9, losses: 11, pct: 0.450, gb: "16.5" },
      { rank: 6, team: "Dallas Mavericks", wins: 12, losses: 17, pct: 0.414, gb: "18.0" },
      { rank: 7, team: "Los Angeles Lakers", wins: 4, losses: 6, pct: 0.400, gb: "16.5" }
    ]
  },
  {
    name: "Midwest Division",
    teams: [
      { rank: 1, team: "Utah Jazz", wins: 12, losses: 16, pct: 0.429, gb: "17.5" },
      { rank: 2, team: "New York Knicks", wins: 4, losses: 8, pct: 0.333, gb: "17.5" },
      { rank: 3, team: "Philadelphia 76ers", wins: 4, losses: 13, pct: 0.235, gb: "20.0" },
      { rank: 4, team: "Memphis Grizzlies", wins: 4, losses: 10, pct: 0.286, gb: "18.5" },
      { rank: 5, team: "Portland Trail Blazers", wins: 4, losses: 17, pct: 0.190, gb: "22.0" },
      { rank: 6, team: "Boston Celtics", wins: 1, losses: 14, pct: 0.067, gb: "22.0" },
      { rank: 7, team: "Chicago Bulls", wins: 2, losses: 18, pct: 0.100, gb: "23.5" },
      { rank: 8, team: "Indiana Pacers", wins: 0, losses: 21, pct: 0.000, gb: "26.0" }
    ]
  },
  {
    name: "Pacific Division",
    teams: [
      { rank: 1, team: "Miami Heat", wins: 3, losses: 3, pct: 0.500, gb: "15.5" },
      { rank: 2, team: "Golden State Warriors", wins: 2, losses: 4, pct: 0.333, gb: "16.5" },
      { rank: 3, team: "Phoenix Suns", wins: 1, losses: 5, pct: 0.167, gb: "17.5" },
      { rank: 4, team: "Cleveland Cavaliers", wins: 5, losses: 11, pct: 0.312, gb: "18.5" },
      { rank: 5, team: "Minnesota Timberwolves", wins: 4, losses: 10, pct: 0.286, gb: "18.5" },
      { rank: 6, team: "Orlando Magic", wins: 2, losses: 9, pct: 0.182, gb: "19.0" }
    ]
  }
];
