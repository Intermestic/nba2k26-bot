import Papa from 'papaparse';

/**
 * CSV Parser for HoFBA Series Data
 * 
 * Expected CSV format:
 * - Tabs for Game#_Box, Game#_Summary, Series_Summary
 * - Box score columns: Player, Team, PTS, REB, AST, STL, BLK, FG%, 3P%, FT%, etc.
 * - Summary columns: Beat reporter content, series analysis
 */

export interface PlayerBoxScore {
  player: string;
  team: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
}

export interface GameSummary {
  gameNumber: number;
  beatReporterContent: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  boxScores: PlayerBoxScore[];
}

export interface SeriesSummary {
  winningTeam: string;
  losingTeam: string;
  seriesScore: string; // e.g., "2-1"
  round: string; // e.g., "First Round"
  mvpPlayer: string;
  mvpTeam: string;
  mvpStats: {
    ppg: number;
    rpg: number;
    apg: number;
  };
  keyMoment: string;
  narrativeSummary: string;
}

export interface ParsedCSVData {
  games: GameSummary[];
  seriesSummary: SeriesSummary;
}

/**
 * Parse CSV file containing series data
 * @param csvContent - Raw CSV file content as string
 * @returns Parsed game and series data
 */
export async function parseSeriesCSV(csvContent: string): Promise<ParsedCSVData> {
  // Parse CSV with Papa Parse
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: 'greedy', // Skip empty lines and relax validation
    dynamicTyping: true,
  });

  // Only fail on critical errors, not field count mismatches
  const criticalErrors = parsed.errors.filter(e => 
    e.type !== 'FieldMismatch' && e.code !== 'TooFewFields' && e.code !== 'TooManyFields'
  );
  
  if (criticalErrors.length > 0) {
    console.error('CSV parsing errors:', criticalErrors);
    throw new Error(`CSV parsing failed: ${criticalErrors[0].message}`);
  }

  const rows = parsed.data as any[];
  
  // Extract games and series summary
  const games: GameSummary[] = [];
  let seriesSummary: SeriesSummary | null = null;

  // Group rows by game (assuming rows are labeled with game number)
  const gameGroups = new Map<number, any[]>();
  const summaryRows: any[] = [];

  for (const row of rows) {
    if (row.Type === 'Game') {
      const gameNum = parseInt(row.GameNumber);
      if (!gameGroups.has(gameNum)) {
        gameGroups.set(gameNum, []);
      }
      gameGroups.get(gameNum)!.push(row);
    } else if (row.Type === 'Series') {
      summaryRows.push(row);
    }
  }

  // Parse each game
  for (const [gameNum, gameRows] of Array.from(gameGroups.entries())) {
    const boxScores: PlayerBoxScore[] = [];
    let beatReporterContent = '';
    let homeTeam = '';
    let awayTeam = '';
    let homeScore = 0;
    let awayScore = 0;

    for (const row of gameRows) {
      if (row.Player) {
        // Box score row
        boxScores.push({
          player: row.Player,
          team: row.Team,
          pts: parseFloat(row.PTS) || 0,
          reb: parseFloat(row.REB) || 0,
          ast: parseFloat(row.AST) || 0,
          stl: parseFloat(row.STL) || 0,
          blk: parseFloat(row.BLK) || 0,
          fgPct: parseFloat(row['FG%']) || 0,
          threePct: parseFloat(row['3P%']) || 0,
          ftPct: parseFloat(row['FT%']) || 0,
        });
      }

      if (row.BeatReporter) {
        beatReporterContent = row.BeatReporter;
      }

      if (row.HomeTeam) homeTeam = row.HomeTeam;
      if (row.AwayTeam) awayTeam = row.AwayTeam;
      if (row.HomeScore) homeScore = parseInt(row.HomeScore);
      if (row.AwayScore) awayScore = parseInt(row.AwayScore);
    }

    games.push({
      gameNumber: gameNum,
      beatReporterContent,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      boxScores,
    });
  }

  // Parse series summary
  if (summaryRows.length > 0) {
    const summary = summaryRows[0];
    seriesSummary = {
      winningTeam: summary.WinningTeam || '',
      losingTeam: summary.LosingTeam || '',
      seriesScore: summary.SeriesScore || '',
      round: summary.Round || 'First Round',
      mvpPlayer: summary.MVPPlayer || '',
      mvpTeam: summary.MVPTeam || '',
      mvpStats: {
        ppg: parseFloat(summary.MVP_PPG) || 0,
        rpg: parseFloat(summary.MVP_RPG) || 0,
        apg: parseFloat(summary.MVP_APG) || 0,
      },
      keyMoment: summary.KeyMoment || '',
      narrativeSummary: summary.NarrativeSummary || '',
    };
  }

  if (!seriesSummary) {
    throw new Error('No series summary found in CSV');
  }

  return {
    games,
    seriesSummary,
  };
}

/**
 * Calculate series MVP from game data
 */
export function calculateSeriesMVP(games: GameSummary[]): {
  player: string;
  team: string;
  stats: { ppg: number; rpg: number; apg: number };
} {
  const playerStats = new Map<string, { 
    team: string;
    totalPts: number;
    totalReb: number;
    totalAst: number;
    games: number;
  }>();

  // Aggregate stats across all games
  for (const game of games) {
    for (const boxScore of game.boxScores) {
      const key = boxScore.player;
      if (!playerStats.has(key)) {
        playerStats.set(key, {
          team: boxScore.team,
          totalPts: 0,
          totalReb: 0,
          totalAst: 0,
          games: 0,
        });
      }
      const stats = playerStats.get(key)!;
      stats.totalPts += boxScore.pts;
      stats.totalReb += boxScore.reb;
      stats.totalAst += boxScore.ast;
      stats.games += 1;
    }
  }

  // Find MVP (highest PPG)
  let mvpPlayer = '';
  let mvpTeam = '';
  let maxPPG = 0;
  let mvpStats = { ppg: 0, rpg: 0, apg: 0 };

  for (const [player, stats] of Array.from(playerStats.entries())) {
    const ppg = stats.totalPts / stats.games;
    if (ppg > maxPPG) {
      maxPPG = ppg;
      mvpPlayer = player;
      mvpTeam = stats.team;
      mvpStats = {
        ppg: Math.round(ppg * 10) / 10,
        rpg: Math.round((stats.totalReb / stats.games) * 10) / 10,
        apg: Math.round((stats.totalAst / stats.games) * 10) / 10,
      };
    }
  }

  return {
    player: mvpPlayer,
    team: mvpTeam,
    stats: mvpStats,
  };
}
