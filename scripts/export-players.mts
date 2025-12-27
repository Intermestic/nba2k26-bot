import { getDb } from '../server/db.js';
import { players } from '../drizzle/schema.js';
import fs from 'fs';

const db = await getDb();
if (!db) throw new Error("Database not available");

const allPlayers = await db.select().from(players);

// Generate CSV
const csvHeader = 'player_id,name,overall,team,photo_url,player_page_url,nba_player_id,source,badge_count\n';
const csvRows = allPlayers
  .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name))
  .map(p => 
    `${p.id},"${(p.name || '').replace(/"/g, '""')}",${p.overall},"${(p.team || '').replace(/"/g, '""')}","${p.photoUrl || ''}","${p.playerPageUrl || ''}","${p.nbaId || ''}","${p.source || ''}","${p.badgeCount || ''}"`
  ).join('\n');
fs.writeFileSync('./client/public/players.csv', csvHeader + csvRows);

// Generate JSON
const jsonData = allPlayers
  .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name))
  .map(p => ({
    id: p.id,
    name: p.name,
    overall: p.overall,
    team: p.team,
    photoUrl: p.photoUrl,
    playerPageUrl: p.playerPageUrl,
    nbaId: p.nbaId,
    source: p.source,
    badgeCount: p.badgeCount
  }));
fs.writeFileSync('./client/public/players.json', JSON.stringify(jsonData, null, 2));

console.log(`✓ Exported ${allPlayers.length} players to CSV and JSON with team data`);
process.exit(0);
