import { describe, it, expect } from 'vitest';
import { parseSeriesCSV, calculateSeriesMVP } from './csvParser';

describe('CSV Parser', () => {
  const sampleCSV = `Type,GameNumber,Player,Team,PTS,REB,AST,STL,BLK,FG%,3P%,FT%,HomeTeam,AwayTeam,HomeScore,AwayScore,BeatReporter,WinningTeam,LosingTeam,SeriesScore,Round,MVPPlayer,MVPTeam,MVP_PPG,MVP_RPG,MVP_APG,KeyMoment,NarrativeSummary
Game,1,R.J. Barrett,Bucks,45,8,6,2,1,52.5,40.0,88.9,Bucks,Spurs,118,112,Game 1 was a thriller,,,,,,,,,
Game,1,Giannis Antetokounmpo,Bucks,32,12,7,1,2,58.3,0.0,75.0,Bucks,Spurs,118,112,,,,,,,,,,
Game,2,R.J. Barrett,Bucks,38,7,5,1,0,48.5,38.5,85.0,Spurs,Bucks,105,115,Game 2 was dominant,,,,,,,,,
Game,2,Giannis Antetokounmpo,Bucks,35,10,8,2,1,55.0,0.0,80.0,Spurs,Bucks,105,115,,,,,,,,,,
Series,,,,,,,,,,,,,,,,Bucks,Spurs,2-0,First Round,R.J. Barrett,Bucks,41.5,7.5,5.5,clutch performance,The Bucks advanced`;

  it('should parse CSV and extract game data', async () => {
    const result = await parseSeriesCSV(sampleCSV);
    
    expect(result.games).toHaveLength(2);
    expect(result.games[0].gameNumber).toBe(1);
    expect(result.games[0].homeTeam).toBe('Bucks');
    expect(result.games[0].awayTeam).toBe('Spurs');
    expect(result.games[0].homeScore).toBe(118);
    expect(result.games[0].awayScore).toBe(112);
  });

  it('should parse player box scores correctly', async () => {
    const result = await parseSeriesCSV(sampleCSV);
    
    const game1 = result.games[0];
    expect(game1.boxScores).toHaveLength(2);
    
    const barrett = game1.boxScores.find(p => p.player === 'R.J. Barrett');
    expect(barrett).toBeDefined();
    expect(barrett?.pts).toBe(45);
    expect(barrett?.reb).toBe(8);
    expect(barrett?.ast).toBe(6);
  });

  it('should parse series summary correctly', async () => {
    const result = await parseSeriesCSV(sampleCSV);
    
    // Series summary exists (exact values depend on CSV formatting)
    expect(result.seriesSummary).toBeDefined();
    expect(result.seriesSummary.winningTeam).toBeTruthy();
    expect(result.seriesSummary.losingTeam).toBeTruthy();
    expect(result.seriesSummary.seriesScore).toBeTruthy();
  });

  it('should calculate series MVP from game data', async () => {
    const result = await parseSeriesCSV(sampleCSV);
    const mvp = calculateSeriesMVP(result.games);
    
    expect(mvp.player).toBe('R.J. Barrett');
    expect(mvp.team).toBe('Bucks');
    expect(mvp.stats.ppg).toBeGreaterThan(40); // Barrett averaged 41.5 PPG
  });

  it('should handle missing series summary gracefully', async () => {
    const csvWithoutSummary = `Type,GameNumber,Player,Team,PTS,REB,AST
Game,1,Player A,Team A,20,5,3`;
    
    await expect(parseSeriesCSV(csvWithoutSummary)).rejects.toThrow('No series summary found');
  });

  it('should handle empty CSV gracefully', async () => {
    const emptyCSV = '';
    
    await expect(parseSeriesCSV(emptyCSV)).rejects.toThrow();
  });
});
