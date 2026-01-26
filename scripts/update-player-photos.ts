import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

const playersData = [
  {
    name: "Cody Martin",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628998.png",
    playerPageUrl: "https://www.2kratings.com/cody-martin"
  },
  {
    name: "Cole Swider",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1631306.png",
    playerPageUrl: "https://www.2kratings.com/cole-swider"
  },
  {
    name: "Drew Peterson",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1641809.png",
    playerPageUrl: "https://www.2kratings.com/drew-peterson"
  },
  {
    name: "Gabe McGlothan",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1642440.png",
    playerPageUrl: "https://www.2kratings.com/gabe-mcglothan"
  },
  {
    name: "Jahmai Mashack",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1642942.png",
    playerPageUrl: "https://www.2kratings.com/jahmai-mashack"
  },
  {
    name: "Kendall Brown",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1631112.png",
    playerPageUrl: "https://www.2kratings.com/kendall-brown"
  },
  {
    name: "Keshad Johnson",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1642352.png",
    playerPageUrl: "https://www.2kratings.com/keshad-johnson"
  },
  {
    name: "Kyle Mangas",
    photoUrl: null, // Not found
    playerPageUrl: "https://www.2kratings.com/kyle-mangas"
  },
  {
    name: "LJ Cryer",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1643018.png",
    playerPageUrl: "https://www.2kratings.com/lj-cryer"
  },
  {
    name: "Markieff Morris",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202693.png",
    playerPageUrl: "https://www.2kratings.com/markieff-morris"
  },
  {
    name: "Mason Jones",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630222.png",
    playerPageUrl: "https://www.2kratings.com/mason-jones"
  },
  {
    name: "Mohamed Diawara",
    photoUrl: "https://cdn.nba.com/teams/uploads/sites/1610612752/2025/12/98449ecc158210e92a7468f290167bfcea36b039b18e0621a5daeff4a423fe0c.jpg",
    playerPageUrl: "https://www.2kratings.com/mohamed-diawara"
  },
  {
    name: "Talen Horton-Tucker",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629659.png",
    playerPageUrl: "https://www.2kratings.com/talen-horton-tucker"
  },
  {
    name: "Trey Jemison III",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1641998.png",
    playerPageUrl: "https://www.2kratings.com/trey-jemison"
  },
  {
    name: "Tyrese Martin",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1631213.png",
    playerPageUrl: "https://www.2kratings.com/tyrese-martin"
  },
  {
    name: "Tyus Jones",
    photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626145.png",
    playerPageUrl: "https://www.2kratings.com/tyus-jones"
  }
];

async function main() {
  console.log('Updating player photos and 2kratings links...\n');
  
  let updated = 0;
  let notFound = 0;
  
  for (const player of playersData) {
    try {
      // Check if player exists
      const existing = await db.execute(sql`
        SELECT id, name FROM players WHERE name = ${player.name}
      `);
      
      if ((existing[0] as any[]).length === 0) {
        console.log(`❌ ${player.name} - Not found in database`);
        notFound++;
        continue;
      }
      
      // Update player
      const updates: string[] = [];
      const values: any[] = [];
      
      if (player.photoUrl) {
        updates.push('photoUrl = ?');
        values.push(player.photoUrl);
      }
      
      if (player.playerPageUrl) {
        updates.push('playerPageUrl = ?');
        values.push(player.playerPageUrl);
      }
      
      if (updates.length > 0) {
        if (player.photoUrl && player.playerPageUrl) {
          await db.execute(sql`
            UPDATE players 
            SET photoUrl = ${player.photoUrl}, playerPageUrl = ${player.playerPageUrl}
            WHERE name = ${player.name}
          `);
        } else if (player.photoUrl) {
          await db.execute(sql`
            UPDATE players 
            SET photoUrl = ${player.photoUrl}
            WHERE name = ${player.name}
          `);
        } else if (player.playerPageUrl) {
          await db.execute(sql`
            UPDATE players 
            SET playerPageUrl = ${player.playerPageUrl}
            WHERE name = ${player.name}
          `);
        }
        
        console.log(`✅ ${player.name} - Updated ${updates.length} field(s)`);
        updated++;
      }
      
    } catch (error) {
      console.error(`❌ ${player.name} - Error:`, error);
    }
  }
  
  console.log(`\n========== SUMMARY ==========`);
  console.log(`✅ Updated: ${updated} players`);
  console.log(`❌ Not found: ${notFound} players`);
  console.log(`📝 Note: Kyle Mangas has no NBA.com headshot available`);
  
  process.exit(0);
}

main().catch(console.error);
