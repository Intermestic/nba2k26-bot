import { getDb } from '../server/db';
import { players } from '../drizzle/schema';
import { desc, asc } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import path from 'path';

async function exportPlayersToCSV() {
  console.log('Fetching players from database...');
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }
  
  // Query all players with team data
  const allPlayers = await db
    .select({
      id: players.id,
      name: players.name,
      overall: players.overall,
      team: players.team,
      photoUrl: players.photoUrl,
      playerPageUrl: players.playerPageUrl,
      nbaId: players.nbaId,
      source: players.source,
      badgeCount: players.badgeCount,
      salaryCap: players.salaryCap,
    })
    .from(players)
    .orderBy(desc(players.overall), asc(players.name));

  console.log(`Found ${allPlayers.length} players`);

  // CSV header
  const headers = ['id', 'name', 'overall', 'team', 'photoUrl', 'playerPageUrl', 'nbaId', 'source', 'badgeCount', 'salaryCap'];
  
  // Convert to CSV format
  const csvRows: string[] = [headers.join(',')];

  for (const player of allPlayers) {
    const row = headers.map(header => {
      const value = player[header as keyof typeof player];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string
      const stringValue = String(value);
      
      // Escape CSV special characters
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');

  // Write to multiple locations
  const outputPaths = [
    path.join(process.cwd(), 'client', 'public', 'players.csv'),
    path.join(process.cwd(), '..', 'nba2k26_players_with_teams.csv'),
  ];

  for (const outputPath of outputPaths) {
    writeFileSync(outputPath, csvContent, 'utf-8');
    console.log(`✓ Exported to: ${outputPath}`);
  }

  console.log(`\nSuccessfully exported ${allPlayers.length} players with team affiliations!`);
  
  // Show sample of teams
  const teamsCount = allPlayers.reduce((acc, p) => {
    const team = p.team || 'No Team';
    acc[team] = (acc[team] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\nTeam distribution:');
  Object.entries(teamsCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([team, count]) => {
      console.log(`  ${team}: ${count} players`);
    });

  process.exit(0);
}

exportPlayersToCSV().catch((error) => {
  console.error('Export failed:', error);
  process.exit(1);
});
