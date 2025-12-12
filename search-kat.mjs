import { drizzle } from 'drizzle-orm/mysql2';
import { like, or } from 'drizzle-orm';
import { players } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const results = await db.select().from(players).where(
  or(
    like(players.name, '%Kat%'),
    like(players.name, '%Karl-Anthony%'),
    like(players.name, '%Towns%')
  )
);

console.log('Found players:', results.length);
results.forEach(p => {
  console.log(`- ${p.name} (ID: ${p.id}, Team: ${p.team}, OVR: ${p.overall})`);
});
