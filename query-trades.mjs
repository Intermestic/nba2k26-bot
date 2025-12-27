import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { trades } from './drizzle/schema.js';
import { like, or, desc } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const results = await db.select().from(trades)
  .where(or(
    like(trades.team1, '%Spurs%'),
    like(trades.team2, '%Spurs%'),
    like(trades.team1, '%Hawks%'),
    like(trades.team2, '%Hawks%')
  ))
  .orderBy(desc(trades.createdAt))
  .limit(5);

console.log(JSON.stringify(results, null, 2));
await pool.end();
