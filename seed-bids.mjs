import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { faBids } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

// Get current window ID (2025-01-14-PM based on current time)
const now = new Date();
const estOffset = -5 * 60;
const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
const estTime = new Date(utcTime + (estOffset * 60000));
const hour = estTime.getHours();
const year = estTime.getFullYear();
const month = String(estTime.getMonth() + 1).padStart(2, '0');
const day = String(estTime.getDate()).padStart(2, '0');
const windowId = hour < 12 ? `${year}-${month}-${day}-AM` : `${year}-${month}-${day}-PM`;

console.log(`Seeding bids for window: ${windowId}`);

const bids = [
  { playerName: 'Charles Bassey', team: 'Bucks', bidderName: 'mikeybvf', bidAmount: 72 },
  { playerName: 'Jake Laravia', team: 'Blazers', bidderName: 'sirjordan10', bidAmount: 90 },
  { playerName: 'Luke Kornet', team: 'Raptors', bidderName: 'lameloballcashed', bidAmount: 61 },
  { playerName: 'Keldon Johnson', team: 'Nuggets', bidderName: 'kuroko4', bidAmount: 101 },
  { playerName: 'Moses Moody', team: 'Nuggets', bidderName: 'kuroko4', bidAmount: 1 },
  { playerName: 'Chris Paul', team: 'Nuggets', bidderName: 'kuroko4', bidAmount: 1 },
  { playerName: 'PJ Dozier', team: 'Blazers', bidderName: 'sirjordan10', bidAmount: 1 },
  { playerName: 'Jaden Ivey', team: 'Nuggets', bidderName: 'kuroko4', bidAmount: 60 },
  { playerName: 'Adou Thiero', team: 'Lakers', bidderName: 'jayguwop.', bidAmount: 45 },
  { playerName: 'Rocco Zikarsky', team: 'Hawks', bidderName: 'xpoloxhawk', bidAmount: 104 },
  { playerName: 'Daniel Gafford', team: '76ers', bidderName: 'ishotcheesee', bidAmount: 100 },
  { playerName: 'Grayson Allen', team: 'Jazz', bidderName: '.wooman', bidAmount: 20 },
];

let inserted = 0;

for (const bid of bids) {
  try {
    await db.insert(faBids).values({
      playerId: null,
      playerName: bid.playerName,
      bidderDiscordId: 'manual_seed',
      bidderName: bid.bidderName,
      team: bid.team,
      bidAmount: bid.bidAmount,
      windowId,
      messageId: '0'
    });
    console.log(`✅ Inserted: ${bid.playerName} - $${bid.bidAmount} (${bid.team})`);
    inserted++;
  } catch (error) {
    console.error(`❌ Failed to insert ${bid.playerName}:`, error.message);
  }
}

console.log(`\nTotal bids inserted: ${inserted}/${bids.length}`);

await connection.end();
