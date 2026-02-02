// Player Profile Database
// Comprehensive career stats and biographical data for all players

export interface PlayerSeasonStats {
  season: number;
  team: string;
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
}

export interface PlayerAward {
  type: 'MVP' | 'DPOY' | '6MOY' | 'ROY' | 'All-Star' | 'All-NBA' | 'All-Defensive';
  season: number;
  description: string;
}

export interface PlayerProfile {
  name: string;
  team: string; // Current team
  position: string;
  height: string;
  weight: string;
  age?: number;
  college?: string;
  draft?: string;
  
  // Career stats
  careerStats: PlayerSeasonStats[];
  
  // Awards (legacy string format for backward compatibility)
  awards: string[];
  
  // Detailed awards with trophy images
  detailedAwards?: PlayerAward[];
  
  // Highlights
  highlights: string[];
}

// Player profiles for Season 17 top 10 statistical leaders
export const playerProfiles: Record<string, PlayerProfile> = {
  "Brandon Ingram": {
    name: "Brandon Ingram",
    team: "Detroit Pistons",
    position: "SF",
    height: "6'8\"",
    weight: "190 lbs",
    careerStats: [
      {
        season: 17,
        team: "Detroit Pistons",
        gp: 64,
        ppg: 38.80,
        rpg: 5.5,
        apg: 5.2,
        spg: 1.1,
        bpg: 0.6,
        fgPct: 60.7,
        threePct: 50.4,
        ftPct: 90.9
      }
    ],
    awards: ["Season 17 MVP"],
    detailedAwards: [
      { type: 'MVP', season: 17, description: 'Most Valuable Player - The Michael Jordan Trophy' }
    ],
    highlights: [
      "🏆 Season 17 MVP (47.4% of votes)",
      "Season 17 Scoring Leader (38.80 PPG)",
      "Elite efficiency: 60.7% FG, 50.4% 3P, 90.9% FT",
      "Led Pistons to playoff contention"
    ]
  },
  
  "Jayson Tatum": {
    name: "Jayson Tatum",
    team: "Toronto Raptors",
    position: "SF/PF",
    height: "6'8\"",
    weight: "210 lbs",
    careerStats: [
      {
        season: 17,
        team: "Toronto Raptors",
        gp: 72,
        ppg: 37.25,
        rpg: 8.2,
        apg: 4.8,
        spg: 1.3,
        bpg: 0.7,
        fgPct: 47.8,
        threePct: 37.2,
        ftPct: 87.1
      }
    ],
    awards: [],
    highlights: [
      "#2 in Season 17 scoring (37.25 PPG)",
      "2,682 total points in Season 17",
      "Led Raptors to #1 seed (103-23)"
    ]
  },
  
   "Steph Curry": {
    name: "Steph Curry",
    team: "Denver Nuggets",
    position: "PG",
    height: "6'2\"",
    weight: "185 lbs",
    careerStats: [
      {
        season: 17,
        team: "Denver Nuggets",
        gp: 61,
        ppg: 37.11,
        rpg: 5.1,
        apg: 6.8,
        spg: 1.5,
        bpg: 0.3,
        fgPct: 48.5,
        threePct: 44.2,
        ftPct: 91.0,
      },
    ],
    awards: ["Season 16 Co-MVP"],
    detailedAwards: [
      { type: 'MVP', season: 16, description: 'Co-MVP (with Luka Doncic)' },
    ],
    highlights: ["Season 17 PPG Leader (37.1)", "Elite three-point shooter", "Clutch performer"],
  },
  
  "Jalen Suggs": {
    name: "Jalen Suggs",
    team: "Washington Wizards",
    position: "PG/SG",
    height: "6'4\"",
    weight: "205 lbs",
    careerStats: [
      {
        season: 17,
        team: "Washington Wizards",
        gp: 71,
        ppg: 35.80,
        rpg: 4.2,
        apg: 5.5,
        spg: 2.07,
        bpg: 0.4,
        fgPct: 46.3,
        threePct: 51.9,
        ftPct: 83.7
      }
    ],
    awards: ["Season 17 DPOY", "Season 16 DPOY", "Season 13 MVP", "Season 13 DPOY"],
    detailedAwards: [
      { type: 'DPOY', season: 17, description: 'Defensive Player of the Year - The Hakeem Olajuwon Trophy (BACK-TO-BACK)' },
      { type: 'DPOY', season: 16, description: 'Defensive Player of the Year - The Hakeem Olajuwon Trophy' },
      { type: 'MVP', season: 13, description: 'Most Valuable Player' },
      { type: 'DPOY', season: 13, description: 'Defensive Player of the Year' }
    ],
    highlights: [
      "🔒 Season 17 DPOY - BACK-TO-BACK WINNER (52.6% of votes)",
      "3x DPOY (Seasons 17, 16, 13)",
      "Season 13 MVP",
      "DIS 88.00 | OppFG 43.97% | 2.07 SPG",
      "#4 in Season 17 scoring (35.80 PPG)",
      "Elite two-way superstar"
    ]
  },
  
  "Jalen Johnson": {
    name: "Jalen Johnson",
    team: "Atlanta Hawks",
    position: "PF",
    height: "6'9\"",
    weight: "220 lbs",
    careerStats: [
      {
        season: 17,
        team: "Atlanta Hawks",
        gp: 71,
        ppg: 34.34,
        rpg: 9.2,
        apg: 5.1,
        spg: 1.4,
        bpg: 0.9,
        fgPct: 51.2,
        threePct: 35.8,
        ftPct: 78.5
      }
    ],
    awards: [],
    highlights: [
      "#5 in Season 17 scoring (34.34 PPG)",
      "Top 10 in rebounds (9.2 RPG)",
      "Helped Hawks to #2 seed (83-30)"
    ]
  },
  
  "Kevin Durant": {
    name: "Kevin Durant",
    team: "Sacramento Kings",
    position: "PF",
    height: "6'10\"",
    weight: "240 lbs",
    careerStats: [
      {
        season: 17,
        team: "Sacramento Kings",
        gp: 68,
        ppg: 33.13,
        rpg: 7.1,
        apg: 5.3,
        spg: 1.0,
        bpg: 1.2,
        fgPct: 52.1,
        threePct: 40.2,
        ftPct: 89.3
      }
    ],
    awards: [],
    highlights: [
      "#6 in Season 17 scoring (33.13 PPG)",
      "Efficient scorer (52.1 FG%, 40.2 3P%)",
      "Helped Kings to #3 seed (75-49)"
    ]
  },
  
  "James Harden": {
    name: "James Harden",
    team: "Washington Wizards",
    position: "PG/SG",
    height: "6'5\"",
    weight: "220 lbs",
    careerStats: [
      {
        season: 17,
        team: "Washington Wizards",
        gp: 71,
        ppg: 32.80,
        rpg: 5.8,
        apg: 7.9,
        spg: 1.3,
        bpg: 0.5,
        fgPct: 45.7,
        threePct: 37.8,
        ftPct: 88.2
      }
    ],
    awards: [],
    highlights: [
      "#7 in Season 17 scoring (32.80 PPG)",
      "Elite playmaker (7.9 APG)",
      "Helped Wizards to #4 seed (84-24)"
    ]
  },
  
  "Luka Dončić": {
    name: "Luka Dončić",
    team: "Toronto Raptors",
    position: "PG/SG",
    height: "6'7\"",
    weight: "230 lbs",
    careerStats: [
      {
        season: 17,
        team: "Toronto Raptors",
        gp: 69,
        ppg: 32.42,
        rpg: 8.5,
        apg: 8.1,
        spg: 1.2,
        bpg: 0.4,
        fgPct: 48.2,
        threePct: 36.5,
        ftPct: 79.8
      }
    ],
    awards: ["Season 16 Co-MVP"],
    highlights: [
      "#8 in Season 17 scoring (32.42 PPG)",
      "Season 16 Co-MVP with Steph Curry",
      "Elite all-around player (8.5 RPG, 8.1 APG)"
    ]
  },
  
  "Shai Gilgeous-Alexander": {
    name: "Shai Gilgeous-Alexander",
    team: "San Antonio Spurs",
    position: "PG/SG",
    height: "6'6\"",
    weight: "195 lbs",
    careerStats: [
      {
        season: 17,
        team: "San Antonio Spurs",
        gp: 62,
        ppg: 31.95,
        rpg: 5.2,
        apg: 6.3,
        spg: 1.7,
        bpg: 0.8,
        fgPct: 50.3,
        threePct: 35.2,
        ftPct: 91.5
      }
    ],
    awards: [],
    highlights: [
      "#9 in Season 17 scoring (31.95 PPG)",
      "Efficient scorer (50.3 FG%)",
      "Led Spurs to playoffs (#8 seed)"
    ]
  },
  
  "LeBron James": {
    name: "LeBron James",
    team: "Miami Heat",
    position: "SF/PF",
    height: "6'9\"",
    weight: "250 lbs",
    careerStats: [
      {
        season: 17,
        team: "Miami Heat",
        gp: 58,
        ppg: 31.57,
        rpg: 7.8,
        apg: 7.2,
        spg: 1.1,
        bpg: 0.7,
        fgPct: 52.8,
        threePct: 38.9,
        ftPct: 75.3
      }
    ],
    awards: [],
    highlights: [
      "#10 in Season 17 scoring (31.57 PPG)",
      "Legendary all-around player",
      "Efficient veteran scorer (52.8 FG%)"
    ]
  },
  
  "Giannis Antetokounmpo": {
    name: "Giannis Antetokounmpo",
    team: "Milwaukee Bucks",
    position: "PF/C",
    height: "6'11\"",
    weight: "242 lbs",
    careerStats: [
      {
        season: 17,
        team: "Milwaukee Bucks",
        gp: 66,
        ppg: 28.5,
        rpg: 10.88,
        apg: 5.8,
        spg: 1.2,
        bpg: 1.3,
        fgPct: 58.2,
        threePct: 28.5,
        ftPct: 68.3
      }
    ],
    awards: [],
    highlights: [
      "Season 17 Rebounding Leader (10.88 RPG)",
      "Elite two-way player",
      "Dominant interior presence"
    ]
  },
  
  "Cade Cunningham": {
    name: "Cade Cunningham",
    team: "Detroit Pistons",
    position: "PG",
    height: "6'6\"",
    weight: "220 lbs",
    careerStats: [
      {
        season: 17,
        team: "Detroit Pistons",
        gp: 68,
        ppg: 24.2,
        rpg: 7.1,
        apg: 8.26,
        spg: 1.5,
        bpg: 0.6,
        fgPct: 46.8,
        threePct: 36.2,
        ftPct: 84.7
      }
    ],
    awards: [],
    highlights: [
      "Season 17 Assists Leader (8.26 APG)",
      "Elite playmaker and floor general",
      "Helped Pistons to #6 seed"
    ]
  },
  
  "OG Anunoby": {
    name: "OG Anunoby",
    team: "Toronto Raptors",
    position: "SF/PF",
    height: "6'7\"",
    weight: "232 lbs",
    careerStats: [
      {
        season: 17,
        team: "Toronto Raptors",
        gp: 72,
        ppg: 22.1,
        rpg: 6.8,
        apg: 2.8,
        spg: 2.5,
        bpg: 0.9,
        fgPct: 49.2,
        threePct: 39.8,
        ftPct: 78.5
      }
    ],
    awards: [],
    highlights: [
      "Season 17 Steals Leader (2.5 SPG)",
      "Season 17 Defensive Impact Leader (90.51 DIS)",
      "Elite two-way wing player",
      "Helped Raptors to #1 seed"
    ]
  },
  
  "Nicolas Claxton": {
    name: "Nicolas Claxton",
    team: "Brooklyn Nets",
    position: "C",
    height: "6'11\"",
    weight: "215 lbs",
    careerStats: [
      {
        season: 17,
        team: "Brooklyn Nets",
        gp: 58,
        ppg: 15.3,
        rpg: 8.2,
        apg: 2.1,
        spg: 0.8,
        bpg: 1.56,
        fgPct: 64.2,
        threePct: 0.0,
        ftPct: 72.1
      }
    ],
    awards: [],
    highlights: [
      "Season 17 Blocks Leader (1.56 BPG)",
      "Elite rim protector",
      "Efficient interior scorer (64.2 FG%)"
    ]
  },
  
  // Additional top 10 players with abbreviated profiles
  "Anthony Davis": {
    name: "Anthony Davis",
    team: "Los Angeles Lakers",
    position: "PF/C",
    height: "6'10\"",
    weight: "253 lbs",
    careerStats: [
      {
        season: 17,
        team: "Los Angeles Lakers",
        gp: 55,
        ppg: 26.8,
        rpg: 10.2,
        apg: 3.1,
        spg: 1.2,
        bpg: 1.8,
        fgPct: 54.3,
        threePct: 32.1,
        ftPct: 81.2
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds and blocks", "Elite two-way big man"]
  },
  
  "Karl-Anthony Towns": {
    name: "Karl-Anthony Towns",
    team: "New York Knicks",
    position: "C",
    height: "7'0\"",
    weight: "248 lbs",
    careerStats: [
      {
        season: 17,
        team: "New York Knicks",
        gp: 62,
        ppg: 24.5,
        rpg: 10.1,
        apg: 3.8,
        spg: 0.8,
        bpg: 0.9,
        fgPct: 52.1,
        threePct: 40.5,
        ftPct: 88.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Elite shooting big man"]
  },
  
  "Jarrett Allen": {
    name: "Jarrett Allen",
    team: "Cleveland Cavaliers",
    position: "C",
    height: "6'11\"",
    weight: "243 lbs",
    careerStats: [
      {
        season: 17,
        team: "Cleveland Cavaliers",
        gp: 64,
        ppg: 18.2,
        rpg: 9.95,
        apg: 2.3,
        spg: 0.7,
        bpg: 1.2,
        fgPct: 68.5,
        threePct: 0.0,
        ftPct: 71.8
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Elite interior defender"]
  },
  
  "Ivica Zubac": {
    name: "Ivica Zubac",
    team: "Los Angeles Clippers",
    position: "C",
    height: "7'0\"",
    weight: "240 lbs",
    careerStats: [
      {
        season: 17,
        team: "Los Angeles Clippers",
        gp: 59,
        ppg: 16.8,
        rpg: 9.88,
        apg: 1.9,
        spg: 0.5,
        bpg: 1.1,
        fgPct: 62.3,
        threePct: 0.0,
        ftPct: 74.2
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Efficient interior scorer"]
  },
  
  "Kristaps Porzingis": {
    name: "Kristaps Porzingis",
    team: "Boston Celtics",
    position: "PF/C",
    height: "7'3\"",
    weight: "240 lbs",
    careerStats: [
      {
        season: 17,
        team: "Boston Celtics",
        gp: 57,
        ppg: 22.1,
        rpg: 9.79,
        apg: 2.1,
        spg: 0.8,
        bpg: 1.5,
        fgPct: 48.2,
        threePct: 37.8,
        ftPct: 85.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Stretch big with rim protection"]
  },
  
  "Myles Turner": {
    name: "Myles Turner",
    team: "Indiana Pacers",
    position: "C",
    height: "6'11\"",
    weight: "250 lbs",
    careerStats: [
      {
        season: 17,
        team: "Indiana Pacers",
        gp: 61,
        ppg: 19.3,
        rpg: 9.75,
        apg: 1.8,
        spg: 0.7,
        bpg: 1.9,
        fgPct: 51.2,
        threePct: 36.5,
        ftPct: 82.1
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Elite shot blocker"]
  },
  
  "Onyeka Okongwu": {
    name: "Onyeka Okongwu",
    team: "Atlanta Hawks",
    position: "C",
    height: "6'8\"",
    weight: "235 lbs",
    careerStats: [
      {
        season: 17,
        team: "Atlanta Hawks",
        gp: 68,
        ppg: 14.2,
        rpg: 9.71,
        apg: 1.5,
        spg: 0.9,
        bpg: 1.3,
        fgPct: 61.8,
        threePct: 0.0,
        ftPct: 68.5
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Elite interior defender"]
  },
  
  "Brook Lopez": {
    name: "Brook Lopez",
    team: "Milwaukee Bucks",
    position: "C",
    height: "7'0\"",
    weight: "282 lbs",
    careerStats: [
      {
        season: 17,
        team: "Milwaukee Bucks",
        gp: 64,
        ppg: 17.5,
        rpg: 9.67,
        apg: 1.6,
        spg: 0.6,
        bpg: 2.1,
        fgPct: 53.2,
        threePct: 34.8,
        ftPct: 78.9
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Elite rim protector"]
  },
  
  "Robert Williams III": {
    name: "Robert Williams III",
    team: "Portland Trail Blazers",
    position: "C",
    height: "6'9\"",
    weight: "237 lbs",
    careerStats: [
      {
        season: 17,
        team: "Portland Trail Blazers",
        gp: 52,
        ppg: 12.8,
        rpg: 9.65,
        apg: 1.9,
        spg: 1.1,
        bpg: 1.8,
        fgPct: 69.2,
        threePct: 0.0,
        ftPct: 65.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in rebounds", "Elite lob threat and rim protector"]
  },
  
  "Darius Garland": {
    name: "Darius Garland",
    team: "Cleveland Cavaliers",
    position: "PG",
    height: "6'1\"",
    weight: "192 lbs",
    careerStats: [
      {
        season: 17,
        team: "Cleveland Cavaliers",
        gp: 65,
        ppg: 22.8,
        rpg: 3.2,
        apg: 7.88,
        spg: 1.2,
        bpg: 0.2,
        fgPct: 45.8,
        threePct: 38.5,
        ftPct: 89.2
      }
    ],
    awards: [],
    highlights: ["Top 10 in assists", "Elite playmaker"]
  },
  
  "LaMelo Ball": {
    name: "LaMelo Ball",
    team: "Charlotte Hornets",
    position: "PG",
    height: "6'7\"",
    weight: "180 lbs",
    careerStats: [
      {
        season: 17,
        team: "Charlotte Hornets",
        gp: 48,
        ppg: 26.3,
        rpg: 5.8,
        apg: 7.83,
        spg: 1.5,
        bpg: 0.3,
        fgPct: 43.2,
        threePct: 36.8,
        ftPct: 82.1
      }
    ],
    awards: [],
    highlights: ["Top 10 in assists", "Dynamic playmaker"]
  },
  
  "De'Aaron Fox": {
    name: "De'Aaron Fox",
    team: "Sacramento Kings",
    position: "PG",
    height: "6'3\"",
    weight: "185 lbs",
    careerStats: [
      {
        season: 17,
        team: "Sacramento Kings",
        gp: 72,
        ppg: 28.5,
        rpg: 4.8,
        apg: 7.56,
        spg: 1.8,
        bpg: 0.4,
        fgPct: 48.2,
        threePct: 35.2,
        ftPct: 81.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in assists", "Elite scorer and playmaker"]
  },
  
  "Jalen Williams": {
    name: "Jalen Williams",
    team: "Oklahoma City Thunder",
    position: "SG/SF",
    height: "6'6\"",
    weight: "195 lbs",
    careerStats: [
      {
        season: 17,
        team: "Oklahoma City Thunder",
        gp: 59,
        ppg: 24.1,
        rpg: 5.3,
        apg: 6.97,
        spg: 1.4,
        bpg: 0.7,
        fgPct: 50.2,
        threePct: 38.9,
        ftPct: 83.5
      }
    ],
    awards: [],
    highlights: ["Top 10 in assists", "Versatile wing player"]
  },
  
  "P.J. Washington": {
    name: "P.J. Washington",
    team: "Dallas Mavericks",
    position: "PF",
    height: "6'7\"",
    weight: "230 lbs",
    careerStats: [
      {
        season: 17,
        team: "Dallas Mavericks",
        gp: 63,
        ppg: 19.8,
        rpg: 7.2,
        apg: 6.89,
        spg: 1.1,
        bpg: 0.8,
        fgPct: 47.5,
        threePct: 37.2,
        ftPct: 75.8
      }
    ],
    awards: [],
    highlights: ["Top 10 in assists", "Versatile forward"]
  },
  
  "Derrick White": {
    name: "Derrick White",
    team: "Boston Celtics",
    position: "PG/SG",
    height: "6'4\"",
    weight: "190 lbs",
    careerStats: [
      {
        season: 17,
        team: "Boston Celtics",
        gp: 67,
        ppg: 20.5,
        rpg: 4.1,
        apg: 6.79,
        spg: 1.9,
        bpg: 0.6,
        fgPct: 46.8,
        threePct: 39.5,
        ftPct: 88.2
      }
    ],
    awards: [],
    highlights: ["Top 10 in assists", "Elite two-way guard"]
  },
  
  "Marcus Smart": {
    name: "Marcus Smart",
    team: "Memphis Grizzlies",
    position: "PG",
    height: "6'4\"",
    weight: "220 lbs",
    careerStats: [
      {
        season: 17,
        team: "Memphis Grizzlies",
        gp: 61,
        ppg: 18.2,
        rpg: 4.5,
        apg: 6.75,
        spg: 2.1,
        bpg: 0.4,
        fgPct: 42.8,
        threePct: 34.5,
        ftPct: 79.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in assists and steals", "Elite defender"]
  },
  
  "Ausar Thompson": {
    name: "Ausar Thompson",
    team: "Detroit Pistons",
    position: "SG/SF",
    height: "6'7\"",
    weight: "205 lbs",
    careerStats: [
      {
        season: 17,
        team: "Detroit Pistons",
        gp: 58,
        ppg: 16.3,
        rpg: 6.8,
        apg: 4.2,
        spg: 2.41,
        bpg: 1.1,
        fgPct: 48.5,
        threePct: 32.1,
        ftPct: 71.2
      }
    ],
    awards: [],
    highlights: ["Top 10 in steals", "Elite defensive wing"]
  },
  
  "Chet Holmgren": {
    name: "Chet Holmgren",
    team: "Oklahoma City Thunder",
    position: "C",
    height: "7'0\"",
    weight: "195 lbs",
    careerStats: [
      {
        season: 17,
        team: "Oklahoma City Thunder",
        gp: 56,
        ppg: 21.5,
        rpg: 8.2,
        apg: 2.8,
        spg: 0.9,
        bpg: 1.52,
        fgPct: 54.2,
        threePct: 38.5,
        ftPct: 82.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in blocks", "Unicorn big man"]
  },
  
  "Daniel Gafford": {
    name: "Daniel Gafford",
    team: "Dallas Mavericks",
    position: "C",
    height: "6'10\"",
    weight: "233 lbs",
    careerStats: [
      {
        season: 17,
        team: "Dallas Mavericks",
        gp: 54,
        ppg: 14.8,
        rpg: 7.5,
        apg: 1.2,
        spg: 0.6,
        bpg: 1.48,
        fgPct: 72.3,
        threePct: 0.0,
        ftPct: 68.9
      }
    ],
    awards: [],
    highlights: ["Top 10 in blocks", "Elite rim runner"]
  },
  
  "Donovan Clingan": {
    name: "Donovan Clingan",
    team: "Portland Trail Blazers",
    position: "C",
    height: "7'2\"",
    weight: "280 lbs",
    careerStats: [
      {
        season: 17,
        team: "Portland Trail Blazers",
        gp: 52,
        ppg: 12.5,
        rpg: 8.9,
        apg: 1.1,
        spg: 0.5,
        bpg: 1.46,
        fgPct: 61.2,
        threePct: 0.0,
        ftPct: 65.8
      }
    ],
    awards: [],
    highlights: ["Top 10 in blocks", "Rookie rim protector"]
  },
  
  "Yves Missi": {
    name: "Yves Missi",
    team: "New Orleans Pelicans",
    position: "C",
    height: "6'11\"",
    weight: "230 lbs",
    careerStats: [
      {
        season: 17,
        team: "New Orleans Pelicans",
        gp: 48,
        ppg: 11.2,
        rpg: 7.8,
        apg: 0.9,
        spg: 0.4,
        bpg: 1.44,
        fgPct: 58.5,
        threePct: 0.0,
        ftPct: 62.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in blocks", "Rookie shot blocker"]
  },
  
  "Alex Caruso": {
    name: "Alex Caruso",
    team: "Oklahoma City Thunder",
    position: "PG/SG",
    height: "6'5\"",
    weight: "186 lbs",
    careerStats: [
      {
        season: 17,
        team: "Oklahoma City Thunder",
        gp: 55,
        ppg: 12.8,
        rpg: 3.5,
        apg: 3.8,
        spg: 1.8,
        bpg: 0.7,
        fgPct: 48.2,
        threePct: 40.5,
        ftPct: 82.1
      }
    ],
    awards: [],
    highlights: ["Top 10 in opponent FG%", "Elite perimeter defender"]
  },
  
  "Lonzo Ball": {
    name: "Lonzo Ball",
    team: "Chicago Bulls",
    position: "PG",
    height: "6'6\"",
    weight: "190 lbs",
    careerStats: [
      {
        season: 17,
        team: "Chicago Bulls",
        gp: 42,
        ppg: 15.2,
        rpg: 5.1,
        apg: 6.3,
        spg: 1.5,
        bpg: 0.5,
        fgPct: 44.8,
        threePct: 38.2,
        ftPct: 75.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in opponent FG%", "Elite defender"]
  },
  
  "Cason Wallace": {
    name: "Cason Wallace",
    team: "Oklahoma City Thunder",
    position: "PG/SG",
    height: "6'4\"",
    weight: "193 lbs",
    careerStats: [
      {
        season: 17,
        team: "Oklahoma City Thunder",
        gp: 58,
        ppg: 11.5,
        rpg: 3.2,
        apg: 3.5,
        spg: 1.6,
        bpg: 0.6,
        fgPct: 46.2,
        threePct: 37.8,
        ftPct: 81.5
      }
    ],
    awards: [],
    highlights: ["Top 10 in opponent FG%", "Young defensive specialist"]
  },
  
  "Keon Ellis": {
    name: "Keon Ellis",
    team: "Sacramento Kings",
    position: "SG",
    height: "6'3\"",
    weight: "170 lbs",
    careerStats: [
      {
        season: 17,
        team: "Sacramento Kings",
        gp: 51,
        ppg: 9.8,
        rpg: 2.8,
        apg: 2.1,
        spg: 1.4,
        bpg: 0.5,
        fgPct: 45.2,
        threePct: 39.1,
        ftPct: 78.5
      }
    ],
    awards: [],
    highlights: ["Top 10 in opponent FG%", "Defensive specialist"]
  },
  
  "Pascal Siakam": {
    name: "Pascal Siakam",
    team: "Indiana Pacers",
    position: "PF",
    height: "6'9\"",
    weight: "230 lbs",
    careerStats: [
      {
        season: 17,
        team: "Indiana Pacers",
        gp: 59,
        ppg: 24.8,
        rpg: 7.5,
        apg: 4.8,
        spg: 1.2,
        bpg: 0.8,
        fgPct: 50.2,
        threePct: 35.8,
        ftPct: 79.3
      }
    ],
    awards: [],
    highlights: ["Top 10 in DIS", "Versatile two-way forward"]
  },
  
  "Jamir Watkins": {
    name: "Jamir Watkins",
    team: "Detroit Pistons",
    position: "SF",
    height: "6'7\"",
    weight: "210 lbs",
    careerStats: [
      {
        season: 17,
        team: "Detroit Pistons",
        gp: 64,
        ppg: 13.69,
        rpg: 4.2,
        apg: 2.73,
        spg: 1.1,
        bpg: 0.5,
        fgPct: 48.5,
        threePct: 36.2,
        ftPct: 78.5
      }
    ],
    awards: ["Season 17 ROY"],
    detailedAwards: [
      { type: 'ROY', season: 17, description: 'Rookie of the Year - The Wilt Chamberlain Trophy' }
    ],
    highlights: [
      "🌟 Season 17 ROY - LANDSLIDE WINNER (66.7% of votes)",
      "13.69 PPG | 2.73 APG | +/- 502",
      "Best +/- among rookies",
      "Key contributor to Pistons playoff push"
    ]
  },
  
  "Kentavious Caldwell-Pope": {
    name: "Kentavious Caldwell-Pope",
    team: "Denver Nuggets",
    position: "SG/SF",
    height: "6'5\"",
    weight: "204 lbs",
    careerStats: [
      {
        season: 17,
        team: "Denver Nuggets",
        gp: 65,
        ppg: 17.23,
        rpg: 3.8,
        apg: 2.1,
        spg: 1.3,
        bpg: 0.4,
        fgPct: 62.0,
        threePct: 62.0,
        ftPct: 85.2
      }
    ],
    awards: ["Season 17 6MOY"],
    detailedAwards: [
      { type: '6MOY', season: 17, description: 'Sixth Man of the Year - The John Havlicek Trophy' }
    ],
    highlights: [
      "🔥 Season 17 6MOY (47.4% of votes)",
      "17.23 PPG off the bench",
      "Elite efficiency: 62.0% FG, 62.0% 3P",
      "Veteran spark plug for Nuggets"
    ]
  }
};

// Helper function to get player profile by name
export const getPlayerProfile = (playerName: string): PlayerProfile | undefined => {
  return playerProfiles[playerName];
};

// Helper function to get all player names
export const getAllPlayerNames = (): string[] => {
  return Object.keys(playerProfiles).sort();
};

// Helper function to convert player name to URL slug
export const playerNameToSlug = (playerName: string): string => {
  return playerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Helper function to find player by slug
export const getPlayerBySlug = (slug: string): PlayerProfile | undefined => {
  const playerName = Object.keys(playerProfiles).find(
    name => playerNameToSlug(name) === slug
  );
  return playerName ? playerProfiles[playerName] : undefined;
};
