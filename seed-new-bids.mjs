import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { faBids } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

const bids = [
  // Magic: Jake Laravia $5
  { playerName: 'Jake Laravia', bidderName: 'cam2345', team: 'Magic', bidAmount: 5 },
  
  // Bucks: Charles Bassey $72
  { playerName: 'Charles Bassey', bidderName: 'mikeybvf', team: 'Bucks', bidAmount: 72 },
  
  // Nuggets: Multiple bids (Keldon Johnson $101 is latest, replaces $100)
  { playerName: 'Keldon Johnson', bidderName: 'kuroko4', team: 'Nuggets', bidAmount: 101 },
  { playerName: 'Moses Moody', bidderName: 'kuroko4', team: 'Nuggets', bidAmount: 1 },
  { playerName: 'Jaden Ivey', bidderName: 'kuroko4', team: 'Nuggets', bidAmount: 60 },
  
  // Raptors: Luke Kornet $61
  { playerName: 'Luke Kornet', bidderName: 'lameloballcashed', team: 'Raptors', bidAmount: 61 },
  
  // Blazers: Jake Laravia $90 (highest), PJ Dozier $1
  { playerName: 'Jake Laravia', bidderName: 'sirjordan10', team: 'Blazers', bidAmount: 90 },
  { playerName: 'PJ Dozier', bidderName: 'sirjordan10', team: 'Blazers', bidAmount: 1 },
  
  // Lakers: Adou Thiero $45
  { playerName: 'Adou Thiero', bidderName: 'jayguwop.', team: 'Lakers', bidAmount: 45 },
  
  // Hawks: Rocco Zikarsky $104
  { playerName: 'Rocco Zikarsky', bidderName: 'xpoloxhawk', team: 'Hawks', bidAmount: 104 },
  
  // Knicks: Daniel Gafford $100
  { playerName: 'Daniel Gafford', bidderName: 'iscoutgems', team: 'Knicks', bidAmount: 100 },
  
  // Jazz: Grayson Allen $20, Daniel Gafford $30
  { playerName: 'Grayson Allen', bidderName: '.wooman', team: 'Jazz', bidAmount: 20 },
  { playerName: 'Daniel Gafford', bidderName: '.wooman', team: 'Jazz', bidAmount: 30 },
  
  // 76ers: Daniel Gafford $100
  { playerName: 'Daniel Gafford', bidderName: 'ishotcheesee', team: '76ers', bidAmount: 100 },
  
  // Celtics: Daniel Gafford $45
  { playerName: 'Daniel Gafford', bidderName: 'coogie33', team: 'Celtics', bidAmount: 45 },
];

console.log('Seeding new FA bids...');

const windowId = '2025-11-14-PM'; // Current PM window

for (const bid of bids) {
  try {
    await db.insert(faBids).values({
      playerId: null,
      playerName: bid.playerName,
      bidderDiscordId: 'seeded',
      bidderName: bid.bidderName,
      team: bid.team,
      bidAmount: bid.bidAmount,
      windowId,
      messageId: '1438598608533454889'
    });
    
    console.log(`✅ ${bid.playerName}: $${bid.bidAmount} by ${bid.bidderName} (${bid.team})`);
  } catch (error) {
    console.error(`❌ Failed to insert bid for ${bid.playerName}:`, error.message);
  }
}

console.log(`\nTotal bids seeded: ${bids.length}`);

await connection.end();
