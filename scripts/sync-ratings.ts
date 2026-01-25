import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";

// Read the scraped ratings
const scrapedData = JSON.parse(fs.readFileSync("/home/ubuntu/scrape_team_ratings.json", "utf-8"));

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
  id: number;
  name: string;
  overall: number;
}

interface MatchResult {
  scrapedName: string;
  scrapedOverall: number;
  dbId: number | null;
  dbName: string | null;
  currentOverall: number | null;
  newOverall: number;
  matchScore: number;
  status: "matched" | "fuzzy" | "unmatched";
}

async function main() {
  console.log("Starting ratings sync...\n");
  
  // Get all players from database
  const dbPlayers = await db.execute(sql`SELECT id, name, overall FROM players`);
  const players = dbPlayers[0] as DbPlayer[];
  
  console.log(`Found ${players.length} players in database\n`);
  
  // Create normalized name lookup
  const playersByNormalizedName = new Map<string, DbPlayer>();
  for (const player of players) {
    playersByNormalizedName.set(normalizeName(player.name), player);
  }
  
  const allMatches: MatchResult[] = [];
  const updates: { id: number; name: string; oldOverall: number; newOverall: number }[] = [];
  const unmatched: { name: string; overall: number; team: string }[] = [];
  
  // Process each team
  for (const teamResult of scrapedData.results) {
    const teamSlug = teamResult.output.team_slug;
    const scrapedPlayers: ScrapedPlayer[] = JSON.parse(teamResult.output.players_json);
    
    console.log(`\n=== ${teamSlug.toUpperCase()} ===`);
    
    for (const scraped of scrapedPlayers) {
      const normalizedScraped = normalizeName(scraped.name);
      
      // Try exact match first
      let match = playersByNormalizedName.get(normalizedScraped);
      let matchScore = match ? 1.0 : 0;
      let status: "matched" | "fuzzy" | "unmatched" = match ? "matched" : "unmatched";
      
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
          matchScore = bestScore;
          status = "fuzzy";
        }
      }
      
      // Apply minimum rating of 70
      const newOverall = Math.max(scraped.overall, 70);
      
      if (match) {
        const result: MatchResult = {
          scrapedName: scraped.name,
          scrapedOverall: scraped.overall,
          dbId: match.id,
          dbName: match.name,
          currentOverall: match.overall,
          newOverall: newOverall,
          matchScore: matchScore,
          status: status,
        };
        allMatches.push(result);
        
        // Only update if rating changed
        if (match.overall !== newOverall) {
          updates.push({
            id: match.id,
            name: match.name,
            oldOverall: match.overall,
            newOverall: newOverall,
          });
          console.log(`  ${status === "fuzzy" ? "~" : "✓"} ${scraped.name} → ${match.name}: ${match.overall} → ${newOverall} ${status === "fuzzy" ? `(${(matchScore * 100).toFixed(0)}% match)` : ""}`);
        } else {
          console.log(`  = ${scraped.name}: ${match.overall} (no change)`);
        }
      } else {
        unmatched.push({ name: scraped.name, overall: scraped.overall, team: teamSlug });
        console.log(`  ✗ ${scraped.name} (${scraped.overall}) - NOT FOUND`);
      }
    }
  }
  
  // Summary
  console.log("\n\n========== SUMMARY ==========");
  console.log(`Total scraped players: ${allMatches.length + unmatched.length}`);
  console.log(`Matched players: ${allMatches.length}`);
  console.log(`  - Exact matches: ${allMatches.filter(m => m.status === "matched").length}`);
  console.log(`  - Fuzzy matches: ${allMatches.filter(m => m.status === "fuzzy").length}`);
  console.log(`Unmatched players: ${unmatched.length}`);
  console.log(`Players to update: ${updates.length}`);
  
  if (unmatched.length > 0) {
    console.log("\n--- UNMATCHED PLAYERS ---");
    for (const u of unmatched) {
      console.log(`  ${u.team}: ${u.name} (${u.overall})`);
    }
  }
  
  if (updates.length > 0) {
    console.log("\n--- UPDATES TO APPLY ---");
    for (const u of updates) {
      console.log(`  ${u.name}: ${u.oldOverall} → ${u.newOverall}`);
    }
    
    // Apply updates
    console.log("\nApplying updates...");
    for (const update of updates) {
      await db.execute(sql`UPDATE players SET overall = ${update.newOverall} WHERE id = ${update.id}`);
    }
    console.log(`✓ Updated ${updates.length} players`);
  } else {
    console.log("\nNo updates needed - all ratings are current.");
  }
  
  process.exit(0);
}

main().catch(console.error);
