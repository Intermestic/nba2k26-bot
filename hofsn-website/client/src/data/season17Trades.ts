export interface Trade {
  id: string;
  teamA: string;
  teamB: string;
  teamAReceives: Array<{ player: string; overall: number }>;
  teamBReceives: Array<{ player: string; overall: number }>;
  headline: string;
}

export const season17Trades: Trade[] = [
  {
    id: "TRD-S17-001",
    teamA: "BKN",
    teamB: "MIL",
    teamAReceives: [
      { player: "Nikola Jokic", overall: 98 },
      { player: "Aaron Gordon", overall: 83 },
      { player: "Mark Sears", overall: 70 }
    ],
    teamBReceives: [
      { player: "Bam Adebayo", overall: 89 },
      { player: "Jimmy Butler", overall: 88 },
      { player: "Naz Reid", overall: 82 }
    ],
    headline: "Nets acquire MVP Jokic; Bucks retool with elite defense (+31 Badges)"
  },
  {
    id: "TRD-S17-002",
    teamA: "CLE",
    teamB: "POR",
    teamAReceives: [
      { player: "Julius Randle", overall: 88 },
      { player: "Dejounte Murray", overall: 81 },
      { player: "Khris Middleton", overall: 78 }
    ],
    teamBReceives: [
      { player: "Ja Morant", overall: 89 },
      { player: "Brandon Miller", overall: 82 },
      { player: "Isaac Okoro", overall: 74 }
    ],
    headline: "Cavs add veteran depth; Blazers bet on Morant's upside"
  },
  {
    id: "TRD-S17-003",
    teamA: "CLE",
    teamB: "ORL",
    teamAReceives: [
      { player: "Anthony Edwards", overall: 95 },
      { player: "Cam Johnson", overall: 79 },
      { player: "Donte DiVincenzo", overall: 78 }
    ],
    teamBReceives: [
      { player: "Amen Thompson", overall: 87 },
      { player: "Julius Randle", overall: 88 },
      { player: "Andre Drummond", overall: 76 }
    ],
    headline: "Cavs flip Randle to land superstar Anthony Edwards"
  },
  {
    id: "TRD-S17-004",
    teamA: "NYK",
    teamB: "ATL",
    teamAReceives: [
      { player: "Trae Young", overall: 88 },
      { player: "Collin Murray-Boyles", overall: 77 }
    ],
    teamBReceives: [
      { player: "Domantas Sabonis", overall: 85 },
      { player: "Jordan Poole", overall: 80 }
    ],
    headline: "Trae Young heads to Broadway in star swap for Sabonis"
  },
  {
    id: "TRD-S17-005",
    teamA: "POR",
    teamB: "CHA",
    teamAReceives: [
      { player: "Jaime Jaquez Jr.", overall: 80 },
      { player: "Robert Williams III", overall: 78 }
    ],
    teamBReceives: [
      { player: "Brandon Miller", overall: 82 },
      { player: "Adem Bona", overall: 74 }
    ],
    headline: "Blazers bolster defense; Hornets bet on Brandon Miller"
  },
  {
    id: "TRD-S17-006",
    teamA: "POR",
    teamB: "UTA",
    teamAReceives: [
      { player: "LaMelo Ball", overall: 88 },
      { player: "Miles Bridges", overall: 82 },
      { player: "Bennedict Mathurin", overall: 81 }
    ],
    teamBReceives: [
      { player: "Donovan Mitchell", overall: 93 },
      { player: "Jerami Grant", overall: 81 },
      { player: "Saddiq Bey", overall: 76 }
    ],
    headline: "Blockbuster: Spida to Jazz, LaMelo to Blazers"
  },
  {
    id: "TRD-S17-007",
    teamA: "DET",
    teamB: "NOP",
    teamAReceives: [
      { player: "Brandon Ingram", overall: 87 }
    ],
    teamBReceives: [
      { player: "Zach LaVine", overall: 88 }
    ],
    headline: "Pistons swap LaVine for Ingram in star wing trade"
  }
];
