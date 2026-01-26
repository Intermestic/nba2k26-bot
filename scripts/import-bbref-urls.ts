import { drizzle } from 'drizzle-orm/mysql2';
import { players } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function importBBRefUrls() {
  try {
    // Read CSV file
    const csvContent = fs.readFileSync('/home/ubuntu/upload/nba2k26_players_final.csv', 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Parse CSV line (handle commas in names)
      const match = line.match(/^"?([^"]+)"?,"?([^"]+)"?,"?([^"]+)"?$/);
      if (!match) {
        console.log(`⚠️  Skipping malformed line: ${line}`);
        continue;
      }
      
      const [, fullName, , bbrefUrl] = match;
      
      try {
        // Find player by name (case-insensitive)
        const playerList = await db.select().from(players).where(eq(players.name, fullName));
        
        if (playerList.length === 0) {
          console.log(`❌ Player not found: ${fullName}`);
          notFound++;
          continue;
        }
        
        // Update player with BBRef URL
        await db.update(players)
          .set({ bbrefUrl: bbrefUrl.trim() })
          .where(eq(players.id, playerList[0].id));
        
        updated++;
        if (updated % 50 === 0) {
          console.log(`✅ Updated ${updated} players...`);
        }
      } catch (error) {
        console.error(`Error updating ${fullName}:`, error);
        errors++;
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Updated: ${updated} players`);
    console.log(`❌ Not found: ${notFound} players`);
    console.log(`⚠️  Errors: ${errors}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
  
  process.exit(0);
}

importBBRefUrls();
