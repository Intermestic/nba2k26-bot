#!/usr/bin/env node
/**
 * One-time migration script to normalize all team names to canonical format
 * 
 * This script:
 * 1. Scans all tables with team columns (players, teamCoins, faTransactions, faBids, capViolations)
 * 2. Applies validateTeamName() to normalize team names (Blazers -> Trail Blazers, 76ers -> Sixers, etc.)
 * 3. Updates all non-canonical team names to their canonical equivalents
 * 4. Logs all changes for audit trail
 * 
 * Usage: node server/scripts/normalize-team-names.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config();

// Import team validator
const VALID_TEAMS = [
  'Free Agents',
  'Bucks',
  'Bulls',
  'Cavaliers',
  'Celtics',
  'Grizzlies',
  'Hawks',
  'Heat',
  'Hornets',
  'Jazz',
  'Kings',
  'Knicks',
  'Lakers',
  'Magic',
  'Mavs',
  'Nets',
  'Nuggets',
  'Pacers',
  'Pelicans',
  'Pistons',
  'Raptors',
  'Rockets',
  'Sixers',
  'Spurs',
  'Suns',
  'Timberwolves',
  'Trail Blazers',
  'Warriors',
  'Wizards',
];

const TEAM_ALIASES = {
  // 76ers / Sixers
  '76ers': 'Sixers',
  'seventy sixers': 'Sixers',
  
  // Mavericks
  'mavericks': 'Mavs',
  'dallas': 'Mavs',
  
  // Trail Blazers
  'trailblazers': 'Trail Blazers',
  'blazers': 'Trail Blazers',
  'portland': 'Trail Blazers',
  
  // Timberwolves
  'wolves': 'Timberwolves',
  'twolves': 'Timberwolves',
  't-wolves': 'Timberwolves',
  
  // Other common aliases
  'gsw': 'Warriors',
  'golden state': 'Warriors',
  'la lakers': 'Lakers',
  'philly': 'Sixers',
  'philadelphia': 'Sixers',
  'san antonio': 'Spurs',
  'new york': 'Knicks',
  'brooklyn': 'Nets',
  'milwaukee': 'Bucks',
  'miami': 'Heat',
  'boston': 'Celtics',
  'chicago': 'Bulls',
  'cleveland': 'Cavaliers',
  'detroit': 'Pistons',
  'indiana': 'Pacers',
  'charlotte': 'Hornets',
  'atlanta': 'Hawks',
  'orlando': 'Magic',
  'washington': 'Wizards',
  'toronto': 'Raptors',
  'memphis': 'Grizzlies',
  'houston': 'Rockets',
  'new orleans': 'Pelicans',
  'sacramento': 'Kings',
  'phoenix': 'Suns',
  'utah': 'Jazz',
  'denver': 'Nuggets',
  'minnesota': 'Timberwolves',
  
  // Free Agents aliases
  'fa': 'Free Agents',
  'free agent': 'Free Agents',
  'freeagents': 'Free Agents',
};

function validateTeamName(team) {
  if (!team) return null;
  
  const normalized = team.trim().toLowerCase();
  
  // Check canonical names first
  const canonical = VALID_TEAMS.find(
    validTeam => validTeam.toLowerCase() === normalized
  );
  if (canonical) return canonical;
  
  // Check aliases
  const aliasMatch = TEAM_ALIASES[normalized];
  if (aliasMatch) return aliasMatch;
  
  return null;
}

async function main() {
  console.log('🔄 Starting team name normalization migration...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const db = drizzle(process.env.DATABASE_URL);
  
  let totalChanges = 0;
  const changes = {
    players: [],
    teamCoins: [],
    faTransactions: [],
    faBids: [],
    capViolations: []
  };
  
  // 1. Normalize players table
  console.log('📋 Checking players table...');
  const playersResult = await db.execute(sql`SELECT id, name, team FROM players WHERE team IS NOT NULL`);
  const players = Array.isArray(playersResult) ? playersResult : playersResult.rows || [];
  
  for (const player of players) {
    const currentTeam = player.team;
    const canonicalTeam = validateTeamName(currentTeam);
    
    if (canonicalTeam && canonicalTeam !== currentTeam) {
      await db.execute(sql`UPDATE players SET team = ${canonicalTeam} WHERE id = ${player.id}`);
      changes.players.push({ id: player.id, name: player.name, from: currentTeam, to: canonicalTeam });
      totalChanges++;
      console.log(`  ✓ ${player.name}: "${currentTeam}" → "${canonicalTeam}"`);
    }
  }
  console.log(`  ${changes.players.length} players updated\n`);
  
  // 2. Normalize team_coins table
  console.log('💰 Checking team_coins table...');
  const teamCoinsResult = await db.execute(sql`SELECT id, team FROM team_coins WHERE team IS NOT NULL`);
  const teamCoins = Array.isArray(teamCoinsResult) ? teamCoinsResult : teamCoinsResult.rows || [];
  
  for (const coin of teamCoins) {
    const currentTeam = coin.team;
    const canonicalTeam = validateTeamName(currentTeam);
    
    if (canonicalTeam && canonicalTeam !== currentTeam) {
      await db.execute(sql`UPDATE team_coins SET team = ${canonicalTeam} WHERE id = ${coin.id}`);
      changes.teamCoins.push({ id: coin.id, from: currentTeam, to: canonicalTeam });
      totalChanges++;
      console.log(`  ✓ Team coins: "${currentTeam}" → "${canonicalTeam}"`);
    }
  }
  console.log(`  ${changes.teamCoins.length} team coin records updated\n`);
  
  // 3. Normalize fa_transactions table
  console.log('📝 Checking fa_transactions table...');
  const faTransactionsResult = await db.execute(sql`SELECT id, team FROM fa_transactions WHERE team IS NOT NULL`);
  const faTransactions = Array.isArray(faTransactionsResult) ? faTransactionsResult : faTransactionsResult.rows || [];
  
  for (const tx of faTransactions) {
    const currentTeam = tx.team;
    const canonicalTeam = validateTeamName(currentTeam);
    
    if (canonicalTeam && canonicalTeam !== currentTeam) {
      await db.execute(sql`UPDATE fa_transactions SET team = ${canonicalTeam} WHERE id = ${tx.id}`);
      changes.faTransactions.push({ id: tx.id, from: currentTeam, to: canonicalTeam });
      totalChanges++;
    }
  }
  console.log(`  ✓ ${changes.faTransactions.length} FA transactions updated\n`);
  
  // 4. Normalize fa_bids table
  console.log('🎯 Checking fa_bids table...');
  const faBidsResult = await db.execute(sql`SELECT id, team FROM fa_bids WHERE team IS NOT NULL`);
  const faBids = Array.isArray(faBidsResult) ? faBidsResult : faBidsResult.rows || [];
  
  for (const bid of faBids) {
    const currentTeam = bid.team;
    const canonicalTeam = validateTeamName(currentTeam);
    
    if (canonicalTeam && canonicalTeam !== currentTeam) {
      await db.execute(sql`UPDATE fa_bids SET team = ${canonicalTeam} WHERE id = ${bid.id}`);
      changes.faBids.push({ id: bid.id, from: currentTeam, to: canonicalTeam });
      totalChanges++;
    }
  }
  console.log(`  ✓ ${changes.faBids.length} FA bids updated\n`);
  
  // 5. Normalize cap_violations table
  console.log('⚠️  Checking cap_violations table...');
  const capViolationsResult = await db.execute(sql`SELECT id, team FROM cap_violations WHERE team IS NOT NULL`);
  const capViolations = Array.isArray(capViolationsResult) ? capViolationsResult : capViolationsResult.rows || [];
  
  for (const violation of capViolations) {
    const currentTeam = violation.team;
    const canonicalTeam = validateTeamName(currentTeam);
    
    if (canonicalTeam && canonicalTeam !== currentTeam) {
      await db.execute(sql`UPDATE cap_violations SET team = ${canonicalTeam} WHERE id = ${violation.id}`);
      changes.capViolations.push({ id: violation.id, from: currentTeam, to: canonicalTeam });
      totalChanges++;
    }
  }
  console.log(`  ✓ ${changes.capViolations.length} cap violations updated\n`);
  
  // Summary
  console.log('═'.repeat(60));
  console.log('✅ Migration completed successfully!\n');
  console.log(`📊 Summary:`);
  console.log(`   • Players: ${changes.players.length} updated`);
  console.log(`   • Team Coins: ${changes.teamCoins.length} updated`);
  console.log(`   • FA Transactions: ${changes.faTransactions.length} updated`);
  console.log(`   • FA Bids: ${changes.faBids.length} updated`);
  console.log(`   • Cap Violations: ${changes.capViolations.length} updated`);
  console.log(`   • Total changes: ${totalChanges}\n`);
  
  if (totalChanges === 0) {
    console.log('✨ All team names are already in canonical format!');
  } else {
    console.log('🎉 All team names have been normalized to canonical format!');
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
