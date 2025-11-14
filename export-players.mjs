import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { players } from './drizzle/schema.ts';
import { writeFileSync } from 'fs';
import { desc, asc } from 'drizzle-orm';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Create database connection
const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST?.split(':')[0],
  port: parseInt(process.env.DATABASE_HOST?.split(':')[1] || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

const db = drizzle(connection);

// Query all players
const allPlayers = await db
  .select()
  .from(players)
  .orderBy(desc(players.overall), asc(players.name));

console.log(`Found ${allPlayers.length} players`);

// Convert to CSV
const headers = ['id', 'name', 'overall', 'team', 'photoUrl', 'playerPageUrl', 'nbaId', 'source', 'badgeCount', 'salaryCap', 'createdAt', 'updatedAt'];
const csvRows = [headers.join(',')];

for (const player of allPlayers) {
  const row = headers.map(header => {
    const value = player[header];
    if (value === null || value === undefined) return '';
    // Escape commas and quotes in CSV
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  });
  csvRows.push(row.join(','));
}

const csvContent = csvRows.join('\n');

// Write to file
const outputPath = '/home/ubuntu/nba2k26_players.csv';
writeFileSync(outputPath, csvContent, 'utf-8');

console.log(`Exported ${allPlayers.length} players to ${outputPath}`);

await connection.end();
process.exit(0);
