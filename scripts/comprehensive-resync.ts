import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";

// Read the scraped ratings
const scrapedData = JSON.parse(fs.readFileSync("/home/ubuntu/resync_all_teams.json", "utf-8"));

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// Normalize name for comparison (case-insensitive, remove special chars)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate similarity between two strings (Levenshtein-based)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

interface ScrapedPlayer {
  name: string;
  overall: number;
}

interface DbPlayer {
  id: string;
  name: string;
  overall: number;
  team: string;
}

async function main() {
  console.log("Starting comprehensive ratings re-sync...\n");
  
  // Get all players from database
  const dbPlayers = await db.execute(sql`SELECT id, name, overall, team FROM players`);
  const players = dbPlayers[0] as DbPlayer[];
  
  console.log(`Found ${players.length} players in database\n`);
  
  // Create normalized name lookup
  const playersByNormalizedName = new Map<string, DbPlayer>();
  for (const player of players) {
    playersByNormalizedName.set(normalizeName(player.name), player);
  }
  
  const updates: { id: string; name: string; team: string; oldOverall: number; newOverall: number }[] = [];
  const unmatched: { name: string; overall: number; team: string }[] = [];
  let totalScraped = 0;
  let matched = 0;
  
  // Process each team
  for (const teamResult of scrapedData.results) {
    if (teamResult.error) {
      console.log(`⚠ Skipping ${teamResult.input} - ${teamResult.error}`);
      continue;
    }
    
    const teamSlug = teamResult.output.team_slug;
    const scrapedPlayers: ScrapedPlayer[] = JSON.parse(teamResult.output.players_json);
    totalScraped += scrapedPlayers.length;
    
    for (const scraped of scrapedPlayers) {
      const normalizedScraped = normalizeName(scraped.name);
      
      // Try exact match first
      let match = playersByNormalizedName.get(normalizedScraped);
      
      // If no exact match, try fuzzy matching
      if (!match) {
        let bestMatch: DbPlayer | null = null;
        let bestScore = 0;
        
        for (const [normalizedDbName, dbPlayer] of playersByNormalizedName) {
          const score = similarity(normalizedScraped, normalizedDbName);
          if (score > bestScore && score >= 0.85) {
            bestScore = score;
            bestMatch = dbPlayer;
          }
        }
        
        if (bestMatch) {
          match = bestMatch;
        }
      }
      
      // Apply minimum rating of 70
      const newOverall = Math.max(scraped.overall, 70);
      
      if (match) {
        matched++;
        // Only update if rating changed
        if (match.overall !== newOverall) {
          updates.push({
            id: match.id,
            name: match.name,
            team: match.team,
            oldOverall: match.overall,
            newOverall: newOverall,
          });
        }
      } else {
        unmatched.push({ name: scraped.name, overall: scraped.overall, team: teamSlug });
      }
    }
  }
  
  // Summary
  console.log("========== SUMMARY ==========");
  console.log(`Total scraped players: ${totalScraped}`);
  console.log(`Matched players: ${matched}`);
  console.log(`Unmatched players: ${unmatched.length}`);
  console.log(`Players needing updates: ${updates.length}`);
  
  if (updates.length > 0) {
    console.log("\n--- RATING UPDATES TO APPLY ---");
    // Sort by rating difference (biggest changes first)
    updates.sort((a, b) => Math.abs(b.newOverall - b.oldOverall) - Math.abs(a.newOverall - a.oldOverall));
    
    for (const u of updates) {
      const diff = u.newOverall - u.oldOverall;
      const arrow = diff > 0 ? "↑" : "↓";
      console.log(`  ${u.name} (${u.team}): ${u.oldOverall} → ${u.newOverall} ${arrow}${Math.abs(diff)}`);
    }
    
    // Apply updates
    console.log("\nApplying updates...");
    for (const update of updates) {
      await db.execute(sql`UPDATE players SET overall = ${update.newOverall} WHERE id = ${update.id}`);
    }
    console.log(`✓ Updated ${updates.length} players`);
  } else {
    console.log("\n✓ All ratings are current - no updates needed!");
  }
  
  if (unmatched.length > 0 && unmatched.length <= 20) {
    console.log("\n--- UNMATCHED PLAYERS ---");
    for (const u of unmatched) {
      console.log(`  ${u.team}: ${u.name} (${u.overall})`);
    }
  } else if (unmatched.length > 20) {
    console.log(`\n--- ${unmatched.length} UNMATCHED PLAYERS (showing first 20) ---`);
    for (const u of unmatched.slice(0, 20)) {
      console.log(`  ${u.team}: ${u.name} (${u.overall})`);
    }
  }
  
  process.exit(0);
}

main().catch(console.error);
