export interface TradePlayer {
  name: string;
  overall: number;
  note?: string;
}

export interface TradeTeam {
  teamName: string;
  receives: TradePlayer[];
}

export interface Trade {
  id: string;
  title: string;
  teams: [TradeTeam, TradeTeam];
  analysis: string;
  category?: string;
}

export const season17Trades: Trade[] = [
  {
    id: "TRD-S17-001",
    title: "Nets Acquire Nikola Jokic; Bucks Retool with Elite Defense",
    category: "Blockbuster Trade",
    teams: [
      {
        teamName: "Brooklyn Nets",
        receives: [
          { name: "Nikola Jokic", overall: 98 },
          { name: "Aaron Gordon", overall: 83 },
          { name: "Mark Sears", overall: 70 }
        ]
      },
      {
        teamName: "Milwaukee Bucks",
        receives: [
          { name: "Bam Adebayo", overall: 89 },
          { name: "Jimmy Butler", overall: 88 },
          { name: "Naz Reid", overall: 82 }
        ]
      }
    ],
    analysis: "The Nets go all-in on championship contention by acquiring 98 OVR Nikola Jokic. Milwaukee pivots to an elite defensive identity, adding +31 badges and three versatile two-way players who can guard multiple positions."
  },
  {
    id: "TRD-S17-002",
    title: "Cavs Add Veteran Depth; Blazers Bet on Morant's Upside",
    category: "Blockbuster Trade",
    teams: [
      {
        teamName: "Cleveland Cavaliers",
        receives: [
          { name: "Julius Randle", overall: 88 },
          { name: "Dejounte Murray", overall: 81 },
          { name: "Khris Middleton", overall: 78 }
        ]
      },
      {
        teamName: "Portland Trail Blazers",
        receives: [
          { name: "Ja Morant", overall: 89, note: "Dynamic PG" },
          { name: "Brandon Miller", overall: 82 },
          { name: "Isaac Okoro", overall: 74 }
        ]
      }
    ],
    analysis: "Cleveland adds three proven veterans to bolster their playoff push, gaining depth and experience. Portland takes a calculated risk on Ja Morant's explosive upside, pairing him with young talent Brandon Miller to build for the future."
  },
  {
    id: "TRD-S17-003",
    title: "Cavs Flip Randle to Land Superstar Anthony Edwards",
    category: "Blockbuster Trade",
    teams: [
      {
        teamName: "Cleveland Cavaliers",
        receives: [
          { name: "Anthony Edwards", overall: 95, note: "Superstar SG" },
          { name: "Cam Johnson", overall: 79 },
          { name: "Donte DiVincenzo", overall: 78 }
        ]
      },
      {
        teamName: "Orlando Magic",
        receives: [
          { name: "Amen Thompson", overall: 87 },
          { name: "Julius Randle", overall: 88 },
          { name: "Andre Drummond", overall: 76 }
        ]
      }
    ],
    analysis: "Cleveland immediately flips Julius Randle to Orlando in exchange for 95 OVR superstar Anthony Edwards. The Cavs now boast one of the league's most explosive scoring duos, while Orlando adds veteran frontcourt depth with Randle and Drummond."
  },
  {
    id: "TRD-S17-004",
    title: "Trae Young Heads to Broadway in Star Swap for Sabonis",
    category: "Blockbuster Trade",
    teams: [
      {
        teamName: "New York Knicks",
        receives: [
          { name: "Trae Young", overall: 88, note: "Elite Playmaker" },
          { name: "Collin Murray-Boyles", overall: 77 }
        ]
      },
      {
        teamName: "Atlanta Hawks",
        receives: [
          { name: "Domantas Sabonis", overall: 85 },
          { name: "Jordan Poole", overall: 80 }
        ]
      }
    ],
    analysis: "The Knicks land elite playmaker Trae Young to run their offense at Madison Square Garden. Atlanta pivots to a frontcourt-focused rebuild around Sabonis's passing and rebounding, adding Poole's scoring punch in the backcourt."
  },
  {
    id: "TRD-S17-005",
    title: "Blazers Bolster Defense; Hornets Bet on Brandon Miller",
    category: "Blockbuster Trade",
    teams: [
      {
        teamName: "Portland Trail Blazers",
        receives: [
          { name: "Jaime Jaquez Jr.", overall: 80 },
          { name: "Robert Williams III", overall: 78, note: "Rim Protector" }
        ]
      },
      {
        teamName: "Charlotte Hornets",
        receives: [
          { name: "Brandon Miller", overall: 82, note: "Rising Star" },
          { name: "Adem Bona", overall: 74 }
        ]
      }
    ],
    analysis: "Portland adds defensive versatility with Jaquez Jr. and elite rim protection from Robert Williams III to complement Ja Morant. Charlotte doubles down on youth, acquiring Brandon Miller to build around their young core for the future."
  },
  {
    id: "TRD-S17-006",
    title: "Blockbuster: Spida to Jazz, LaMelo to Blazers",
    category: "Blockbuster Trade",
    teams: [
      {
        teamName: "Portland Trail Blazers",
        receives: [
          { name: "LaMelo Ball", overall: 88, note: "Elite Playmaker" },
          { name: "Miles Bridges", overall: 82 },
          { name: "Bennedict Mathurin", overall: 81 }
        ]
      },
      {
        teamName: "Utah Jazz",
        receives: [
          { name: "Donovan Mitchell", overall: 93, note: "Superstar SG" },
          { name: "Jerami Grant", overall: 81 },
          { name: "Saddiq Bey", overall: 76 }
        ]
      }
    ],
    analysis: "Portland acquires LaMelo Ball to lead their offense alongside Ja Morant, creating one of the league's most dynamic backcourts. Utah brings Donovan \"Spida\" Mitchell back home, reuniting him with the franchise where he became a star. The Jazz add veteran depth with Grant and Bey to support Mitchell's return."
  },
  {
    id: "TRD-S17-007",
    title: "Pistons Swap LaVine for Ingram in Star Wing Trade",
    category: "Star Wing Trade",
    teams: [
      {
        teamName: "Detroit Pistons",
        receives: [
          { name: "Brandon Ingram", overall: 87, note: "Versatile Wing" }
        ]
      },
      {
        teamName: "New Orleans Pelicans",
        receives: [
          { name: "Zach LaVine", overall: 88, note: "Elite Scorer" }
        ]
      }
    ],
    analysis: "Detroit acquires Brandon Ingram's versatile two-way game to complement their young core, trading away Zach LaVine's elite scoring. New Orleans adds LaVine's offensive firepower to support their 'Fab Five' rookie lineup, hoping his veteran presence can accelerate their development."
  }
];
