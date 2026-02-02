// Player Trophy Case Database
// Tracks major award wins across all seasons

export interface PlayerAward {
  season: number;
  award: 'MVP' | '6MOY' | 'DPOY' | 'ROY';
  team: string;
  stats?: string;
}

export interface PlayerTrophyCase {
  playerName: string;
  awards: PlayerAward[];
  mvpCount: number;
  sixthManCount: number;
  dpoyCount: number;
  royCount: number;
}

// Trophy case data for all players who have won major awards
export const trophyCaseData: Record<string, PlayerTrophyCase> = {
  // Season 17 Award Winners
  "Brandon Ingram": {
    playerName: "Brandon Ingram",
    awards: [
      {
        season: 17,
        award: 'MVP',
        team: 'DET',
        stats: '38.80 PPG | FG 60.7% | 3P 50.4% | FT 90.9%'
      }
    ],
    mvpCount: 1,
    sixthManCount: 0,
    dpoyCount: 0,
    royCount: 0
  },
  "Jalen Suggs": {
    playerName: "Jalen Suggs",
    awards: [
      {
        season: 17,
        award: 'DPOY',
        team: 'WAS',
        stats: 'DIS 88.00 | OppFG 43.97% | 2.07 SPG'
      },
      {
        season: 16,
        award: 'DPOY',
        team: 'WAS',
        stats: 'OppFG% 45.1 | DIS 76.97 | 116 STL (Top 5) | 13 BLK'
      }
    ],
    mvpCount: 0,
    sixthManCount: 0,
    dpoyCount: 2,
    royCount: 0
  },
  "Jamir Watkins": {
    playerName: "Jamir Watkins",
    awards: [
      {
        season: 17,
        award: 'ROY',
        team: 'DET',
        stats: '13.69 PPG | 2.73 APG | +/- 502'
      }
    ],
    mvpCount: 0,
    sixthManCount: 0,
    dpoyCount: 0,
    royCount: 1
  },
  "Kentavious Caldwell-Pope": {
    playerName: "Kentavious Caldwell-Pope",
    awards: [
      {
        season: 17,
        award: '6MOY',
        team: 'DEN',
        stats: '17.23 PPG | FG 62.0% | 3P 62.0%'
      }
    ],
    mvpCount: 0,
    sixthManCount: 1,
    dpoyCount: 0,
    royCount: 0
  },
  // Season 16 Award Winners
  "Luka Dončić": {
    playerName: "Luka Dončić",
    awards: [
      {
        season: 16,
        award: 'MVP',
        team: 'TOR',
        stats: '31.6 PPG | 10.3 APG | 4.9 RPG | .594 FG% | .472 3P%'
      }
    ],
    mvpCount: 1,
    sixthManCount: 0,
    dpoyCount: 0,
    royCount: 0
  },
  "Stephen Curry": {
    playerName: "Stephen Curry",
    awards: [
      {
        season: 16,
        award: 'MVP',
        team: 'DAL',
        stats: '42.9 PPG | 8.6 APG | 2.4 RPG | .535 FG% | .449 3P%'
      }
    ],
    mvpCount: 1,
    sixthManCount: 0,
    dpoyCount: 0,
    royCount: 0
  },
  "Brandin Podziemski": {
    playerName: "Brandin Podziemski",
    awards: [
      {
        season: 16,
        award: '6MOY',
        team: 'TOR',
        stats: '14.1 PPG | 2.0 RPG | 2.0 APG | .543 FG%'
      }
    ],
    mvpCount: 0,
    sixthManCount: 1,
    dpoyCount: 0,
    royCount: 0
  },
  "Ace Bailey": {
    playerName: "Ace Bailey",
    awards: [
      {
        season: 16,
        award: 'ROY',
        team: 'NOP',
        stats: '19.6 PPG | 3.6 RPG | 1.9 APG | .539 FG% | .432 3P%'
      }
    ],
    mvpCount: 0,
    sixthManCount: 0,
    dpoyCount: 0,
    royCount: 1
  }
};

// Helper function to get player trophy case
export const getPlayerTrophyCase = (playerName: string): PlayerTrophyCase | undefined => {
  return trophyCaseData[playerName];
};

// Helper function to get all MVP winners
export const getMVPWinners = (): PlayerTrophyCase[] => {
  return Object.values(trophyCaseData).filter(player => player.mvpCount > 0);
};

// Helper function to get all DPOY winners
export const getDPOYWinners = (): PlayerTrophyCase[] => {
  return Object.values(trophyCaseData).filter(player => player.dpoyCount > 0);
};

// Helper function to get all 6MOY winners
export const get6MOYWinners = (): PlayerTrophyCase[] => {
  return Object.values(trophyCaseData).filter(player => player.sixthManCount > 0);
};

// Helper function to get all ROY winners
export const getROYWinners = (): PlayerTrophyCase[] => {
  return Object.values(trophyCaseData).filter(player => player.royCount > 0);
};

// Helper function to get total awards for a player
export const getTotalAwards = (playerName: string): number => {
  const trophyCase = getPlayerTrophyCase(playerName);
  if (!trophyCase) return 0;
  return trophyCase.mvpCount + trophyCase.sixthManCount + trophyCase.dpoyCount + trophyCase.royCount;
};
