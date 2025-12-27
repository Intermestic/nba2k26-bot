import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { teamCoins } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

const teams = [
  'Hawks', 'Celtics', 'Nets', 'Hornets', 'Bulls', 'Cavaliers', 'Mavericks', 'Nuggets',
  'Pistons', 'Warriors', 'Rockets', 'Pacers', 'Clippers', 'Lakers', 'Grizzlies', 'Heat',
  'Bucks', 'Timberwolves', 'Pelicans', 'Knicks', 'Thunder', 'Magic', '76ers', 'Suns',
  'Trail Blazers', 'Kings', 'Spurs', 'Raptors', 'Jazz', 'Wizards'
];

console.log('Seeding team coins...');

let inserted = 0;

for (const team of teams) {
  try {
    // Hawks and Nuggets get 115, everyone else gets 100
    const coins = (team === 'Hawks' || team === 'Nuggets') ? 115 : 100;
    
    await db.insert(teamCoins).values({
      team,
      coinsRemaining: coins
    });
    
    console.log(`✅ ${team}: ${coins} coins`);
    inserted++;
  } catch (error) {
    console.error(`❌ Failed to insert ${team}:`, error.message);
  }
}

console.log(`\nTotal teams inserted: ${inserted}/${teams.length}`);

await connection.end();
