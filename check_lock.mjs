import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(connection);

const result = await db.execute(sql`SELECT * FROM bot_instance_lock`);
console.log('Bot Instance Lock:', JSON.stringify(result, null, 2));

await connection.end();
