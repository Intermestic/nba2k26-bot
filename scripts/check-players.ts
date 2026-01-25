import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function check() {
  const result = await db.execute(sql`
    SELECT name, overall, team 
    FROM players 
    WHERE name IN ('Stephon Castle', 'Jamison Battle', 'Deandre Ayton', 'Josh Green', 'Patrick Williams', 'Malik Monk')
  `);
  console.log(JSON.stringify(result[0], null, 2));
  process.exit(0);
}

check();
