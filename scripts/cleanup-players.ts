import { getDb } from '../server/db';
import { players } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { createWriteStream } from 'fs';

const reportStream = createWriteStream('/tmp/player-cleanup-report.txt');

function log(msg: string) {
  console.log(msg);
  reportStream.write(msg + '\n');
}

// Function to remove accents and diacritics
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Function to generate 2K ratings URL from player name
function generatePlayerUrl(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  return `https://www.2kratings.com/${slug}`;
}

// Function to check if URL is valid
async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000,
      redirect: 'follow'
    });
    return response.ok;
  } catch (err) {
    // Try GET as fallback
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000,
        redirect: 'follow'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

async function main() {
  log('=== NBA 2K26 Player Data Cleanup ===\n');
  log(`Started: ${new Date().toISOString()}\n`);

  const db = await getDb();
  if (!db) {
    log('ERROR: Could not connect to database');
    process.exit(1);
  }

  try {
    // Get all players
    const allPlayers = await db.select().from(players);
    log(`Total players in database: ${allPlayers.length}\n`);

    // Find players with special characters
    const playersWithSpecialChars = allPlayers.filter(p => 
      p.name !== removeAccents(p.name)
    );
    
    log(`Players with accents/diacritics: ${playersWithSpecialChars.length}`);
    if (playersWithSpecialChars.length > 0) {
      log('Examples:');
      playersWithSpecialChars.slice(0, 5).forEach(p => {
        log(`  ${p.name} → ${removeAccents(p.name)}`);
      });
      log('');
    }

    // Prepare updates
    const updates: any[] = [];
    const brokenLinks: any[] = [];
    const fixedLinks: string[] = [];

    log('Checking 2K rating links...\n');
    
    for (let i = 0; i < allPlayers.length; i++) {
      const player = allPlayers[i];
      const cleanName = removeAccents(player.name);
      
      // Check if name needs cleaning
      let needsNameUpdate = false;
      if (player.name !== cleanName) {
        needsNameUpdate = true;
      }

      // Check URL validity
      let needsUrlUpdate = false;
      let newUrl = player.player_page_url || '';

      if (player.player_page_url) {
        const isValid = await checkUrl(player.player_page_url);
        if (!isValid) {
          needsUrlUpdate = true;
          newUrl = generatePlayerUrl(cleanName);
          brokenLinks.push({
            id: player.id,
            name: player.name,
            oldUrl: player.player_page_url,
            newUrl: newUrl
          });
          
          // Verify new URL works
          const newUrlValid = await checkUrl(newUrl);
          if (newUrlValid) {
            fixedLinks.push(newUrl);
          }
        }
      }

      // Queue update if needed
      if (needsNameUpdate || needsUrlUpdate) {
        updates.push({
          id: player.id,
          oldName: player.name,
          newName: cleanName,
          oldUrl: player.player_page_url,
          newUrl: newUrl,
          nameChanged: needsNameUpdate,
          urlChanged: needsUrlUpdate
        });
      }

      // Progress indicator
      if ((i + 1) % 50 === 0) {
        log(`Processed ${i + 1}/${allPlayers.length} players...`);
      }
    }

    log(`\n=== CLEANUP SUMMARY ===\n`);
    log(`Players needing updates: ${updates.length}`);
    log(`Broken links found: ${brokenLinks.length}`);
    log(`Links fixed: ${fixedLinks.length}\n`);

    // Apply updates
    if (updates.length > 0) {
      log('Applying updates to database...\n');
      
      for (const update of updates) {
        try {
          const updateData: any = {};
          if (update.nameChanged) {
            updateData.name = update.newName;
          }
          if (update.urlChanged) {
            updateData.player_page_url = update.newUrl;
          }
          
          await db.update(players).set(updateData).where(eq(players.id, update.id));
          log(`✓ Updated player ID ${update.id}: ${update.oldName} → ${update.newName}`);
        } catch (err: any) {
          log(`✗ Failed to update player ID ${update.id}: ${err.message}`);
        }
      }
    }

    log(`\n=== BROKEN LINKS REPORT ===\n`);
    if (brokenLinks.length > 0) {
      log(`Found ${brokenLinks.length} broken links:\n`);
      brokenLinks.forEach(link => {
        log(`Player: ${link.name} (ID: ${link.id})`);
        log(`  Old: ${link.oldUrl}`);
        log(`  New: ${link.newUrl}`);
        log('');
      });
    } else {
      log('No broken links found!');
    }

    log(`\n=== COMPLETION ===`);
    log(`Finished: ${new Date().toISOString()}`);
    log(`Updates applied: ${updates.length}`);

  } finally {
    reportStream.end();
    console.log('\n✅ Report saved to /tmp/player-cleanup-report.txt');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
