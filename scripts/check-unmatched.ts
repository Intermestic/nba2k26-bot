import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function check() {
  // Check for similar names to the unmatched players
  const names = ["Claxton", "Cameron Thomas", "Tyrese Martin"];
  
  for (const name of names) {
    const result = await db.execute(sql`SELECT id, name, overall, team FROM players WHERE name LIKE ${"%" + name + "%"}`);
    console.log(`Search for '${name}':`, result[0]);
  }
  
  // Also check Nets roster
  const nets = await db.execute(sql`SELECT id, name, overall FROM players WHERE team = 'Nets' ORDER BY overall DESC`);
  console.log("\nNets roster in DB:", nets[0]);
  
  process.exit(0);
}

check();
