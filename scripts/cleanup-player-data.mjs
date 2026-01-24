#!/usr/bin/env node

import mysql from 'mysql2/promise';
import { normalize } from 'node:path';
import { createWriteStream } from 'node:fs';

const reportStream = createWriteStream('/tmp/player-cleanup-report.txt');

function log(msg) {
  console.log(msg);
  reportStream.write(msg + '\n');
}

// Function to remove accents and diacritics
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Function to generate 2K ratings URL from player name
function generatePlayerUrl(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  return `https://www.2kratings.com/${slug}`;
}

// Function to check if URL is valid
async function checkUrl(url) {
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

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nba2k26'
  });

  try {
    // Get all players
    const [players] = await connection.execute('SELECT id, name, player_page_url FROM players ORDER BY name');
    log(`Total players in database: ${players.length}\n`);

    // Find players with special characters
    const playersWithSpecialChars = players.filter(p => 
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
    const updates = [];
    const brokenLinks = [];
    const fixedLinks = [];

    log('Checking 2K rating links...\n');
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const cleanName = removeAccents(player.name);
      
      // Check if name needs cleaning
      let needsNameUpdate = false;
      if (player.name !== cleanName) {
        needsNameUpdate = true;
      }

      // Check URL validity
      let needsUrlUpdate = false;
      let newUrl = player.player_page_url;

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
        log(`Processed ${i + 1}/${players.length} players...`);
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
        let query = 'UPDATE players SET ';
        const parts = [];
        
        if (update.nameChanged) {
          parts.push(`name = '${update.newName.replace(/'/g, "''")}'`);
        }
        if (update.urlChanged) {
          parts.push(`player_page_url = '${update.newUrl.replace(/'/g, "''")}'`);
        }
        
        query += parts.join(', ') + ` WHERE id = ${update.id}`;
        
        try {
          await connection.execute(query);
          log(`✓ Updated player ID ${update.id}: ${update.oldName} → ${update.newName}`);
        } catch (err) {
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
    await connection.end();
    reportStream.end();
    console.log('\n✅ Report saved to /tmp/player-cleanup-report.txt');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
