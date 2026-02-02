export interface TeamStanding {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  pct: string;
  gb: string;
  streak: string;
  ppg: number;
  papg: number;
  diff: number;
}

export const season17Standings: TeamStanding[] = [
  { rank: 1, team: "Toronto Raptors", wins: 15, losses: 1, pct: ".938", gb: "--", streak: "W15", ppg: 107.8, papg: 89.5, diff: 18.3 },
  { rank: 2, team: "Washington Wizards", wins: 9, losses: 1, pct: ".900", gb: "3.0", streak: "W7", ppg: 98.7, papg: 83.0, diff: 15.7 },
  { rank: 3, team: "Denver Nuggets", wins: 8, losses: 1, pct: ".889", gb: "3.5", streak: "W6", ppg: 110.0, papg: 91.7, diff: 18.3 },
  { rank: 4, team: "San Antonio Spurs", wins: 8, losses: 4, pct: ".667", gb: "5.0", streak: "L1", ppg: 103.4, papg: 99.3, diff: 4.1 },
  { rank: 5, team: "Detroit Pistons", wins: 5, losses: 1, pct: ".833", gb: "5.0", streak: "W4", ppg: 96.7, papg: 89.8, diff: 6.8 },
  { rank: 6, team: "Houston Rockets", wins: 4, losses: 1, pct: ".800", gb: "5.5", streak: "W3", ppg: 97.2, papg: 86.6, diff: 10.6 },
  { rank: 7, team: "Atlanta Hawks", wins: 7, losses: 5, pct: ".583", gb: "6.0", streak: "W2", ppg: 84.8, papg: 79.0, diff: 5.7 },
  { rank: 8, team: "Dallas Mavericks", wins: 4, losses: 2, pct: ".667", gb: "6.0", streak: "W2", ppg: 92.7, papg: 94.7, diff: -2.0 },
  { rank: 9, team: "Charlotte Hornets", wins: 2, losses: 1, pct: ".667", gb: "6.5", streak: "W1", ppg: 93.3, papg: 90.0, diff: 3.3 },
  { rank: 10, team: "Brooklyn Nets", wins: 4, losses: 4, pct: ".500", gb: "7.0", streak: "L1", ppg: 89.6, papg: 88.2, diff: 1.4 },
  { rank: 11, team: "Memphis Grizzlies", wins: 0, losses: 0, pct: ".000", gb: "7.0", streak: "N/A", ppg: 0.0, papg: 0.0, diff: 0.0 },
  { rank: 12, team: "Miami Heat", wins: 0, losses: 0, pct: ".000", gb: "7.0", streak: "N/A", ppg: 0.0, papg: 0.0, diff: 0.0 },
  { rank: 13, team: "Golden State Warriors", wins: 1, losses: 2, pct: ".333", gb: "7.5", streak: "L1", ppg: 83.3, papg: 83.7, diff: -0.3 },
  { rank: 14, team: "Phoenix Suns", wins: 0, losses: 1, pct: ".000", gb: "7.5", streak: "L1", ppg: 85.0, papg: 131.0, diff: -46.0 },
  { rank: 15, team: "Portland Trail Blazers", wins: 2, losses: 4, pct: ".333", gb: "8.0", streak: "L1", ppg: 92.8, papg: 100.2, diff: -7.3 },
  { rank: 16, team: "Utah Jazz", wins: 1, losses: 3, pct: ".250", gb: "8.0", streak: "L2", ppg: 91.5, papg: 107.3, diff: -15.7 },
  { rank: 17, team: "Cleveland Cavaliers", wins: 1, losses: 3, pct: ".250", gb: "8.0", streak: "L1", ppg: 81.3, papg: 87.3, diff: -6.0 },
  { rank: 18, team: "Boston Celtics", wins: 0, losses: 2, pct: ".000", gb: "8.0", streak: "L2", ppg: 81.0, papg: 87.5, diff: -6.5 },
  { rank: 19, team: "Los Angeles Lakers", wins: 0, losses: 2, pct: ".000", gb: "8.0", streak: "L2", ppg: 86.5, papg: 100.0, diff: -14.5 },
  { rank: 20, team: "Minnesota Timberwolves", wins: 0, losses: 2, pct: ".000", gb: "8.0", streak: "L2", ppg: 68.0, papg: 98.5, diff: -30.5 },
  { rank: 21, team: "New Orleans Pelicans", wins: 0, losses: 2, pct: ".000", gb: "8.0", streak: "L2", ppg: 94.0, papg: 140.5, diff: -46.5 },
  { rank: 22, team: "Milwaukee Bucks", wins: 2, losses: 5, pct: ".286", gb: "8.5", streak: "L1", ppg: 87.9, papg: 89.0, diff: -1.1 },
  { rank: 23, team: "Philadelphia 76ers", wins: 0, losses: 3, pct: ".000", gb: "8.5", streak: "L3", ppg: 121.7, papg: 133.3, diff: -11.7 },
  { rank: 24, team: "Sacramento Kings", wins: 2, losses: 6, pct: ".250", gb: "9.0", streak: "L2", ppg: 84.5, papg: 90.1, diff: -5.6 },
  { rank: 25, team: "Indiana Pacers", wins: 1, losses: 5, pct: ".167", gb: "9.0", streak: "L3", ppg: 91.8, papg: 101.2, diff: -9.3 },
  { rank: 26, team: "New York Knicks", wins: 1, losses: 5, pct: ".167", gb: "9.0", streak: "L4", ppg: 81.2, papg: 97.8, diff: -16.7 },
  { rank: 27, team: "Chicago Bulls", wins: 0, losses: 5, pct: ".000", gb: "9.5", streak: "L5", ppg: 65.0, papg: 94.2, diff: -29.2 },
  { rank: 28, team: "Orlando Magic", wins: 1, losses: 7, pct: ".125", gb: "10.0", streak: "L6", ppg: 85.1, papg: 94.1, diff: -9.0 },
  { rank: 29, team: "Oklahoma City Thunder", wins: 0, losses: 0, pct: ".000", gb: "7.0", streak: "N/A", ppg: 0.0, papg: 0.0, diff: 0.0 },
];
