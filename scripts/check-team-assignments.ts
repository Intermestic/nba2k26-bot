import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const result = await db.execute(sql`SELECT * FROM team_assignments LIMIT 5`);
  console.log(JSON.stringify(result[0], null, 2));
  process.exit(0);
}

main().catch(console.error);
