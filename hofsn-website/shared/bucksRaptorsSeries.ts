// Bucks vs Raptors Eastern Conference Semifinals Series Data
// Season 16 Playoffs - Bucks win 3-0

export interface GameSummary {
  game: string;
  bucksScore: number;
  raptorsScore: number;
  attendance: string;
  bucksFG: string;
  raptorsFG: string;
  bucks3PT: string;
  raptors3PT: string;
  bucksFT: string;
  raptorsFT: string;
  bucksPaint: number;
  raptorsPaint: number;
  bucks2ndChance: number;
  raptors2ndChance: number;
  bucksBench: number;
  raptorsBench: number;
  bucksAST: number;
  raptorsAST: number;
  bucksOR: number;
  raptorsOR: number;
  bucksTO: number;
  raptorsTO: number;
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
  title: "Series Recap (AP style) — Bucks win 3-0",
  body: `MILWAUKEE (AP) — The Milwaukee Bucks kept rewriting the bracket, sweeping the No. 1 seeded Toronto Raptors 3-0 in the Eastern Conference semifinals and advancing after another upset-driven run.

R.J. Barrett was the engine, following up his heroics from the first round with three more takeover performances — 31 in Game 1, 30 in Game 2 and a series-clinching 53 in an overtime Game 3. Fred VanVleet, acquired late in the season, turned into a playoff revelation as Milwaukee's stabilizer and playmaker, and the Bucks' bench swung every game with a massive scoring edge.

Toronto got huge nights from Jayson Tatum, including 50 in the finale, but couldn't overcome Milwaukee's possession control. The Bucks won the offensive-rebounding and second-chance battle across the series and consistently generated extra shots, finishing the sweep and sending the league's top seed home early.`
};

export const gameSummaries: GameSummary[] = [
  {
    game: "Game 1",
    bucksScore: 101,
    raptorsScore: 93,
    attendance: "60%",
    bucksFG: "42-81 (52%)",
    raptorsFG: "41-71 (58%)",
    bucks3PT: "10-26 (38%)",
    raptors3PT: "9-27 (33%)",
    bucksFT: "7-8 (88%)",
    raptorsFT: "2-2 (100%)",
    bucksPaint: 50,
    raptorsPaint: 56,
    bucks2ndChance: 20,
    raptors2ndChance: 4,
    bucksBench: 50,
    raptorsBench: 30,
    bucksAST: 20,
    raptorsAST: 18,
    bucksOR: 17,
    raptorsOR: 5,
    bucksTO: 11,
    raptorsTO: 12
  },
  {
    game: "Game 2",
    bucksScore: 107,
    raptorsScore: 103,
    attendance: "60%",
    bucksFG: "44-85 (52%)",
    raptorsFG: "40-81 (49%)",
    bucks3PT: "13-28 (46%)",
    raptors3PT: "7-29 (24%)",
    bucksFT: "6-10 (60%)",
    raptorsFT: "16-16 (100%)",
    bucksPaint: 48,
    raptorsPaint: 60,
    bucks2ndChance: 22,
    raptors2ndChance: 8,
    bucksBench: 55,
    raptorsBench: 39,
    bucksAST: 18,
    raptorsAST: 15,
    bucksOR: 9,
    raptorsOR: 5,
    bucksTO: 20,
    raptorsTO: 17
  },
  {
    game: "Game 3 (OT)",
    bucksScore: 123,
    raptorsScore: 120,
    attendance: "60%",
    bucksFG: "53-99 (54%)",
    raptorsFG: "53-80 (66%)",
    bucks3PT: "10-31 (32%)",
    raptors3PT: "11-23 (48%)",
    bucksFT: "7-7 (100%)",
    raptorsFT: "3-6 (50%)",
    bucksPaint: 76,
    raptorsPaint: 72,
    bucks2ndChance: 17,
    raptors2ndChance: 0,
    bucksBench: 63,
    raptorsBench: 27,
    bucksAST: 20,
    raptorsAST: 22,
    bucksOR: 21,
    raptorsOR: 3,
    bucksTO: 13,
    raptorsTO: 12,
    notes: "OT. Bucks win series 3-0."
  }
];

export const gameRecaps: GameRecap[] = [
  {
    game: "Game 1",
    title: "Game 1 Recap (AP style)",
    body: `MILWAUKEE (AP) — R.J. Barrett scored 31 points and Fred VanVleet added 20 as the Milwaukee Bucks beat the Toronto Raptors 101-93 in Game 1 of the Eastern Conference semifinals.

Milwaukee's bench swung the game, outscoring Toronto 50-30 while the Bucks piled up 20 second-chance points. Yves Missi had 10 points and 10 rebounds and Steven Adams grabbed 11 boards, helping Milwaukee win the offensive rebounding battle 17-5 and keep possessions alive even as Toronto shot 58% from the floor.

OG Anunoby led the Raptors with 20 points and Jayson Tatum had 19, but Toronto couldn't match Milwaukee's extra chances. The Bucks closed the game at the line, hitting 7 of 8 free throws, and took a 1-0 lead in the best-of-seven series.`
  },
  {
    game: "Game 2",
    title: "Game 2 Recap (AP style)",
    body: `MILWAUKEE (AP) — R.J. Barrett scored 30 points and the Bucks held off the Raptors 107-103 in Game 2, taking a 2-0 lead despite Toronto's perfect night at the free-throw line.

Milwaukee made the difference from deep, hitting 13 3-pointers to Toronto's 7, and again won the hustle math — 22 second-chance points and a 55-39 edge in bench scoring. VanVleet finished with 19 points and five assists, while GG Jackson scored 15 off the bench.

Jayson Tatum had 24 points and seven rebounds for Toronto, and the Raptors went 16 for 16 at the stripe to stay within one possession late. But Toronto's 7-for-29 shooting from 3-point range left too much to chase, and Milwaukee survived a sloppy 20-turnover night to move within one win of the conference finals.`
  },
  {
    game: "Game 3 (OT)",
    title: "Game 3 Recap (AP style)",
    body: `TORONTO (AP) — R.J. Barrett erupted for 53 points and the Milwaukee Bucks completed a stunning sweep of the top-seeded Toronto Raptors with a 123-120 overtime win in Game 3.

Barrett buried six 3-pointers and carried Milwaukee through the extra period, while VanVleet added 19 points and seven assists. The Bucks absorbed Toronto's hot shooting (66% from the field) by controlling the possession battle — 21 offensive rebounds and 17 second-chance points — and leaning on a bench that scored 63 points.

Jayson Tatum scored 50 for Toronto and OG Anunoby added 18, but the Raptors couldn't finish the upset-proof final minutes after forcing overtime. Milwaukee went a perfect 7 for 7 at the line and advanced with its second straight upset series, knocking out the No. 1 seed in three games.`
  }
];

// Top performers across the series
export const seriesLeaders = {
  bucks: {
    scoring: [
      { player: "R.J. Barrett", total: 114, avg: 38.0, games: [31, 30, 53] },
      { player: "F. VanVleet", total: 58, avg: 19.3, games: [20, 19, 19] },
      { player: "B. Adebayo", total: 30, avg: 10.0, games: [5, 11, 14] }
    ],
    rebounds: [
      { player: "S. Adams", total: 26, avg: 8.7, games: [11, 4, 11] },
      { player: "Y. Missi", total: 28, avg: 9.3, games: [10, 6, 12] },
      { player: "J. McDaniels", total: 17, avg: 5.7, games: [3, 6, 8] }
    ],
    assists: [
      { player: "F. VanVleet", total: 18, avg: 6.0, games: [6, 5, 7] },
      { player: "R.J. Barrett", total: 15, avg: 5.0, games: [7, 4, 4] }
    ]
  },
  raptors: {
    scoring: [
      { player: "J. Tatum", total: 93, avg: 31.0, games: [19, 24, 50] },
      { player: "P. Pritchard", total: 47, avg: 15.7, games: [14, 14, 19] },
      { player: "O. Anunoby", total: 49, avg: 16.3, games: [20, 11, 18] }
    ],
    rebounds: [
      { player: "J. Valanciunas", total: 17, avg: 5.7, games: [2, 10, 5] },
      { player: "O. Anunoby", total: 15, avg: 5.0, games: [5, 6, 4] },
      { player: "B. Coulibaly", total: 10, avg: 3.3, games: [2, 6, 2] }
    ],
    assists: [
      { player: "P. Pritchard", total: 18, avg: 6.0, games: [6, 5, 7] },
      { player: "J. Tatum", total: 9, avg: 3.0, games: [3, 3, 3] }
    ]
  }
};

// Box score data for all games
export const boxScores: PlayerStats[] = [
  // Game 1 - Bucks
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "R.J. Barrett", min: 18, pts: 31, reb: 1, ast: 7, stl: 0, blk: 0, to: 4, fgm: 13, fga: 21, threePM: 4, threePA: 8, ftm: 1, fta: 2, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "F. VanVleet", min: 18, pts: 20, reb: 4, ast: 6, stl: 0, blk: 0, to: 0, fgm: 8, fga: 23, threePM: 2, threePA: 6, ftm: 2, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "Y. Missi", min: 18, pts: 10, reb: 10, ast: 0, stl: 0, blk: 0, to: 0, fgm: 5, fga: 8, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 7, fls: 0, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "C. Coward", min: 14, pts: 8, reb: 2, ast: 0, stl: 2, blk: 0, to: 0, fgm: 3, fga: 5, threePM: 1, threePA: 2, ftm: 1, fta: 1, or: 1, fls: 0, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "J. McDaniels", min: 20, pts: 8, reb: 3, ast: 1, stl: 2, blk: 0, to: 5, fgm: 3, fga: 7, threePM: 2, threePA: 5, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "K. George", min: 14, pts: 7, reb: 3, ast: 3, stl: 0, blk: 0, to: 0, fgm: 3, fga: 5, threePM: 0, threePA: 2, ftm: 1, fta: 1, or: 0, fls: 2, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "S. Adams", min: 14, pts: 6, reb: 11, ast: 1, stl: 1, blk: 0, to: 0, fgm: 3, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 7, fls: 0, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "B. Adebayo", min: 18, pts: 5, reb: 5, ast: 1, stl: 0, blk: 0, to: 1, fgm: 2, fga: 4, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 1, fls: 0, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "N. Jovic", min: 14, pts: 4, reb: 1, ast: 1, stl: 1, blk: 0, to: 0, fgm: 1, fga: 2, threePM: 0, threePA: 0, ftm: 2, fta: 2, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "G.G. Jackson", min: 12, pts: 2, reb: 1, ast: 0, stl: 0, blk: 0, to: 1, fgm: 1, fga: 2, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 1 - Raptors
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "O. Anunoby", min: 20, pts: 20, reb: 5, ast: 1, stl: 1, blk: 0, to: 1, fgm: 8, fga: 14, threePM: 4, threePA: 7, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Tatum", min: 21, pts: 19, reb: 4, ast: 3, stl: 2, blk: 0, to: 4, fgm: 9, fga: 15, threePM: 1, threePA: 5, ftm: 0, fta: 0, or: 0, fls: 3, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "P. Pritchard", min: 19, pts: 14, reb: 1, ast: 6, stl: 2, blk: 0, to: 1, fgm: 6, fga: 13, threePM: 2, threePA: 6, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "R. Holland", min: 13, pts: 8, reb: 1, ast: 1, stl: 0, blk: 0, to: 2, fgm: 4, fga: 5, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 1, fls: 0, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Richardson", min: 14, pts: 8, reb: 2, ast: 1, stl: 1, blk: 0, to: 2, fgm: 4, fga: 5, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "K. Olynyk", min: 6, pts: 7, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 3, fga: 4, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Valanciunas", min: 17, pts: 6, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 3, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "B. Bogdanovic", min: 7, pts: 5, reb: 1, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 5, threePM: 1, threePA: 5, ftm: 2, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "B. Coulibaly", min: 22, pts: 4, reb: 2, ast: 2, stl: 3, blk: 0, to: 1, fgm: 2, fga: 4, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 6, dnp: false },
  { game: "Game 1", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Nurkic", min: 9, pts: 2, reb: 4, ast: 1, stl: 1, blk: 0, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 2 - Bucks
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "R.J. Barrett", min: 14, pts: 30, reb: 4, ast: 4, stl: 3, blk: 1, to: 3, fgm: 13, fga: 24, threePM: 4, threePA: 10, ftm: 0, fta: 1, or: 1, fls: 0, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "F. VanVleet", min: 20, pts: 19, reb: 1, ast: 5, stl: 4, blk: 0, to: 2, fgm: 7, fga: 18, threePM: 3, threePA: 8, ftm: 2, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "G.G. Jackson", min: 13, pts: 15, reb: 3, ast: 1, stl: 0, blk: 1, to: 1, fgm: 7, fga: 8, threePM: 1, threePA: 1, ftm: 0, fta: 1, or: 1, fls: 2, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "B. Adebayo", min: 18, pts: 11, reb: 10, ast: 1, stl: 0, blk: 0, to: 5, fgm: 4, fga: 10, threePM: 1, threePA: 2, ftm: 2, fta: 2, or: 0, fls: 2, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "C. Coward", min: 18, pts: 9, reb: 2, ast: 1, stl: 4, blk: 0, to: 1, fgm: 4, fga: 8, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "Y. Missi", min: 13, pts: 8, reb: 6, ast: 1, stl: 1, blk: 1, to: 0, fgm: 4, fga: 5, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 3, fls: 0, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "N. Jovic", min: 19, pts: 6, reb: 4, ast: 3, stl: 0, blk: 0, to: 3, fgm: 2, fga: 3, threePM: 2, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 3, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "J. McDaniels", min: 19, pts: 5, reb: 6, ast: 1, stl: 0, blk: 0, to: 3, fgm: 2, fga: 6, threePM: 1, threePA: 2, ftm: 0, fta: 2, or: 1, fls: 0, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "K. George", min: 13, pts: 2, reb: 1, ast: 0, stl: 0, blk: 0, to: 1, fgm: 0, fga: 2, threePM: 0, threePA: 1, ftm: 2, fta: 2, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "S. Adams", min: 10, pts: 2, reb: 4, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 3, fls: 2, dnp: false },
  // Game 2 - Raptors
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Tatum", min: 22, pts: 24, reb: 7, ast: 3, stl: 2, blk: 1, to: 3, fgm: 10, fga: 23, threePM: 3, threePA: 10, ftm: 1, fta: 1, or: 0, fls: 2, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "P. Pritchard", min: 21, pts: 14, reb: 2, ast: 5, stl: 0, blk: 0, to: 4, fgm: 5, fga: 9, threePM: 1, threePA: 4, ftm: 3, fta: 3, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "C. Murray-Boyles", min: 10, pts: 13, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 5, fga: 8, threePM: 0, threePA: 0, ftm: 3, fta: 3, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Valanciunas", min: 20, pts: 12, reb: 10, ast: 1, stl: 0, blk: 1, to: 3, fgm: 4, fga: 7, threePM: 0, threePA: 1, ftm: 4, fta: 4, or: 5, fls: 0, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "O. Anunoby", min: 27, pts: 11, reb: 6, ast: 1, stl: 2, blk: 1, to: 2, fgm: 4, fga: 12, threePM: 1, threePA: 8, ftm: 2, fta: 2, or: 0, fls: 5, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Richardson", min: 8, pts: 9, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 4, fga: 4, threePM: 0, threePA: 0, ftm: 1, fta: 1, or: 0, fls: 1, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "R. Holland", min: 9, pts: 8, reb: 1, ast: 0, stl: 2, blk: 0, to: 0, fgm: 3, fga: 3, threePM: 0, threePA: 0, ftm: 2, fta: 2, or: 0, fls: 3, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "B. Bogdanovic", min: 4, pts: 7, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 3, fga: 5, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "B. Coulibaly", min: 24, pts: 3, reb: 6, ast: 2, stl: 1, blk: 0, to: 3, fgm: 1, fga: 5, threePM: 1, threePA: 3, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 2", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Small", min: 2, pts: 2, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  // Game 3 - Bucks
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "R.J. Barrett", min: 23, pts: 53, reb: 2, ast: 4, stl: 0, blk: 0, to: 3, fgm: 22, fga: 39, threePM: 6, threePA: 19, ftm: 3, fta: 3, or: 1, fls: 1, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "F. VanVleet", min: 22, pts: 19, reb: 1, ast: 7, stl: 0, blk: 0, to: 4, fgm: 7, fga: 16, threePM: 1, threePA: 5, ftm: 4, fta: 4, or: 0, fls: 4, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "J. McDaniels", min: 22, pts: 14, reb: 8, ast: 2, stl: 3, blk: 0, to: 0, fgm: 6, fga: 9, threePM: 2, threePA: 2, ftm: 0, fta: 0, or: 5, fls: 2, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "B. Adebayo", min: 22, pts: 14, reb: 6, ast: 3, stl: 0, blk: 0, to: 3, fgm: 7, fga: 10, threePM: 0, threePA: 2, ftm: 0, fta: 0, or: 2, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "Y. Missi", min: 22, pts: 8, reb: 12, ast: 1, stl: 0, blk: 0, to: 1, fgm: 4, fga: 10, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 6, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "C. Coward", min: 13, pts: 5, reb: 2, ast: 0, stl: 1, blk: 0, to: 1, fgm: 2, fga: 3, threePM: 1, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "K. George", min: 14, pts: 4, reb: 0, ast: 1, stl: 1, blk: 0, to: 0, fgm: 2, fga: 3, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "N. Jovic", min: 14, pts: 4, reb: 2, ast: 1, stl: 0, blk: 0, to: 1, fgm: 2, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "S. Adams", min: 14, pts: 2, reb: 11, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 5, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Milwaukee Bucks", opponent: "Toronto Raptors", player: "G.G. Jackson", min: 14, pts: 0, reb: 3, ast: 1, stl: 1, blk: 0, to: 0, fgm: 0, fga: 1, threePM: 0, threePA: 1, ftm: 0, fta: 0, or: 1, fls: 1, dnp: false },
  // Game 3 - Raptors
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Tatum", min: 26, pts: 50, reb: 3, ast: 3, stl: 0, blk: 0, to: 1, fgm: 22, fga: 29, threePM: 4, threePA: 7, ftm: 2, fta: 2, or: 0, fls: 2, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "P. Pritchard", min: 18, pts: 19, reb: 2, ast: 7, stl: 0, blk: 0, to: 4, fgm: 9, fga: 15, threePM: 1, threePA: 5, ftm: 0, fta: 0, or: 0, fls: 2, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "O. Anunoby", min: 24, pts: 18, reb: 4, ast: 1, stl: 5, blk: 1, to: 2, fgm: 7, fga: 10, threePM: 4, threePA: 6, ftm: 0, fta: 0, or: 0, fls: 6, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Richardson", min: 19, pts: 9, reb: 1, ast: 3, stl: 1, blk: 0, to: 0, fgm: 4, fga: 6, threePM: 1, threePA: 2, ftm: 0, fta: 0, or: 0, fls: 3, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "R. Holland", min: 12, pts: 7, reb: 4, ast: 1, stl: 0, blk: 0, to: 0, fgm: 3, fga: 4, threePM: 0, threePA: 0, ftm: 1, fta: 4, or: 0, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "B. Bogdanovic", min: 14, pts: 7, reb: 0, ast: 3, stl: 4, blk: 0, to: 2, fgm: 3, fga: 7, threePM: 1, threePA: 3, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "J. Valanciunas", min: 17, pts: 4, reb: 5, ast: 1, stl: 1, blk: 1, to: 1, fgm: 2, fga: 4, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 1, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "B. Coulibaly", min: 22, pts: 2, reb: 2, ast: 2, stl: 0, blk: 0, to: 1, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "C. Murray-Boyles", min: 10, pts: 2, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 1, fls: 0, dnp: false },
  { game: "Game 3 (OT)", team: "Toronto Raptors", opponent: "Milwaukee Bucks", player: "K. Olynyk", min: 3, pts: 2, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1, threePM: 0, threePA: 0, ftm: 0, fta: 0, or: 0, fls: 0, dnp: false }
];
