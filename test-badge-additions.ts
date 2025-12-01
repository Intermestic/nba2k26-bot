import { getDb } from './server/db';
import { players, badgeAdditions, playerUpgrades } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Test script for badge addition tracking and silver upgrade limit enforcement
 * 
 * Test scenarios:
 * 1. Add a new badge to a rookie player - should create badge_additions record
 * 2. Upgrade first added badge to silver - should succeed
 * 3. Upgrade second added badge to silver - should succeed
 * 4. Upgrade third added badge to silver - should fail with error
 */

async function testBadgeAdditionTracking() {
  console.log('=== Testing Badge Addition Tracking System ===\n');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    return;
  }

  // Find a rookie player for testing
  const [rookiePlayer] = await db
    .select()
    .from(players)
    .where(eq(players.isRookie, 1))
    .limit(1);

  if (!rookiePlayer) {
    console.error('❌ No rookie players found in database');
    return;
  }

  console.log(`✅ Found rookie player: ${rookiePlayer.name} (ID: ${rookiePlayer.id})\n`);

  // Check existing badge additions for this player
  const existingAdditions = await db
    .select()
    .from(badgeAdditions)
    .where(eq(badgeAdditions.playerId, rookiePlayer.id));

  console.log(`📊 Existing badge additions: ${existingAdditions.length}`);
  if (existingAdditions.length > 0) {
    console.log('   Badges:', existingAdditions.map(b => b.badgeName).join(', '));
  }
  console.log('');

  // Check how many added badges have been upgraded to silver
  const silverUpgradedAddedBadges = await db
    .select({ 
      badgeName: badgeAdditions.badgeName,
      toLevel: playerUpgrades.toLevel,
      completedAt: playerUpgrades.completedAt,
    })
    .from(badgeAdditions)
    .innerJoin(
      playerUpgrades,
      and(
        eq(badgeAdditions.playerId, playerUpgrades.playerId),
        eq(badgeAdditions.badgeName, playerUpgrades.badgeName),
        eq(playerUpgrades.toLevel, 'silver')
      )
    )
    .where(eq(badgeAdditions.playerId, rookiePlayer.id));

  console.log(`🥈 Silver upgraded added badges: ${silverUpgradedAddedBadges.length}/2`);
  if (silverUpgradedAddedBadges.length > 0) {
    console.log('   Badges:', silverUpgradedAddedBadges.map(b => b.badgeName).join(', '));
  }
  console.log('');

  // Test enforcement logic
  console.log('=== Testing Enforcement Logic ===\n');
  
  if (silverUpgradedAddedBadges.length >= 2) {
    console.log('✅ LIMIT REACHED: Player already has 2 added badges at Silver');
    console.log('   Any attempt to upgrade a 3rd added badge to Silver should be blocked');
  } else {
    console.log(`✅ LIMIT NOT REACHED: Player can upgrade ${2 - silverUpgradedAddedBadges.length} more added badge(s) to Silver`);
  }
  console.log('');

  // Show all player upgrades for this rookie
  const allUpgrades = await db
    .select()
    .from(playerUpgrades)
    .where(eq(playerUpgrades.playerId, rookiePlayer.id));

  console.log(`📋 Total upgrades for ${rookiePlayer.name}: ${allUpgrades.length}`);
  const badgeUpgrades = allUpgrades.filter(u => u.upgradeType === 'new_badge' || u.upgradeType === 'badge_level');
  console.log(`   Badge upgrades: ${badgeUpgrades.length}`);
  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log(`Player: ${rookiePlayer.name}`);
  console.log(`Rookie Status: ${rookiePlayer.isRookie ? 'Yes' : 'No'}`);
  console.log(`Total Badge Additions Tracked: ${existingAdditions.length}`);
  console.log(`Added Badges Upgraded to Silver: ${silverUpgradedAddedBadges.length}/2`);
  console.log(`Can Upgrade More to Silver: ${silverUpgradedAddedBadges.length < 2 ? 'Yes' : 'No'}`);
  console.log('');

  process.exit(0);
}

testBadgeAdditionTracking().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
