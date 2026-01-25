import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function check() {
  const result = await db.execute(sql`SELECT id, name, overall, team FROM players WHERE name LIKE '%Suggs%'`);
  console.log("Jalen Suggs in DB:", result[0]);
  
  // Also check Magic roster
  const magic = await db.execute(sql`SELECT id, name, overall FROM players WHERE team = 'Magic' ORDER BY overall DESC`);
  console.log("\nMagic roster:", magic[0]);
  
  process.exit(0);
}

check();
