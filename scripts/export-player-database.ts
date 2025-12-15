import { drizzle } from "drizzle-orm/mysql2";
import { players, playerAliases } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

// Team name to abbreviation mapping
const TEAM_ABBR: Record<string, string> = {
  "Hawks": "ATL",
  "Celtics": "BOS",
  "Nets": "BKN",
  "Hornets": "CHA",
  "Bulls": "CHI",
  "Cavaliers": "CLE",
  "Mavs": "DAL",
  "Nuggets": "DEN",
  "Pistons": "DET",
  "Warriors": "GSW",
  "Rockets": "HOU",
  "Pacers": "IND",
  "Lakers": "LAL",
  "Grizzlies": "MEM",
  "Heat": "MIA",
  "Bucks": "MIL",
  "Timberwolves": "MIN",
  "Pelicans": "NOP",
  "Knicks": "NYK",
  "Magic": "ORL",
  "Sixers": "PHI",
  "Suns": "PHX",
  "Trail Blazers": "POR",
  "Kings": "SAC",
  "Spurs": "SAS",
  "Raptors": "TOR",
  "Jazz": "UTA",
  "Wizards": "WAS",
  "Free Agents": "FA"
};

async function exportPlayerDatabase() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log("Fetching all players from database...");
  const allPlayers = await db.select().from(players);
  console.log(`Found ${allPlayers.length} players`);
  
  console.log("Fetching player aliases...");
  const aliases = await db.select().from(playerAliases);
  console.log(`Found ${aliases.length} aliases`);
  
  // Create alias map: playerId -> comma-separated aliases
  const aliasMap = new Map<number, string>();
  for (const alias of aliases) {
    if (alias.playerId) {
      const existing = aliasMap.get(alias.playerId) || "";
      const newAlias = existing ? `${existing},${alias.alias}` : alias.alias;
      aliasMap.set(alias.playerId, newAlias);
    }
  }
  
  // Build CSV rows
  const csvRows: string[] = [];
  csvRows.push("full_name,first_initial_last,first_name,last_name,team_abbr,common_nicknames,player_id");
  
  for (const player of allPlayers) {
    const fullName = player.name;
    const nameParts = fullName.split(" ");
    
    let firstName = "";
    let lastName = "";
    let firstInitialLast = "";
    
    if (nameParts.length === 1) {
      // Single name (rare)
      firstName = nameParts[0];
      lastName = "";
      firstInitialLast = nameParts[0];
    } else if (nameParts.length === 2) {
      // Standard: First Last
      firstName = nameParts[0];
      lastName = nameParts[1];
      firstInitialLast = `${firstName.charAt(0)}. ${lastName}`;
    } else {
      // Multi-part names: Take first as firstName, rest as lastName
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
      firstInitialLast = `${firstName.charAt(0)}. ${lastName}`;
    }
    
    const teamAbbr = TEAM_ABBR[player.team || "Free Agents"] || "FA";
    const commonNicknames = aliasMap.get(player.id) || "";
    
    // Escape CSV fields (handle commas, quotes)
    const escapeCsv = (field: string) => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    csvRows.push([
      escapeCsv(fullName),
      escapeCsv(firstInitialLast),
      escapeCsv(firstName),
      escapeCsv(lastName),
      teamAbbr,
      escapeCsv(commonNicknames),
      player.id.toString()
    ].join(","));
  }
  
  const csvContent = csvRows.join("\n");
  const outputPath = "/home/ubuntu/nba2k26-database/nba_player_database.csv";
  
  fs.writeFileSync(outputPath, csvContent, "utf-8");
  console.log(`\n✅ CSV exported successfully!`);
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Total players: ${allPlayers.length}`);
  console.log(`🏷️  Players with aliases: ${aliasMap.size}`);
}

exportPlayerDatabase().catch(console.error);
