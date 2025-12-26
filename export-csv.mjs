import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { players } from './shared/schema.ts';
import { writeFileSync } from 'fs';
import { asc } from 'drizzle-orm';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

// Create database connection
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Query all players
const allPlayers = await db
  .select()
  .from(players)
  .orderBy(asc(players.name));

console.log(`Found ${allPlayers.length} players`);

// Convert to CSV
const csvRows = [];
csvRows.push(['Full Name', 'First Initial Last Name', 'Rookie Status', 'Team/Free Agent']);

for (const player of allPlayers) {
  const fullName = player.name || '';
  
  // Generate first initial last name
  const nameParts = fullName.trim().split(' ');
  const firstInitialLast = nameParts.length >= 2 
    ? `${nameParts[0][0]}. ${nameParts.slice(1).join(' ')}`
    : fullName;
  
  // Determine rookie status (drafted in 2025)
  const rookieStatus = player.draftYear === 2025 ? 'Rookie' : '';
  
  // Get team or free agent status
  const teamStatus = player.team || 'Free Agent';
  
  // Escape CSV values
  const escapeCSV = (value) => {
    const stringValue = String(value || '');
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };
  
  csvRows.push([
    escapeCSV(fullName),
    escapeCSV(firstInitialLast),
    escapeCSV(rookieStatus),
    escapeCSV(teamStatus)
  ]);
}

const csvContent = csvRows.map(row => row.join(',')).join('\n');

// Write to file
const outputPath = '/tmp/players_roster.csv';
writeFileSync(outputPath, csvContent, 'utf-8');

console.log(`Exported ${allPlayers.length} players to ${outputPath}`);

await connection.end();
process.exit(0);
