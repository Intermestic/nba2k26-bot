/**
 * Historical Badge Addition Migration Script
 * 
 * This script analyzes the player_upgrades table to identify badge additions
 * and populates the badge_additions table with historical data.
 * 
 * Logic:
 * 1. Find all upgrades with upgradeType = 'new_badge'
 * 2. These represent badge additions (not upgrades to existing badges)
 * 3. Insert them into badge_additions table
 * 4. Mark as usedForSilver=1 if toLevel = 'silver'
 */

import { getDb } from '../db';
import { playerUpgrades, badgeAdditions } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

async function main() {
  console.log('🚀 Starting badge additions migration...\n');
  
  const db = await getDb();
  if (!db) {
    throw new Error('Failed to connect to database');
  }
  
  // Get all new badge upgrades
  const newBadgeUpgrades = await db
    .select()
    .from(playerUpgrades)
    .where(eq(playerUpgrades.upgradeType, 'new_badge'));
  
  console.log(`📊 Found ${newBadgeUpgrades.length} new badge upgrades\n`);
  
  let insertCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const upgrade of newBadgeUpgrades) {
    try {
      // Skip if badge name is null
      if (!upgrade.badgeName) {
        console.log(`  ⚠️  Skipping upgrade ${upgrade.id}: no badge name`);
        skipCount++;
        continue;
      }
      
      // Check if this badge addition already exists
      const existing = await db
        .select()
        .from(badgeAdditions)
        .where(
          and(
            eq(badgeAdditions.playerId, upgrade.playerId),
            eq(badgeAdditions.badgeName, upgrade.badgeName),
            eq(badgeAdditions.upgradeId, upgrade.id)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`  ⚠️  Badge addition already exists: ${upgrade.playerName} - ${upgrade.badgeName}`);
        skipCount++;
        continue;
      }
      
      // Determine if this was used for silver upgrade
      const usedForSilver = upgrade.toLevel === 'silver' ? 1 : 0;
      
      // Parse metadata to get upgrade source
      let metadata: any = {};
      try {
        if (upgrade.metadata) {
          metadata = JSON.parse(upgrade.metadata);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      // Insert badge addition
      await db.insert(badgeAdditions).values({
        playerId: upgrade.playerId,
        playerName: upgrade.playerName,
        badgeName: upgrade.badgeName,
        addedAt: upgrade.completedAt,
        upgradeId: upgrade.id,
        usedForSilver,
        metadata: JSON.stringify({
          source: 'historical_migration',
          originalLevel: upgrade.toLevel,
          gameNumber: upgrade.gameNumber,
          upgradeSource: metadata.upgradeType || 'unknown',
          category: metadata.category,
        }),
      });
      
      insertCount++;
      const silverTag = usedForSilver ? ' ⭐ SILVER' : '';
      console.log(`  ✅ Added: ${upgrade.playerName} - ${upgrade.badgeName}${silverTag}`);
      
    } catch (error) {
      console.error(`  ❌ Error processing upgrade ${upgrade.id}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n\n📈 Migration Summary:');
  console.log('═'.repeat(60));
  console.log(`Total new badge upgrades found: ${newBadgeUpgrades.length}`);
  console.log(`Successfully inserted: ${insertCount}`);
  console.log(`Skipped (already exists or no badge name): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('═'.repeat(60));
  
  // Get statistics
  const [totalAdditions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(badgeAdditions);
  
  const [silverCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(badgeAdditions)
    .where(eq(badgeAdditions.usedForSilver, 1));
  
  const [rookiesWithAdditions] = await db
    .select({ count: sql<number>`count(distinct ${badgeAdditions.playerId})` })
    .from(badgeAdditions);
  
  console.log(`\n📊 Current Badge Additions Statistics:`);
  console.log(`Total badge additions: ${totalAdditions?.count || 0}`);
  console.log(`Silver upgrades: ${silverCount?.count || 0}`);
  console.log(`Players with additions: ${rookiesWithAdditions?.count || 0}`);
  
  console.log('\n✅ Migration complete!\n');
}

// Run migration
main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
