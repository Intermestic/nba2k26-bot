import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { playoffGames, playoffSeries, InsertPlayoffGame, InsertPlayoffSeries } from "../drizzle/schema";

export async function getPlayoffSeries(season: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(playoffSeries)
    .where(eq(playoffSeries.season, season))
    .orderBy(playoffSeries.round, playoffSeries.matchupId);
}

export async function getSeriesByMatchupId(matchupId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(playoffSeries)
    .where(eq(playoffSeries.matchupId, matchupId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createPlayoffSeries(series: InsertPlayoffSeries) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(playoffSeries).values(series);
}

export async function updateSeriesScore(matchupId: string, team1Wins: number, team2Wins: number, seriesWinner?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const isComplete = seriesWinner ? 1 : 0;
  
  await db.update(playoffSeries)
    .set({ team1Wins, team2Wins, seriesWinner, isComplete, updatedAt: new Date() })
    .where(eq(playoffSeries.matchupId, matchupId));
}

export async function getPlayoffGames(season: string, matchupId?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (matchupId) {
    return await db.select().from(playoffGames)
      .where(and(
        eq(playoffGames.season, season),
        eq(playoffGames.matchupId, matchupId)
      ))
      .orderBy(playoffGames.gameNumber);
  }
  
  return await db.select().from(playoffGames)
    .where(eq(playoffGames.season, season))
    .orderBy(desc(playoffGames.playedAt));
}

export async function addPlayoffGame(game: InsertPlayoffGame) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(playoffGames).values(game);
  
  // Update series scores
  const series = await getSeriesByMatchupId(game.matchupId);
  if (series && game.winner) {
    let team1Wins = series.team1Wins;
    let team2Wins = series.team2Wins;
    
    if (game.winner === series.team1) {
      team1Wins++;
    } else if (game.winner === series.team2) {
      team2Wins++;
    }
    
    // Check if series is complete (best of 7, first to 4 wins)
    const seriesWinner = team1Wins === 4 ? series.team1 : team2Wins === 4 ? series.team2 : undefined;
    
    await updateSeriesScore(game.matchupId, team1Wins, team2Wins, seriesWinner);
  }
}

export async function initializeFirstRoundSeries(season: string, teams: Array<{ seed: number, name: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Create first round matchups (1v16, 8v9, 4v13, 5v12, 2v15, 7v10, 3v14, 6v11)
  const matchups = [
    { seed1: 1, seed2: 16 },
    { seed1: 8, seed2: 9 },
    { seed1: 4, seed2: 13 },
    { seed1: 5, seed2: 12 },
    { seed1: 2, seed2: 15 },
    { seed1: 7, seed2: 10 },
    { seed1: 3, seed2: 14 },
    { seed1: 6, seed2: 11 }
  ];
  
  for (const matchup of matchups) {
    const team1 = teams.find(t => t.seed === matchup.seed1);
    const team2 = teams.find(t => t.seed === matchup.seed2);
    
    if (team1 && team2) {
      const matchupId = `R1-${matchup.seed1}v${matchup.seed2}`;
      
      // Check if series already exists
      const existing = await getSeriesByMatchupId(matchupId);
      if (!existing) {
        await createPlayoffSeries({
          season,
          round: "first",
          matchupId,
          seed1: matchup.seed1,
          team1: team1.name,
          seed2: matchup.seed2,
          team2: team2.name,
          team1Wins: 0,
          team2Wins: 0,
          isComplete: 0
        });
      }
    }
  }
}
