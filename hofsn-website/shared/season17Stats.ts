// Season 17 Final Statistics - Top 10 Leaders

export interface StatLeader {
  rank: number;
  player: string;
  team: string;
  gp: number;
  value: number | string;
  total?: number;
}

export interface Top10Category {
  id: string;
  title: string;
  subtitle: string;
  statLabel: string;
  leaders: StatLeader[];
}

export const season17Top10Stats: Top10Category[] = [
  {
    id: "ppg",
    title: "Points Per Game",
    subtitle: "Season 17 Scoring Leaders",
    statLabel: "PPG",
    leaders: [
      { rank: 1, player: "Brandon Ingram", team: "Pistons", gp: 64, value: 38.80, total: 2483 },
      { rank: 2, player: "Jayson Tatum", team: "Raptors", gp: 72, value: 37.25, total: 2682 },
      { rank: 3, player: "Steph Curry", team: "Nuggets", gp: 61, value: 37.11, total: 2264 },
      { rank: 4, player: "Jalen Suggs", team: "Wizards", gp: 71, value: 35.80, total: 2542 },
      { rank: 5, player: "Jalen Johnson", team: "Hawks", gp: 71, value: 34.34, total: 2438 },
      { rank: 6, player: "Kevin Durant", team: "Celtics", gp: 46, value: 32.13, total: 1478 },
      { rank: 7, player: "James Harden", team: "Jazz", gp: 55, value: 28.35, total: 1559 },
      { rank: 8, player: "LeBron James", team: "Trail Blazers", gp: 65, value: 27.98, total: 1819 },
      { rank: 9, player: "De'Aaron Fox", team: "Kings", gp: 61, value: 26.54, total: 1619 },
      { rank: 10, player: "Shai Gilgeous-Alexander", team: "Cavaliers", gp: 71, value: 25.72, total: 1826 }
    ]
  },
  {
    id: "rpg",
    title: "Rebounds Per Game",
    subtitle: "Season 17 Rebounding Leaders",
    statLabel: "RPG",
    leaders: [
      { rank: 1, player: "Giannis Antetokounmpo", team: "Lakers", gp: 43, value: 10.88, total: 468 },
      { rank: 2, player: "Nicolas Claxton", team: "Jazz", gp: 54, value: 9.26, total: 500 },
      { rank: 3, player: "Onyeka Okongwu", team: "Kings", gp: 61, value: 8.93, total: 545 },
      { rank: 4, player: "Anthony Davis", team: "Pacers", gp: 45, value: 8.40, total: 378 },
      { rank: 5, player: "Ivica Zubac", team: "Knicks", gp: 61, value: 8.26, total: 504 },
      { rank: 6, player: "Donovan Clingan", team: "Bulls", gp: 48, value: 8.15, total: 391 },
      { rank: 7, player: "Jarrett Allen", team: "Wizards", gp: 81, value: 8.06, total: 653 },
      { rank: 8, player: "Karl-Anthony Towns", team: "Pacers", gp: 57, value: 8.04, total: 458 },
      { rank: 9, player: "Yves Missi", team: "Bucks", gp: 57, value: 7.91, total: 451 },
      { rank: 10, player: "Chet Holmgren", team: "Warriors", gp: 42, value: 7.90, total: 332 }
    ]
  },
  {
    id: "apg",
    title: "Assists Per Game",
    subtitle: "Season 17 Playmaking Leaders",
    statLabel: "APG",
    leaders: [
      { rank: 1, player: "Cade Cunningham", team: "Warriors", gp: 42, value: 8.26, total: 347 },
      { rank: 2, player: "De'Aaron Fox", team: "Kings", gp: 61, value: 8.21, total: 501 },
      { rank: 3, player: "LaMelo Ball", team: "Hornets", gp: 47, value: 6.15, total: 289 },
      { rank: 4, player: "Steph Curry", team: "Nuggets", gp: 61, value: 6.08, total: 371 },
      { rank: 5, player: "Lonzo Ball", team: "Mavs", gp: 59, value: 5.92, total: 349 },
      { rank: 6, player: "Luka Dončić", team: "Bulls", gp: 48, value: 5.83, total: 280 },
      { rank: 7, player: "Giannis Antetokounmpo", team: "Lakers", gp: 43, value: 5.53, total: 238 },
      { rank: 8, player: "James Harden", team: "Jazz", gp: 55, value: 5.40, total: 297 },
      { rank: 9, player: "Darius Garland", team: "Trail Blazers", gp: 53, value: 4.98, total: 264 },
      { rank: 10, player: "Jayson Tatum", team: "Raptors", gp: 72, value: 4.97, total: 358 }
    ]
  },
  {
    id: "spg",
    title: "Steals Per Game",
    subtitle: "Season 17 Defensive Playmakers",
    statLabel: "SPG",
    leaders: [
      { rank: 1, player: "OG Anunoby", team: "Raptors", gp: 72, value: 2.50, total: 180 },
      { rank: 2, player: "Keon Ellis", team: "Pistons", gp: 67, value: 2.30, total: 154 },
      { rank: 3, player: "De'Aaron Fox", team: "Kings", gp: 61, value: 2.25, total: 137 },
      { rank: 4, player: "Cason Wallace", team: "Mavs", gp: 64, value: 2.14, total: 137 },
      { rank: 5, player: "Giannis Antetokounmpo", team: "Lakers", gp: 43, value: 2.09, total: 90 },
      { rank: 6, player: "Jalen Suggs", team: "Wizards", gp: 71, value: 2.07, total: 147 },
      { rank: 7, player: "Shai Gilgeous-Alexander", team: "Cavaliers", gp: 71, value: 2.07, total: 147 },
      { rank: 8, player: "Jalen Williams", team: "Warriors", gp: 42, value: 1.86, total: 78 },
      { rank: 9, player: "Ausar Thompson", team: "Knicks", gp: 42, value: 1.79, total: 75 },
      { rank: 10, player: "Derrick White", team: "Lakers", gp: 42, value: 1.76, total: 74 }
    ]
  },
  {
    id: "bpg",
    title: "Blocks Per Game",
    subtitle: "Season 17 Rim Protectors",
    statLabel: "BPG",
    leaders: [
      { rank: 1, player: "Nicolas Claxton", team: "Jazz", gp: 54, value: 1.56, total: 84 },
      { rank: 2, player: "Anthony Davis", team: "Pacers", gp: 45, value: 1.51, total: 68 },
      { rank: 3, player: "Myles Turner", team: "Lakers", gp: 41, value: 1.32, total: 54 },
      { rank: 4, player: "Chet Holmgren", team: "Warriors", gp: 42, value: 1.31, total: 55 },
      { rank: 5, player: "Brook Lopez", team: "Nuggets", gp: 59, value: 1.17, total: 69 },
      { rank: 6, player: "Daniel Gafford", team: "Sixers", gp: 44, value: 1.16, total: 51 },
      { rank: 7, player: "Robert Williams III", team: "Hornets", gp: 46, value: 1.09, total: 50 },
      { rank: 8, player: "Yves Missi", team: "Bucks", gp: 57, value: 1.02, total: 58 },
      { rank: 9, player: "Donovan Clingan", team: "Bulls", gp: 48, value: 0.94, total: 45 },
      { rank: 10, player: "Kristaps Porzingis", team: "Rockets", gp: 70, value: 0.89, total: 62 }
    ]
  },
  {
    id: "opp-fg",
    title: "Opponent Field Goal %",
    subtitle: "Season 17 Perimeter Defenders",
    statLabel: "Opp FG%",
    leaders: [
      { rank: 1, player: "Jalen Suggs", team: "Wizards", gp: 71, value: "43.97%", total: 746 },
      { rank: 2, player: "OG Anunoby", team: "Raptors", gp: 72, value: "47.04%", total: 793 },
      { rank: 3, player: "P.J. Washington", team: "Mavs", gp: 57, value: "47.96%", total: 417 },
      { rank: 4, player: "Anthony Davis", team: "Pacers", gp: 45, value: "48.48%", total: 462 },
      { rank: 5, player: "Marcus Smart", team: "Nuggets", gp: 59, value: "48.73%", total: 474 },
      { rank: 6, player: "Kristaps Porzingis", team: "Rockets", gp: 70, value: "48.93%", total: 560 },
      { rank: 7, player: "Alex Caruso", team: "Wizards", gp: 74, value: "49.21%", total: 504 },
      { rank: 8, player: "Lonzo Ball", team: "Mavs", gp: 59, value: "49.29%", total: 566 },
      { rank: 9, player: "Cason Wallace", team: "Mavs", gp: 64, value: "49.68%", total: 616 },
      { rank: 10, player: "Keon Ellis", team: "Pistons", gp: 67, value: "50.07%", total: 713 }
    ]
  },
  {
    id: "dis",
    title: "Defensive Impact Score",
    subtitle: "Season 17 Elite Defenders",
    statLabel: "DIS",
    leaders: [
      { rank: 1, player: "OG Anunoby", team: "Raptors", gp: 72, value: 90.51 },
      { rank: 2, player: "Jalen Suggs", team: "Wizards", gp: 71, value: 88.00 },
      { rank: 3, player: "Cason Wallace", team: "Mavs", gp: 64, value: 76.66 },
      { rank: 4, player: "Kristaps Porzingis", team: "Rockets", gp: 70, value: 73.33 },
      { rank: 5, player: "Alex Caruso", team: "Wizards", gp: 74, value: 71.14 },
      { rank: 6, player: "Lonzo Ball", team: "Mavs", gp: 59, value: 71.07 },
      { rank: 7, player: "Anthony Davis", team: "Pacers", gp: 45, value: 70.00 },
      { rank: 8, player: "Marcus Smart", team: "Nuggets", gp: 59, value: 67.23 },
      { rank: 9, player: "P.J. Washington", team: "Mavs", gp: 57, value: 61.99 },
      { rank: 10, player: "Pascal Siakam", team: "Hornets", gp: 42, value: 59.61 }
    ]
  }
];
