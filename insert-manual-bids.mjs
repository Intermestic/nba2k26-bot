import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { faBids, bidWindows } from './drizzle/schema.js';
import { desc, sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get current PM window
const [currentWindow] = await db.select().from(bidWindows).where(sql`windowId LIKE '%-PM'`).orderBy(desc(bidWindows.startTime)).limit(1);

if (!currentWindow) {
  console.error('No PM window found');
  process.exit(1);
}

console.log(`Current PM window: ${currentWindow.windowId}`);

// Manual bids to insert
const manualBids = [
  { team: 'Hawks', dropPlayer: 'Terrance Mann', playerName: 'Dayron Sharpe', bidAmount: 1, timestamp: '2025-01-15T11:49:00Z', discordUserId: 'hawks_user' },
  { team: 'Rockets', dropPlayer: 'Hunter Dickinson', playerName: "Day'Ron Sharpe", bidAmount: 25, timestamp: '2025-01-15T11:58:00Z', discordUserId: 'rockets_user' },
  { team: 'Nuggets', dropPlayer: 'Kenrich Williams', playerName: 'Bruce Brown', bidAmount: 1, timestamp: '2025-01-15T11:58:00Z', discordUserId: 'nuggets_user' },
  { team: 'Nuggets', dropPlayer: 'Leonard Miller', playerName: 'Chris Paul', bidAmount: 1, timestamp: '2025-01-15T11:59:00Z', discordUserId: 'nuggets_user' },
  // Skip duplicate at 12:20 PM (same as 11:58 AM)
  { team: 'Raptors', dropPlayer: 'Dean Wade', playerName: 'Bruce Brown', bidAmount: 6, timestamp: '2025-01-15T13:20:00Z', discordUserId: 'raptors_user' },
  // Skip duplicate Rockets at 3:33 PM
  { team: 'Raptors', dropPlayer: 'Alex Len', playerName: 'Dayron Sharpe', bidAmount: 29, timestamp: '2025-01-15T15:34:00Z', discordUserId: 'raptors_user' },
  { team: 'Rockets', dropPlayer: 'Hunter Dickinson', playerName: "Day'Ron Sharpe", bidAmount: 35, timestamp: '2025-01-15T15:48:00Z', discordUserId: 'rockets_user' },
  { team: 'Raptors', dropPlayer: 'Dario Saric', playerName: 'Johnathan Mogbo', bidAmount: 3, timestamp: '2025-01-15T16:25:00Z', discordUserId: 'raptors_user' },
  // Correction: Raptors changed drop player
  { team: 'Raptors', dropPlayer: 'Dean Wade', playerName: 'Bruce Brown', bidAmount: 6, timestamp: '2025-01-15T16:26:00Z', discordUserId: 'raptors_user' },
  { team: 'Hornets', dropPlayer: 'Kyle Lowry', playerName: 'Patrick Williams', bidAmount: 1, timestamp: '2025-01-15T17:17:00Z', discordUserId: 'hornets_user' },
  { team: 'Hornets', dropPlayer: 'Caleb Martin', playerName: 'Daniel Theis', bidAmount: 1, timestamp: '2025-01-15T18:35:00Z', discordUserId: 'hornets_user' },
];

console.log(`Inserting ${manualBids.length} bids...`);

for (const bid of manualBids) {
  await db.insert(faBids).values({
    windowId: currentWindow.windowId,
    team: bid.team,
    playerName: bid.playerName,
    bidAmount: bid.bidAmount,
    dropPlayer: bid.dropPlayer,
    discordUserId: bid.discordUserId,
    discordUsername: bid.team.toLowerCase(),
    status: 'pending',
    createdAt: new Date(bid.timestamp),
  });
  console.log(`✓ ${bid.team}: ${bid.playerName} ($${bid.bidAmount})`);
}

console.log('\nBids inserted successfully!');

await connection.end();
