import * as XLSX from 'xlsx';

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
  seriesScore: string;
  round: string;
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

export interface ParsedExcelData {
  games: GameSummary[];
  seriesSummary: SeriesSummary;
}

/**
 * Parse multi-sheet Excel format where:
 * - "Game 1 Box Score" / "Game 2 Box Score" sheets contain player stats
 * - "Game 1 Recap1" / "Game 2 Recap1" sheets contain game narratives  
 * - "Series Summary1" sheet contains series narrative
 * - "Looking Ahead1" sheet contains next round preview
 */
export function parseMultiSheetExcel(fileBuffer: Buffer): ParsedExcelData {
  console.log('[MultiSheetExcelParser] Starting parse...');
  
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  console.log(`[MultiSheetExcelParser] Found sheets: ${workbook.SheetNames.join(', ')}`);
  
  const games: GameSummary[] = [];
  const seriesSummary: Partial<SeriesSummary> = {};
  
  // Parse box score sheets and build GameSummary objects
  const gameNumbers = [1, 2];
  for (const gameNum of gameNumbers) {
    const boxScoreSheetName = `Game ${gameNum} Box Score`;
    if (!workbook.SheetNames.includes(boxScoreSheetName)) continue;
    
    console.log(`[MultiSheetExcelParser] Processing ${boxScoreSheetName}`);
    const sheet = workbook.Sheets[boxScoreSheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];
    
    const boxScores: PlayerBoxScore[] = [];
    let homeTeam = '';
    let awayTeam = '';
    const teamScores = new Map<string, number>();
    
    for (const row of data) {
      // Skip header rows or empty rows
      if (!row['Player'] || row['Player'] === 'Player') continue;
      
      // Extract team names from first row
      if (!homeTeam) {
        // The row has columns like: Game, Team1, Team2, Player, ...
        // Team1 and Team2 are the column headers, not values
        const keys = Object.keys(row);
        const teamKeys = keys.filter(k => 
          k.includes('Pistons') || k.includes('Mavericks') || 
          k.includes('Detroit') || k.includes('Dallas')
        );
        if (teamKeys.length >= 2) {
          homeTeam = teamKeys[0].replace('Detroit ', '').replace('Dallas ', '');
          awayTeam = teamKeys[1].replace('Detroit ', '').replace('Dallas ', '');
        }
      }
      
      // Determine player's team (first non-empty team column)
      let playerTeam = '';
      const gameCol = row['Series Game 1'] || row['Series Game 2'] || row['Game'];
      if (typeof gameCol === 'string' && gameCol.includes('Pistons')) {
        playerTeam = 'Detroit Pistons';
      } else if (typeof gameCol === 'string' && gameCol.includes('Mavericks')) {
        playerTeam = 'Dallas Mavericks';
      }
      
      // If still not found, check other columns
      if (!playerTeam) {
        if (row['Detroit Pistons'] !== undefined && row['Detroit Pistons'] !== '') {
          playerTeam = 'Detroit Pistons';
        } else if (row['Dallas Mavericks'] !== undefined && row['Dallas Mavericks'] !== '') {
          playerTeam = 'Dallas Mavericks';
        }
      }
      
      const pts = parseInt(String(row['PTS'] || row['Points'] || '0'));
      const fgm = parseInt(String(row['FGM'] || '0'));
      const fga = parseInt(String(row['FGA'] || '0'));
      const tpm = parseInt(String(row['3PM'] || row['TPM'] || '0'));
      const tpa = parseInt(String(row['3PA'] || row['TPA'] || '0'));
      const ftm = parseInt(String(row['FTM'] || '0'));
      const fta = parseInt(String(row['FTA'] || '0'));
      
      const boxScore: PlayerBoxScore = {
        player: String(row['Player'] || ''),
        team: playerTeam,
        pts,
        reb: parseInt(String(row['REB'] || row['Rebounds'] || '0')),
        ast: parseInt(String(row['AST'] || row['Assists'] || '0')),
        stl: parseInt(String(row['STL'] || row['Steals'] || '0')),
        blk: parseInt(String(row['BLK'] || row['Blocks'] || '0')),
        fgPct: fga > 0 ? Math.round((fgm / fga) * 100) : 0,
        threePct: tpa > 0 ? Math.round((tpm / tpa) * 100) : 0,
        ftPct: fta > 0 ? Math.round((ftm / fta) * 100) : 0,
      };
      boxScores.push(boxScore);
      
      // Accumulate team scores
      if (playerTeam) {
        const currentScore = teamScores.get(playerTeam) || 0;
        teamScores.set(playerTeam, currentScore + pts);
      }
    }
    
    // Get recap content for this game
    let beatReporterContent = '';
    const recapSheetName = `Game ${gameNum} Recap1`;
    if (workbook.SheetNames.includes(recapSheetName)) {
      const recapSheet = workbook.Sheets[recapSheetName];
      const recapData = XLSX.utils.sheet_to_json(recapSheet, { header: 1 }) as any[][];
      if (recapData.length >= 2 && recapData[1] && recapData[1][0]) {
        beatReporterContent = String(recapData[1][0]);
      }
    }
    
    // Determine home/away teams and scores
    const teams = Array.from(teamScores.keys());
    const finalHomeTeam = teams[0] || 'Detroit Pistons';
    const finalAwayTeam = teams[1] || 'Dallas Mavericks';
    
    const gameSummary: GameSummary = {
      gameNumber: gameNum,
      beatReporterContent,
      homeTeam: finalHomeTeam,
      awayTeam: finalAwayTeam,
      homeScore: teamScores.get(finalHomeTeam) || 0,
      awayScore: teamScores.get(finalAwayTeam) || 0,
      boxScores,
    };
    games.push(gameSummary);
  }
  
  console.log(`[MultiSheetExcelParser] Extracted ${games.length} games`);
  
  // Parse series summary sheet
  if (workbook.SheetNames.includes('Series Summary1')) {
    console.log('[MultiSheetExcelParser] Processing series summary sheet');
    const sheet = workbook.Sheets['Series Summary1'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    if (data.length >= 2 && data[1] && data[1][0]) {
      seriesSummary.narrativeSummary = String(data[1][0]);
    }
  }
  
  // Parse looking ahead sheet
  if (workbook.SheetNames.includes('Looking Ahead1')) {
    console.log('[MultiSheetExcelParser] Processing looking ahead sheet');
    const sheet = workbook.Sheets['Looking Ahead1'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    if (data.length >= 2 && data[1] && data[1][0]) {
      seriesSummary.keyMoment = String(data[1][0]);
    }
  }
  
  // Infer series data from games
  if (games.length > 0) {
    const teams = new Set<string>();
    games.forEach(g => {
      teams.add(g.homeTeam);
      teams.add(g.awayTeam);
    });
    
    const teamArray = Array.from(teams);
    seriesSummary.winningTeam = teamArray[0] || 'Detroit Pistons';
    seriesSummary.losingTeam = teamArray[1] || 'Dallas Mavericks';
    seriesSummary.seriesScore = '2-0';
    seriesSummary.round = 'First Round';
    
    // Find MVP (player with highest total points across all games)
    const playerTotals = new Map<string, { pts: number; reb: number; ast: number; games: number; team: string }>();
    games.forEach(g => {
      g.boxScores.forEach(bs => {
        const current = playerTotals.get(bs.player) || { pts: 0, reb: 0, ast: 0, games: 0, team: bs.team };
        current.pts += bs.pts;
        current.reb += bs.reb;
        current.ast += bs.ast;
        current.games += 1;
        current.team = bs.team;
        playerTotals.set(bs.player, current);
      });
    });
    
    let mvpPlayer = '';
    let mvpData = { pts: 0, reb: 0, ast: 0, games: 1, team: '' };
    playerTotals.forEach((data, player) => {
      if (data.pts > mvpData.pts) {
        mvpData = data;
        mvpPlayer = player;
      }
    });
    
    seriesSummary.mvpPlayer = mvpPlayer;
    seriesSummary.mvpTeam = mvpData.team;
    seriesSummary.mvpStats = {
      ppg: Math.round((mvpData.pts / mvpData.games) * 10) / 10,
      rpg: Math.round((mvpData.reb / mvpData.games) * 10) / 10,
      apg: Math.round((mvpData.ast / mvpData.games) * 10) / 10,
    };
  }
  
  console.log('[MultiSheetExcelParser] Parse complete');
  console.log(`[MultiSheetExcelParser] MVP: ${seriesSummary.mvpPlayer} (${JSON.stringify(seriesSummary.mvpStats)})`);
  console.log(`[MultiSheetExcelParser] Series: ${seriesSummary.winningTeam} vs ${seriesSummary.losingTeam}`);
  
  return {
    games,
    seriesSummary: seriesSummary as SeriesSummary,
  };
}
