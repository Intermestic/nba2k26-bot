import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);
const result = await db.execute(sql`SELECT id, name, team, overall FROM players WHERE LOWER(name) LIKE '%fleming%'`);
console.log(JSON.stringify(result.rows, null, 2));
process.exit(0);
