// Comprehensive Trophy Case Database
// All award winners across league history

export interface PlayerAwardHistory {
  playerName: string;
  mvpSeasons: number[];
  dpoySeasons: number[];
  sixthManSeasons: number[];
  roySeasons: number[];
}

// Parse all award winners from league history
export const allAwardWinners: Record<string, PlayerAwardHistory> = {
  // Season 17
  "Brandon Ingram": {
    playerName: "Brandon Ingram",
    mvpSeasons: [17],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Jamir Watkins": {
    playerName: "Jamir Watkins",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: [17]
  },
  "Kentavious Caldwell-Pope": {
    playerName: "Kentavious Caldwell-Pope",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [17],
    roySeasons: []
  },
  
  // Season 16
  "Luka Dončić": {
    playerName: "Luka Dončić",
    mvpSeasons: [16],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Stephen Curry": {
    playerName: "Stephen Curry",
    mvpSeasons: [16],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Jalen Suggs": {
    playerName: "Jalen Suggs",
    mvpSeasons: [13],
    dpoySeasons: [17, 16, 13],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Brandin Podziemski": {
    playerName: "Brandin Podziemski",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [16],
    roySeasons: []
  },
  "Ace Bailey": {
    playerName: "Ace Bailey",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: [16]
  },
  
  // Season 15
  "Collin Sexton": {
    playerName: "Collin Sexton",
    mvpSeasons: [15],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Dyson Daniels": {
    playerName: "Dyson Daniels",
    mvpSeasons: [],
    dpoySeasons: [15],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Devin Carter": {
    playerName: "Devin Carter",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [15],
    roySeasons: [15]
  },
  
  // Season 14
  "Tyrese Haliburton": {
    playerName: "Tyrese Haliburton",
    mvpSeasons: [14, 8],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Amen Thompson": {
    playerName: "Amen Thompson",
    mvpSeasons: [],
    dpoySeasons: [14],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Immanuel Quickley": {
    playerName: "Immanuel Quickley",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [14],
    roySeasons: []
  },
  "Isaiah Collier": {
    playerName: "Isaiah Collier",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: [14]
  },
  
  // Season 13 - Jalen Suggs already added above
  "Miles Bridges": {
    playerName: "Miles Bridges",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [13],
    roySeasons: []
  },
  "Matas Buzelis": {
    playerName: "Matas Buzelis",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: [13, 11]
  },
  
  // Season 12
  "Anthony Edwards": {
    playerName: "Anthony Edwards",
    mvpSeasons: [12],
    dpoySeasons: [12],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Russell Westbrook": {
    playerName: "Russell Westbrook",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [12],
    roySeasons: []
  },
  "Alex Sarr": {
    playerName: "Alex Sarr",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: [12]
  },
  
  // Season 11
  "Nikola Jokic": {
    playerName: "Nikola Jokic",
    mvpSeasons: [11],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Alex Caruso": {
    playerName: "Alex Caruso",
    mvpSeasons: [],
    dpoySeasons: [11, 10],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Shaedon Sharpe": {
    playerName: "Shaedon Sharpe",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [11],
    roySeasons: []
  },
  
  // Season 10
  "Donovan Mitchell": {
    playerName: "Donovan Mitchell",
    mvpSeasons: [10],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Cam Thomas": {
    playerName: "Cam Thomas",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [10],
    roySeasons: []
  },
  "Ausar Thompson": {
    playerName: "Ausar Thompson",
    mvpSeasons: [],
    dpoySeasons: [8],
    sixthManSeasons: [],
    roySeasons: [10, 9, 8, 7, 5] // 5 ROY awards total per Discord trophy case
  },
  
  // Season 9
  "Kevin Durant": {
    playerName: "Kevin Durant",
    mvpSeasons: [9],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Nic Claxton": {
    playerName: "Nic Claxton",
    mvpSeasons: [],
    dpoySeasons: [9],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Obi Toppin": {
    playerName: "Obi Toppin",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [9],
    roySeasons: []
  },
  
  // Season 8 - Tyrese Haliburton and Ausar Thompson already added
  "Bol Bol": {
    playerName: "Bol Bol",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [8],
    roySeasons: []
  },
  "Victor Wembanyama": {
    playerName: "Victor Wembanyama",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: [8, 4]
  },
  
  // Season 7
  "Joel Embiid": {
    playerName: "Joel Embiid",
    mvpSeasons: [7],
    dpoySeasons: [7],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Tobias Harris": {
    playerName: "Tobias Harris",
    mvpSeasons: [],
    dpoySeasons: [],
    sixthManSeasons: [7, 5, 4],
    roySeasons: []
  },
  
  // Season 5
  "De'Aaron Fox": {
    playerName: "De'Aaron Fox",
    mvpSeasons: [5],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "DeMar DeRozan": {
    playerName: "DeMar DeRozan",
    mvpSeasons: [5],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  
  // Season 4
  "LeBron James": {
    playerName: "LeBron James",
    mvpSeasons: [4],
    dpoySeasons: [],
    sixthManSeasons: [],
    roySeasons: []
  },
  "Anthony Davis": {
    playerName: "Anthony Davis",
    mvpSeasons: [],
    dpoySeasons: [4],
    sixthManSeasons: [],
    roySeasons: []
  }
};

// Helper function to get all players sorted by total awards
export const getAllPlayersSortedByAwards = (): PlayerAwardHistory[] => {
  return Object.values(allAwardWinners).sort((a, b) => {
    const aTotal = a.mvpSeasons.length + a.dpoySeasons.length + a.sixthManSeasons.length + a.roySeasons.length;
    const bTotal = b.mvpSeasons.length + b.dpoySeasons.length + b.sixthManSeasons.length + b.roySeasons.length;
    return bTotal - aTotal;
  });
};

// Helper function to get total awards for a player
export const getTotalAwardsForPlayer = (playerName: string): number => {
  const player = allAwardWinners[playerName];
  if (!player) return 0;
  return player.mvpSeasons.length + player.dpoySeasons.length + player.sixthManSeasons.length + player.roySeasons.length;
};
