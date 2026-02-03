// Wizards vs Rockets Eastern Conference Semifinals Series Data
// Season 17 Playoffs - Wizards lead 3-1

export interface GameSummary {
  game: string;
  wizardsScore: number;
  rocketsScore: number;
  attendance: string;
  wizardsFG: string;
  rocketsFG: string;
  wizards3PT: string;
  rockets3PT: string;
  wizardsFT: string;
  rocketsFT: string;
  wizardsPaint: number;
  rocketsPaint: number;
  wizards2ndChance: number;
  rockets2ndChance: number;
  wizardsBench: number;
  rocketsBench: number;
  wizardsAST: number;
  rocketsAST: number;
  wizardsOR: number;
  rocketsOR: number;
  wizardsTO: number;
  rocketsTO: number;
  wizardsFastBreak: number;
  rocketsFastBreak: number;
  notes?: string;
}

export interface PlayerStats {
  game: string;
  team: string;
  opponent: string;
  player: string;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fgm: number;
  fga: number;
  threePM: number;
  threePA: number;
  ftm: number;
  fta: number;
  or: number;
  fls: number;
  dnp: boolean;
}

export interface GameRecap {
  game: string;
  title: string;
  body: string;
}

export const seriesSummary = {
  title: "Series Recap (AP style) — Wizards win 3-1",
  body: `WASHINGTON (AP) — Jalen Suggs turned the Eastern Conference semifinals into a personal showcase, leading the Wizards to a 3-1 series victory over the Houston Rockets in a dominant best-of-five performance.

Washington jumped out 2-0 behind Suggs' 56 in the opener and a 102-73 blowout in Game 2, then absorbed Houston's response in Game 3 when the Rockets held the Wizards to 4-of-25 from 3. Suggs answered again in Game 4 with 53 as Washington jumped on a compromised Anthony Edwards and turned defense into offense to clinch the series.

Through four games, Suggs was the difference — combining shot volume, pace and late-game shot-making in a way Houston couldn't contain. Washington now advances to face the 9-seed Bucks and R.J. Barrett, fresh off an upset sweep of the top-seeded Raptors.`
};

export const lookingAhead = {
  title: "Looking Ahead — Eastern Conference Finals",
  body: `Milwaukee enters off a shock sweep of the No. 1 seed Raptors, with R.J. Barrett going thermonuclear off the bench and Fred VanVleet playing the role of late-season pickup turned playoff stabilizer. Barrett's shot-making has been the swing factor all postseason — the same kind of heroics he showed in the Spurs series — and the Bucks have consistently won the possession battle with offensive rebounds and bench scoring.

For Washington, it's a clash of engines: Suggs' relentless scoring and transition pace against Milwaukee's depth and physicality. The Bucks will try to keep Suggs out of the open floor and force Washington into half-court possessions; the Wizards will need Jaylen Brown to provide a steady second punch and must match Milwaukee on the glass to avoid giving Barrett and VanVleet extra possessions.

The Conference Finals promise to be an explosive matchup between two of the hottest scorers in the playoffs.`
};

export const gameSummaries: GameSummary[] = [
  {
    game: "Game 1",
    wizardsScore: 99,
    rocketsScore: 88,
    attendance: "60%",
    wizardsFG: "40-65 (62%)",
    rocketsFG: "36-73 (49%)",
    wizards3PT: "7-15 (47%)",
    rockets3PT: "9-17 (53%)",
    wizardsFT: "12-15 (80%)",
    rocketsFT: "7-7 (100%)",
    wizardsPaint: 58,
    rocketsPaint: 44,
    wizards2ndChance: 4,
    rockets2ndChance: 10,
    wizardsBench: 2,
    rocketsBench: 26,
    wizardsAST: 21,
    rocketsAST: 14,
    wizardsOR: 3,
    rocketsOR: 6,
    wizardsTO: 10,
    rocketsTO: 8,
    wizardsFastBreak: 26,
    rocketsFastBreak: 4
  },
  {
    game: "Game 2",
    wizardsScore: 102,
    rocketsScore: 73,
    attendance: "60%",
    wizardsFG: "45-83 (54%)",
    rocketsFG: "27-63 (43%)",
    wizards3PT: "9-24 (38%)",
    rockets3PT: "4-13 (31%)",
    wizardsFT: "3-6 (50%)",
    rocketsFT: "15-17 (88%)",
    wizardsPaint: 62,
    rocketsPaint: 40,
    wizards2ndChance: 14,
    rockets2ndChance: 4,
    wizardsBench: 2,
    rocketsBench: 13,
    wizardsAST: 23,
    rocketsAST: 14,
    wizardsOR: 6,
    rocketsOR: 2,
    wizardsTO: 5,
    rocketsTO: 15,
    wizardsFastBreak: 25,
    rocketsFastBreak: 9
  },
  {
    game: "Game 3",
    wizardsScore: 77,
    rocketsScore: 91,
    attendance: "60%",
    wizardsFG: "36-78 (46%)",
    rocketsFG: "40-68 (59%)",
    wizards3PT: "4-25 (16%)",
    rockets3PT: "6-9 (67%)",
    wizardsFT: "1-3 (33%)",
    rocketsFT: "5-9 (56%)",
    wizardsPaint: 56,
    rocketsPaint: 62,
    wizards2ndChance: 8,
    rockets2ndChance: 6,
    wizardsBench: 4,
    rocketsBench: 28,
    wizardsAST: 14,
    rocketsAST: 14,
    wizardsOR: 4,
    rocketsOR: 3,
    wizardsTO: 11,
    rocketsTO: 13,
    wizardsFastBreak: 10,
    rocketsFastBreak: 18,
    notes: "Rockets cut series deficit to 2-1"
  },
  {
    game: "Game 4",
    wizardsScore: 95,
    rocketsScore: 79,
    attendance: "60%",
    wizardsFG: "41-73 (56%)",
    rocketsFG: "30-63 (48%)",
    wizards3PT: "10-21 (48%)",
    rockets3PT: "7-16 (44%)",
    wizardsFT: "3-3 (100%)",
    rocketsFT: "12-14 (86%)",
    wizardsPaint: 52,
    rocketsPaint: 38,
    wizards2ndChance: 8,
    rockets2ndChance: 4,
    wizardsBench: 7,
    rocketsBench: 15,
    wizardsAST: 21,
    rocketsAST: 10,
    wizardsOR: 4,
    rocketsOR: 2,
    wizardsTO: 15,
    rocketsTO: 17,
    wizardsFastBreak: 22,
    rocketsFastBreak: 6,
    notes: "Wizards win series 3-1"
  }
];

export const gameRecaps: GameRecap[] = [
  {
    game: "Game 1",
    title: "Game 1 Recap (AP style)",
    body: `WASHINGTON (AP) — Jalen Suggs scored 56 points, including a burst that flipped the game after halftime, and the Wizards opened the Eastern Conference semifinals with a 99-88 win over the Houston Rockets.

Suggs hit 21 of 31 shots and went 6 for 12 from 3-point range, then poured in 47 after the break as Washington ran Houston off the floor in transition. The Wizards finished with a 26-4 edge in fast-break points and outscored the Rockets 58-44 in the paint, turning stops into easy baskets.

Anthony Edwards led Houston with 24 points and five assists, and Kristaps Porzingis added 14, but the Rockets couldn't keep up with Suggs' shot-making and Washington's pace. Jaylen Brown added 17 for Washington as the Wizards took a 1-0 lead.`
  },
  {
    game: "Game 2",
    title: "Game 2 Recap (AP style)",
    body: `WASHINGTON (AP) — Jalen Suggs scored 66 points and the Wizards routed the Houston Rockets 102-73 in Game 2 to take a 2-0 lead.

Suggs hit 29 of 49 shots and drilled eight 3-pointers as Washington forced 15 turnovers and turned them into a 25-9 edge in fast-break points. The Wizards finished 9 of 24 from deep and held Houston to 4-of-13 from 3-point range.

Zach LaVine led Houston with 19 points. Anthony Edwards was held to 16 on 5-of-19 shooting as Washington's defense kept Houston's half-court offense from ever settling in.`
  },
  {
    game: "Game 3",
    title: "Game 3 Recap (AP style)",
    body: `HOUSTON (AP) — Cam Whitmore scored 18 points, Anthony Edwards added 23 and the Rockets pulled back into the series with a 91-77 win over the Wizards in Game 3.

Houston's defense dictated the night, holding Washington to 4-of-25 shooting from 3-point range and winning the rebounding battle 40-34. Kristaps Porzingis had 10 points and three blocks, and the Rockets' bench outscored Washington's 28-10 to create separation late.

Suggs scored 46 for Washington, but the Wizards couldn't get enough help as the offense stalled outside the paint. The Rockets cut the series deficit to 2-1.`
  },
  {
    game: "Game 4",
    title: "Game 4 Recap (AP style)",
    body: `WASHINGTON (AP) — Jalen Suggs scored 53 points and the Wizards moved within a win of the conference finals, beating the Rockets 95-79 in Game 4 for a 3-1 series lead.

Anthony Edwards was injured in the first two minutes and was never the same, and Washington took control with pace and pressure. The Wizards shot 58% and hit 10 threes while forcing 17 turnovers and piling up 22 fast-break points.

Zach LaVine scored 23 for Houston and Edwards finished with 15, but the Rockets' offense bogged down without its usual burst. Jaylen Brown added 20 for Washington as the Wizards regained control heading back to Houston.`
  }
];

// Top performers across the series
export const seriesLeaders = {
  wizards: {
    scoring: [
      { player: "J. Suggs", total: 221, avg: 55.2, games: [56, 66, 46, 53] },
      { player: "J. Brown", total: 60, avg: 15.0, games: [17, 10, 13, 20] },
      { player: "B. Mathurin", total: 42, avg: 10.5, games: [13, 18, 6, 5] }
    ],
    rebounds: [
      { player: "J. Allen", total: 39, avg: 9.8, games: [9, 11, 7, 12] },
      { player: "D. Green", total: 15, avg: 3.8, games: [4, 5, 4, 2] }
    ],
    assists: [
      { player: "D. Green", total: 19, avg: 4.8, games: [3, 7, 3, 6] },
      { player: "J. Suggs", total: 13, avg: 3.2, games: [4, 2, 3, 4] }
    ]
  },
  rockets: {
    scoring: [
      { player: "A. Edwards", total: 78, avg: 19.5, games: [24, 16, 23, 15] },
      { player: "Z. LaVine", total: 58, avg: 14.5, games: [5, 19, 11, 23] },
      { player: "K. Porzingis", total: 43, avg: 10.8, games: [14, 6, 10, 13] }
    ],
    rebounds: [
      { player: "B. Bol", total: 27, avg: 6.8, games: [8, 4, 10, 5] },
      { player: "K. Porzingis", total: 21, avg: 5.2, games: [3, 8, 6, 4] }
    ],
    assists: [
      { player: "A. Edwards", total: 16, avg: 4.0, games: [5, 3, 6, 2] },
      { player: "Z. LaVine", total: 11, avg: 2.8, games: [4, 3, 3, 1] }
    ]
  }
};

// Series MVP
export const seriesMVP = {
  player: "Jalen Suggs",
  team: "Washington Wizards",
  totalPoints: 221,
  ppg: 55.2,
  gameScores: [56, 66, 46, 53],
  highlights: "Historic scoring run with 56, 66, and 53-point games"
};

// Box score data for all games
export const boxScores: PlayerStats[] = [
  // Game 1 - Wizards
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Suggs", min: 23, pts: 56, reb: 1, ast: 4, stl: 3, blk: 0, to: 2, fgm: 21, fga: 31, threePM: 6, threePA: 12, ftm: 8, fta: 9, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Brown", min: 20, pts: 17, reb: 4, ast: 1, stl: 0, blk: 0, to: 2, fgm: 8, fga: 18, threePM: 0, threePA: 1, ftm: 1, fta: 2, or: 0, fls: 2, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "B. Mathurin", min: 9, pts: 13, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 5, fga: 6, threePM: 1, threePA: 2, ftm: 2, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Allen", min: 20, pts: 9, reb: 9, ast: 3, stl: 1, blk: 2, to: 2, fgm: 4, fga: 6, threePM: 0, threePA: 1, ftm: 1, fta: 2, or: 1, fls: 1, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "S. Castle", min: 22, pts: 2, reb: 4, ast: 2, stl: 3, blk: 1, to: 2, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "D. Green", min: 20, pts: 2, reb: 4, ast: 3, stl: 0, blk: 0, to: 2, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Walsh", min: 13, pts: 0, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 3, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "A. Caruso", min: 12, pts: 0, reb: 0, ast: 6, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "M. Raynaud", min: 7, pts: 0, reb: 3, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "K. Maluach", min: 5, pts: 0, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "T. Vukcevic", min: 7, pts: 0, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 0, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Washington Wizards", opponent: "Houston Rockets", player: "A. Jackson Jr.", min: 2, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 1, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 1 - Rockets
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "A. Edwards", min: 17, pts: 24, reb: 3, ast: 5, stl: 2, blk: 0, to: 2, fgm: 9, fga: 15, threePM: 4, threePA: 6, ftm: 2, fta: 2, or: 0, fls: 4, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "K. Porzingis", min: 19, pts: 14, reb: 3, ast: 1, stl: 0, blk: 1, to: 1, fgm: 6, fga: 8, threePM: 2, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Whitmore", min: 15, pts: 11, reb: 2, ast: 0, stl: 0, blk: 0, to: 1, fgm: 4, fga: 9, threePM: 1, threePA: 1, ftm: 2, fta: 2, or: 1, fls: 2, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Bol", min: 16, pts: 8, reb: 8, ast: 1, stl: 0, blk: 1, to: 0, fgm: 3, fga: 6, threePM: 0, threePA: 1, ftm: 2, fta: 2, or: 2, fls: 1, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Murray", min: 14, pts: 8, reb: 4, ast: 1, stl: 0, blk: 0, to: 1, fgm: 4, fga: 12, threePM: 0, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Fernando", min: 12, pts: 7, reb: 3, ast: 1, stl: 1, blk: 0, to: 1, fgm: 3, fga: 4, threePM: 0, threePA: 0, ftm: 1, fta: 1, or: 1, fls: 1, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "Z. LaVine", min: 23, pts: 5, reb: 2, ast: 4, stl: 1, blk: 0, to: 1, fgm: 2, fga: 13, threePM: 1, threePA: 5, ftm: 0, fta: 0, or: 1, fls: 3, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Brooks", min: 16, pts: 5, reb: 3, ast: 0, stl: 2, blk: 0, to: 0, fgm: 2, fga: 2, threePM: 1, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Bassey", min: 11, pts: 4, reb: 2, ast: 0, stl: 1, blk: 0, to: 0, fgm: 2, fga: 2, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "J. Hayes", min: 5, pts: 2, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 0, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "Q. Grimes", min: 4, pts: 0, reb: 0, ast: 1, stl: 0, blk: 0, to: 1, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Exum", min: 3, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "M. Thybulle", min: 3, pts: 0, reb: 0, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Houston Rockets", opponent: "Washington Wizards", player: "O. Agbaji", min: 2, pts: 0, reb: 0, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 2 - Wizards
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Suggs", min: 21, pts: 66, reb: 3, ast: 2, stl: 2, blk: 0, to: 1, fgm: 29, fga: 49, threePM: 8, threePA: 20, ftm: 0, fta: 0, or: 2, fls: 2, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "B. Mathurin", min: 14, pts: 18, reb: 1, ast: 0, stl: 1, blk: 0, to: 1, fgm: 7, fga: 12, threePM: 1, threePA: 2, ftm: 3, fta: 4, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Brown", min: 21, pts: 10, reb: 4, ast: 1, stl: 1, blk: 0, to: 1, fgm: 5, fga: 11, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Allen", min: 16, pts: 4, reb: 11, ast: 3, stl: 0, blk: 0, to: 0, fgm: 2, fga: 2, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 2, fls: 2, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "S. Castle", min: 19, pts: 2, reb: 3, ast: 4, stl: 1, blk: 1, to: 0, fgm: 1, fga: 7, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "D. Green", min: 20, pts: 2, reb: 5, ast: 7, stl: 1, blk: 1, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Walsh", min: 11, pts: 0, reb: 4, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 1, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "A. Caruso", min: 10, pts: 0, reb: 0, ast: 3, stl: 1, blk: 0, to: 1, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "M. Raynaud", min: 10, pts: 0, reb: 4, ast: 1, stl: 2, blk: 0, to: 1, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "K. Maluach", min: 7, pts: 0, reb: 2, ast: 0, stl: 0, blk: 1, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Washington Wizards", opponent: "Houston Rockets", player: "T. Vukcevic", min: 11, pts: 0, reb: 3, ast: 2, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  // Game 2 - Rockets
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "Z. LaVine", min: 19, pts: 19, reb: 2, ast: 3, stl: 0, blk: 0, to: 4, fgm: 6, fga: 11, threePM: 2, threePA: 4, ftm: 5, fta: 6, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "A. Edwards", min: 21, pts: 16, reb: 6, ast: 3, stl: 1, blk: 0, to: 1, fgm: 5, fga: 19, threePM: 0, threePA: 5, ftm: 6, fta: 6, or: 0, fls: 2, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Bol", min: 15, pts: 10, reb: 4, ast: 1, stl: 0, blk: 0, to: 0, fgm: 5, fga: 5, threePM: 0, threePA: 0, ftm: 0, fta: 1, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "K. Porzingis", min: 17, pts: 6, reb: 8, ast: 4, stl: 0, blk: 0, to: 0, fgm: 3, fga: 9, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 0, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Whitmore", min: 15, pts: 5, reb: 0, ast: 0, stl: 1, blk: 0, to: 4, fgm: 2, fga: 4, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Murray", min: 10, pts: 4, reb: 0, ast: 1, stl: 0, blk: 0, to: 2, fgm: 1, fga: 4, threePM: 0, threePA: 0, ftm: 2, fta: 2, or: 0, fls: 3, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Bassey", min: 12, pts: 4, reb: 6, ast: 1, stl: 1, blk: 0, to: 1, fgm: 2, fga: 2, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Brooks", min: 19, pts: 3, reb: 4, ast: 0, stl: 0, blk: 0, to: 2, fgm: 1, fga: 4, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "Q. Grimes", min: 5, pts: 2, reb: 0, ast: 0, stl: 0, blk: 0, to: 1, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Fernando", min: 6, pts: 2, reb: 0, ast: 0, stl: 0, blk: 1, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 2, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "O. Agbaji", min: 12, pts: 2, reb: 1, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Exum", min: 1, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "M. Thybulle", min: 7, pts: 0, reb: 0, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Houston Rockets", opponent: "Washington Wizards", player: "J. Hayes", min: 1, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 3 - Rockets
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "A. Edwards", min: 22, pts: 23, reb: 1, ast: 6, stl: 1, blk: 0, to: 1, fgm: 10, fga: 16, threePM: 1, threePA: 3, ftm: 2, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Whitmore", min: 14, pts: 18, reb: 3, ast: 1, stl: 1, blk: 0, to: 3, fgm: 6, fga: 9, threePM: 2, threePA: 2, ftm: 4, fta: 6, or: 0, fls: 1, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "Z. LaVine", min: 20, pts: 11, reb: 0, ast: 3, stl: 1, blk: 0, to: 2, fgm: 4, fga: 9, threePM: 1, threePA: 2, ftm: 2, fta: 2, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Bol", min: 16, pts: 11, reb: 10, ast: 1, stl: 0, blk: 0, to: 1, fgm: 5, fga: 6, threePM: 0, threePA: 0, ftm: 1, fta: 1, or: 2, fls: 1, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "K. Porzingis", min: 18, pts: 10, reb: 6, ast: 1, stl: 1, blk: 3, to: 4, fgm: 5, fga: 10, threePM: 0, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Brooks", min: 17, pts: 8, reb: 1, ast: 1, stl: 0, blk: 0, to: 0, fgm: 3, fga: 6, threePM: 2, threePA: 4, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Fernando", min: 5, pts: 4, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 2, fga: 3, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "Q. Grimes", min: 7, pts: 2, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 3, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Murray", min: 11, pts: 2, reb: 2, ast: 0, stl: 0, blk: 0, to: 1, fgm: 1, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "J. Hayes", min: 10, pts: 2, reb: 5, ast: 0, stl: 1, blk: 0, to: 1, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "M. Thybulle", min: 6, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "O. Agbaji", min: 4, pts: 0, reb: 0, ast: 1, stl: 1, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Bassey", min: 10, pts: 0, reb: 7, ast: 0, stl: 0, blk: 1, to: 1, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 3 - Wizards
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Suggs", min: 22, pts: 46, reb: 4, ast: 3, stl: 1, blk: 0, to: 4, fgm: 20, fga: 40, threePM: 4, threePA: 18, ftm: 2, fta: 2, or: 1, fls: 2, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Brown", min: 17, pts: 13, reb: 2, ast: 1, stl: 1, blk: 0, to: 0, fgm: 6, fga: 16, threePM: 0, threePA: 4, ftm: 1, fta: 1, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Allen", min: 17, pts: 6, reb: 7, ast: 1, stl: 1, blk: 0, to: 1, fgm: 3, fga: 5, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 2, fls: 1, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "B. Mathurin", min: 16, pts: 6, reb: 3, ast: 0, stl: 1, blk: 0, to: 0, fgm: 3, fga: 6, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 3, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "A. Caruso", min: 10, pts: 4, reb: 1, ast: 2, stl: 3, blk: 0, to: 0, fgm: 2, fga: 3, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "S. Castle", min: 18, pts: 2, reb: 1, ast: 3, stl: 3, blk: 0, to: 2, fgm: 1, fga: 5, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "D. Green", min: 19, pts: 0, reb: 4, ast: 3, stl: 1, blk: 0, to: 3, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Walsh", min: 19, pts: 0, reb: 2, ast: 1, stl: 0, blk: 0, to: 1, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "M. Raynaud", min: 9, pts: 0, reb: 4, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 2, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "K. Maluach", min: 3, pts: 0, reb: 1, ast: 0, stl: 0, blk: 1, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3", team: "Washington Wizards", opponent: "Houston Rockets", player: "T. Vukcevic", min: 10, pts: 0, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 2, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  // Game 4 - Rockets
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "Z. LaVine", min: 23, pts: 23, reb: 3, ast: 1, stl: 1, blk: 0, to: 3, fgm: 7, fga: 11, threePM: 2, threePA: 4, ftm: 7, fta: 8, or: 0, fls: 0, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "A. Edwards", min: 19, pts: 15, reb: 1, ast: 2, stl: 3, blk: 0, to: 1, fgm: 6, fga: 16, threePM: 1, threePA: 4, ftm: 2, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "K. Porzingis", min: 20, pts: 13, reb: 4, ast: 1, stl: 2, blk: 2, to: 2, fgm: 5, fga: 7, threePM: 1, threePA: 1, ftm: 2, fta: 2, or: 0, fls: 2, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Murray", min: 12, pts: 9, reb: 2, ast: 2, stl: 2, blk: 0, to: 2, fgm: 3, fga: 9, threePM: 2, threePA: 4, ftm: 1, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Fernando", min: 11, pts: 8, reb: 4, ast: 0, stl: 0, blk: 0, to: 1, fgm: 4, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 0, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Whitmore", min: 12, pts: 4, reb: 1, ast: 0, stl: 0, blk: 0, to: 3, fgm: 2, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "D. Brooks", min: 19, pts: 3, reb: 2, ast: 2, stl: 3, blk: 0, to: 0, fgm: 1, fga: 4, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "C. Bassey", min: 12, pts: 2, reb: 4, ast: 1, stl: 1, blk: 1, to: 2, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "J. Hayes", min: 4, pts: 2, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 2, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "B. Bol", min: 16, pts: 0, reb: 5, ast: 1, stl: 0, blk: 1, to: 0, fgm: 0, fga: 2, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "Q. Grimes", min: 5, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 1, fgm: 0, fga: 2, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "M. Thybulle", min: 3, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 4", team: "Houston Rockets", opponent: "Washington Wizards", player: "O. Agbaji", min: 4, pts: 0, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 4 - Wizards
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Suggs", min: 21, pts: 53, reb: 4, ast: 4, stl: 1, blk: 0, to: 4, fgm: 22, fga: 31, threePM: 8, threePA: 13, ftm: 1, fta: 1, or: 0, fls: 0, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Brown", min: 21, pts: 20, reb: 3, ast: 1, stl: 2, blk: 0, to: 3, fgm: 10, fga: 18, threePM: 0, threePA: 4, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "S. Castle", min: 19, pts: 8, reb: 4, ast: 2, stl: 3, blk: 0, to: 1, fgm: 4, fga: 10, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Walsh", min: 17, pts: 5, reb: 0, ast: 0, stl: 2, blk: 0, to: 1, fgm: 2, fga: 2, threePM: 1, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "B. Mathurin", min: 14, pts: 5, reb: 2, ast: 2, stl: 0, blk: 0, to: 1, fgm: 2, fga: 4, threePM: 1, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "D. Green", min: 22, pts: 2, reb: 2, ast: 6, stl: 3, blk: 0, to: 2, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "A. Caruso", min: 15, pts: 2, reb: 2, ast: 1, stl: 0, blk: 0, to: 1, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "J. Allen", min: 20, pts: 0, reb: 12, ast: 4, stl: 2, blk: 0, to: 3, fgm: 0, fga: 4, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "M. Raynaud", min: 8, pts: 0, reb: 2, ast: 0, stl: 1, blk: 1, to: 0, fgm: 0, fga: 0, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 4", team: "Washington Wizards", opponent: "Houston Rockets", player: "T. Vukcevic", min: 3, pts: 0, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 0, fga: 2, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 0, dnp: false }
];
