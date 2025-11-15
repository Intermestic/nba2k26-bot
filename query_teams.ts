import { getDb } from './server/db';
import { players } from './drizzle/schema';
import { sql } from 'drizzle-orm';

async function queryTeams() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    return;
  }
  
  const teams = await db.selectDistinct({ team: players.team }).from(players).where(sql`${players.team} IS NOT NULL`).orderBy(players.team);
  
  console.log('Teams in database:');
  teams.forEach((t, i) => console.log(`${i + 1}. ${t.team}`));
  
  process.exit(0);
}

queryTeams();
