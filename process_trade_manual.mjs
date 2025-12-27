import { createConnection } from 'mysql2/promise';

const connection = await createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false }
});

console.log('Processing Spurs-Bucks trade manually...');

// Move Terrance Shannon Jr to Bucks
await connection.execute(
  "UPDATE players SET team = 'Bucks' WHERE name LIKE '%Terrance Shannon%'"
);
console.log('✓ Moved Terrance Shannon Jr to Bucks');

// Move Bradley Beal to Spurs
await connection.execute(
  "UPDATE players SET team = 'Spurs' WHERE name LIKE '%Bradley Beal%'"
);
console.log('✓ Moved Bradley Beal to Spurs');

// Move Jamal Cain to Spurs
await connection.execute(
  "UPDATE players SET team = 'Spurs' WHERE name LIKE '%Jamal Cain%'"
);
console.log('✓ Moved Jamal Cain to Spurs');

console.log('\n✅ Trade processed successfully!');

await connection.end();
process.exit(0);
