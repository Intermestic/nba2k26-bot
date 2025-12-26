import mysql from 'mysql2/promise';
import { writeFileSync } from 'fs';

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

try {
  // Query all players - use only columns that exist
  const [rows] = await connection.execute('SELECT * FROM players ORDER BY name');
  
  console.log(`Found ${rows.length} players`);
  
  // Show first player to see structure
  if (rows.length > 0) {
    console.log('Sample player:', JSON.stringify(rows[0], null, 2));
  }
  
  // Convert to CSV
  const csvRows = [];
  csvRows.push(['Full Name', 'First Initial Last Name', 'Rookie Status', 'Team/Free Agent']);
  
  for (const player of rows) {
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
  
  console.log(`Exported ${rows.length} players to ${outputPath}`);
  
} catch (error) {
  console.error('Error:', error);
} finally {
  await connection.end();
}

process.exit(0);
