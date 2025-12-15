import { createConnection } from 'mysql2/promise';

const connection = await createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false }
});

const [rows] = await connection.execute(
  'SELECT messageId, team1, team2, status FROM trades WHERE messageId LIKE "14488%" ORDER BY createdAt DESC LIMIT 10'
);

console.log('Trades with message ID starting with 14488:');
rows.forEach(row => {
  console.log(`${row.messageId}: ${row.team1} ↔ ${row.team2} (${row.status})`);
});

await connection.end();
process.exit(0);
