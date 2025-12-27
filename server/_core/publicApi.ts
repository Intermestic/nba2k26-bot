import { Router } from "express";
import { eq } from "drizzle-orm";
import { players } from "../../drizzle/schema";
import { getDb } from "../db";

const router = Router();

// Team logos mapping
const TEAM_LOGOS: Record<string, string> = {
  "76ers": "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg",
  "Bucks": "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
  "Bulls": "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg",
  "Cavaliers": "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg",
  "Celtics": "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
  "Grizzlies": "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg",
  "Hawks": "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg",
  "Heat": "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
  "Hornets": "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg",
  "Jazz": "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg",
  "Kings": "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg",
  "Knicks": "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg",
  "Lakers": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
  "Magic": "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg",
  "Mavericks": "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg",
  "Nets": "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg",
  "Nuggets": "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
  "Pacers": "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg",
  "Pelicans": "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg",
  "Pistons": "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg",
  "Raptors": "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg",
  "Rockets": "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg",
  "Spurs": "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg",
  "Suns": "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
  "Timberwolves": "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg",
  "Trail Blazers": "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg",
  "Warriors": "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
  "Wizards": "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg"
};

/**
 * GET /api/public/players
 * Get all players with optional team filter
 * Query params:
 *   - team: Filter by team name (optional)
 *   - limit: Max results (default 1000)
 *   - offset: Pagination offset (default 0)
 */
router.get("/players", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { team, limit = "1000", offset = "0" } = req.query;
    
    const result = team && typeof team === "string"
      ? await db.select().from(players)
          .where(eq(players.team, team))
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string))
      : await db.select().from(players)
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));

    res.json({
      success: true,
      count: result.length,
      players: result.map(p => ({
        id: p.id,
        name: p.name,
        overall: p.overall,
        team: p.team,
        photoUrl: p.photoUrl,
        playerPageUrl: p.playerPageUrl,
        badgeCount: p.badgeCount
      }))
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

/**
 * GET /api/public/players/:id
 * Get single player by ID
 */
router.get("/players/:id", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const result = await db
      .select()
      .from(players)
      .where(eq(players.id, req.params.id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }

    const player = result[0];
    res.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        overall: player.overall,
        team: player.team,
        photoUrl: player.photoUrl,
        playerPageUrl: player.playerPageUrl,
        badgeCount: player.badgeCount
      }
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({ error: "Failed to fetch player" });
  }
});

/**
 * GET /api/public/teams
 * Get all teams with logos
 */
router.get("/teams", async (req, res) => {
  try {
    const teams = Object.entries(TEAM_LOGOS).map(([name, logo]) => ({
      name,
      logo
    }));

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

/**
 * GET /api/public/teams/:teamName
 * Get specific team info with logo
 */
router.get("/teams/:teamName", async (req, res) => {
  try {
    const teamName = req.params.teamName;
    const logo = TEAM_LOGOS[teamName];

    if (!logo) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({
      success: true,
      team: {
        name: teamName,
        logo
      }
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

/**
 * GET /api/public/teams/:teamName/roster
 * Get roster for specific team
 */
router.get("/teams/:teamName/roster", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const teamName = req.params.teamName;
    const result = await db
      .select()
      .from(players)
      .where(eq(players.team, teamName));

    res.json({
      success: true,
      team: teamName,
      logo: TEAM_LOGOS[teamName] || null,
      count: result.length,
      roster: result.map(p => ({
        id: p.id,
        name: p.name,
        overall: p.overall,
        photoUrl: p.photoUrl,
        playerPageUrl: p.playerPageUrl,
        badgeCount: p.badgeCount
      }))
    });
  } catch (error) {
    console.error("Error fetching roster:", error);
    res.status(500).json({ error: "Failed to fetch roster" });
  }
});

export { router as publicApiRouter };
