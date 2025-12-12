import { drizzle } from 'drizzle-orm/mysql2';
import { players } from './drizzle/schema.ts';
import fs from 'fs';

const db = drizzle(process.env.DATABASE_URL);

// Read players from JSON
const data = JSON.parse(fs.readFileSync('/home/ubuntu/nba_players_complete_final.json', 'utf8'));
const playersList = data.players || data;

console.log(`Migrating ${playersList.length} players to database...`);

// Insert in batches of 100
const batchSize = 100;
for (let i = 0; i < playersList.length; i += batchSize) {
  const batch = playersList.slice(i, i + batchSize);
  
  const values = batch.map(p => ({
    id: p.id,
    name: p.name,
    overall: p.overall,
    photoUrl: p.photo_url || null,
    playerPageUrl: p.player_page_url || null,
    nbaId: p.nba_id || null,
    source: p.source || 'nba.com',
    badgeCount: p.badge_count || null,
  }));
  
  await db.insert(players).values(values).onDuplicateKeyUpdate({
    set: {
      name: values[0].name,
      overall: values[0].overall,
      photoUrl: values[0].photoUrl,
      playerPageUrl: values[0].playerPageUrl,
      nbaId: values[0].nbaId,
      source: values[0].source,
      badgeCount: values[0].badgeCount,
    }
  });
  
  console.log(`Migrated ${Math.min(i + batchSize, playersList.length)}/${playersList.length} players`);
}

console.log('Migration complete!');
process.exit(0);
