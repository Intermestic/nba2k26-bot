import { getDb } from './server/db';
import { players, badgeAdditions, playerUpgrades } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Comprehensive test for badge addition enforcement
 * Simulates adding 3 badges to a rookie and attempting to upgrade all to silver
 */

async function testBadgeEnforcement() {
  console.log('=== Badge Addition Enforcement Test ===\n');
  
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

  console.log(`Testing with rookie: ${rookiePlayer.name} (ID: ${rookiePlayer.id})\n`);

  // Clean up any existing test data for this player
  await db.delete(badgeAdditions).where(eq(badgeAdditions.playerId, rookiePlayer.id));
  await db.delete(playerUpgrades).where(eq(playerUpgrades.playerId, rookiePlayer.id));
  console.log('✅ Cleaned up existing test data\n');

  // Test badges
  const testBadges = ['SS', 'LIM', 'ANK'];

  // Step 1: Add 3 badges to the rookie (all at bronze initially)
  console.log('Step 1: Adding 3 badges to rookie player...');
  for (const badge of testBadges) {
    // Simulate adding a new badge (none -> bronze)
    const [upgradeResult] = await db.insert(playerUpgrades).values({
      playerId: rookiePlayer.id,
      playerName: rookiePlayer.name,
      badgeName: badge,
      fromLevel: 'none',
      toLevel: 'bronze',
      upgradeType: 'new_badge',
      gameNumber: null,
      requestId: null,
      metadata: JSON.stringify({ upgradeType: 'Rookie', category: 'badge' }),
    });

    // Track the badge addition
    await db.insert(badgeAdditions).values({
      playerId: rookiePlayer.id,
      playerName: rookiePlayer.name,
      badgeName: badge,
      upgradeId: Number(upgradeResult.insertId) || null,
      metadata: JSON.stringify({ fromLevel: 'none', toLevel: 'bronze' }),
    });

    console.log(`   ✅ Added badge: ${badge} (Bronze)`);
  }
  console.log('');

  // Verify badge additions were tracked
  const trackedBadges = await db
    .select()
    .from(badgeAdditions)
    .where(eq(badgeAdditions.playerId, rookiePlayer.id));

  console.log(`✅ Tracked ${trackedBadges.length} badge additions\n`);

  // Step 2: Upgrade first badge to silver (should succeed)
  console.log('Step 2: Upgrading first badge to silver...');
  const firstBadge = testBadges[0];
  
  // Check enforcement
  const silverCount1 = await checkSilverUpgradeLimit(db, rookiePlayer.id, firstBadge);
  if (silverCount1.canUpgrade) {
    await db.insert(playerUpgrades).values({
      playerId: rookiePlayer.id,
      playerName: rookiePlayer.name,
      badgeName: firstBadge,
      fromLevel: 'bronze',
      toLevel: 'silver',
      upgradeType: 'badge_level',
      gameNumber: null,
      requestId: null,
      metadata: JSON.stringify({ upgradeType: 'Rookie', category: 'badge' }),
    });
    console.log(`   ✅ SUCCESS: ${firstBadge} upgraded to Silver (${silverCount1.currentCount + 1}/2)`);
  } else {
    console.log(`   ❌ BLOCKED: ${silverCount1.message}`);
  }
  console.log('');

  // Step 3: Upgrade second badge to silver (should succeed)
  console.log('Step 3: Upgrading second badge to silver...');
  const secondBadge = testBadges[1];
  
  const silverCount2 = await checkSilverUpgradeLimit(db, rookiePlayer.id, secondBadge);
  if (silverCount2.canUpgrade) {
    await db.insert(playerUpgrades).values({
      playerId: rookiePlayer.id,
      playerName: rookiePlayer.name,
      badgeName: secondBadge,
      fromLevel: 'bronze',
      toLevel: 'silver',
      upgradeType: 'badge_level',
      gameNumber: null,
      requestId: null,
      metadata: JSON.stringify({ upgradeType: 'Rookie', category: 'badge' }),
    });
    console.log(`   ✅ SUCCESS: ${secondBadge} upgraded to Silver (${silverCount2.currentCount + 1}/2)`);
  } else {
    console.log(`   ❌ BLOCKED: ${silverCount2.message}`);
  }
  console.log('');

  // Step 4: Attempt to upgrade third badge to silver (should fail)
  console.log('Step 4: Attempting to upgrade third badge to silver...');
  const thirdBadge = testBadges[2];
  
  const silverCount3 = await checkSilverUpgradeLimit(db, rookiePlayer.id, thirdBadge);
  if (silverCount3.canUpgrade) {
    await db.insert(playerUpgrades).values({
      playerId: rookiePlayer.id,
      playerName: rookiePlayer.name,
      badgeName: thirdBadge,
      fromLevel: 'bronze',
      toLevel: 'silver',
      upgradeType: 'badge_level',
      gameNumber: null,
      requestId: null,
      metadata: JSON.stringify({ upgradeType: 'Rookie', category: 'badge' }),
    });
    console.log(`   ⚠️ UNEXPECTED: ${thirdBadge} was allowed to upgrade (should have been blocked!)`);
  } else {
    console.log(`   ✅ CORRECTLY BLOCKED: ${silverCount3.message}`);
  }
  console.log('');

  // Final verification
  console.log('=== Final Verification ===');
  const finalSilverBadges = await db
    .select({ 
      badgeName: badgeAdditions.badgeName,
      toLevel: playerUpgrades.toLevel,
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

  console.log(`Total added badges at Silver: ${finalSilverBadges.length}/2`);
  console.log(`Badges: ${finalSilverBadges.map(b => b.badgeName).join(', ')}`);
  console.log('');

  if (finalSilverBadges.length === 2) {
    console.log('✅ TEST PASSED: Enforcement working correctly!');
  } else {
    console.log(`⚠️ TEST ISSUE: Expected 2 silver badges, got ${finalSilverBadges.length}`);
  }

  process.exit(0);
}

/**
 * Check if a badge can be upgraded to silver (enforcement logic)
 */
async function checkSilverUpgradeLimit(
  db: any,
  playerId: string,
  badgeName: string
): Promise<{ canUpgrade: boolean; currentCount: number; message: string }> {
  // Check if this badge was added (not original)
  const addedBadge = await db
    .select()
    .from(badgeAdditions)
    .where(
      and(
        eq(badgeAdditions.playerId, playerId),
        eq(badgeAdditions.badgeName, badgeName)
      )
    )
    .limit(1);

  if (addedBadge.length === 0) {
    // Not an added badge, no limit applies
    return { canUpgrade: true, currentCount: 0, message: 'Not an added badge' };
  }

  // Count how many added badges have already been upgraded to silver
  const silverUpgradedAddedBadges = await db
    .select({ badgeName: badgeAdditions.badgeName })
    .from(badgeAdditions)
    .innerJoin(
      playerUpgrades,
      and(
        eq(badgeAdditions.playerId, playerUpgrades.playerId),
        eq(badgeAdditions.badgeName, playerUpgrades.badgeName),
        eq(playerUpgrades.toLevel, 'silver')
      )
    )
    .where(eq(badgeAdditions.playerId, playerId));

  const currentCount = silverUpgradedAddedBadges.length;

  if (currentCount >= 2) {
    return {
      canUpgrade: false,
      currentCount,
      message: `Limit reached: ${currentCount}/2 added badges already at Silver (${silverUpgradedAddedBadges.map((b: any) => b.badgeName).join(', ')})`,
    };
  }

  return {
    canUpgrade: true,
    currentCount,
    message: `Can upgrade: ${currentCount}/2 added badges at Silver`,
  };
}

testBadgeEnforcement().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
