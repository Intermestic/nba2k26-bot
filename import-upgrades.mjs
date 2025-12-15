import { createConnection } from 'mysql2/promise';
import fs from 'fs';

// Read database config from environment
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

// Parse DATABASE_URL (format: mysql://user:pass@host:port/database?params)
const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!urlMatch) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

const connection = await createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: {
    rejectUnauthorized: true
  }
});

console.log('Connected to database');

// Read CSV file
const csvData = fs.readFileSync('/home/ubuntu/upgrades_clean.csv', 'utf-8');
const lines = csvData.trim().split('\n');

console.log(`Found ${lines.length} upgrade records to import`);

let imported = 0;
let errors = 0;

for (const line of lines) {
  try {
    // Split by pipe and trim whitespace
    const parts = line.split('|').map(p => p.trim());
    
    if (parts.length < 10) {
      console.warn(`Skipping malformed line: ${line}`);
      errors++;
      continue;
    }
    
    const [playerName, userName, date, sourceType, sourceDetail, upgradeType, badgeOrAttribute, fromValue, toValue, notes] = parts;
    
    // Insert into database
    await connection.execute(
      `INSERT INTO upgrade_log 
       (playerName, userName, date, sourceType, sourceDetail, upgradeType, badgeOrAttribute, fromValue, toValue, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        playerName,
        userName,
        date,
        sourceType,
        sourceDetail || null,
        upgradeType,
        badgeOrAttribute,
        fromValue === 'None' ? null : fromValue,
        toValue,
        notes || null
      ]
    );
    
    imported++;
    
    if (imported % 50 === 0) {
      console.log(`Imported ${imported} records...`);
    }
  } catch (error) {
    console.error(`Error importing line: ${line}`);
    console.error(error.message);
    errors++;
  }
}

console.log(`\nImport complete!`);
console.log(`Successfully imported: ${imported}`);
console.log(`Errors: ${errors}`);

await connection.end();
