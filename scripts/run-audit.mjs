import { createConnection } from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runAudit() {
  const connection = await createConnection(DATABASE_URL);

  try {
    console.log('Starting upgrade compliance audit...\n');

    // Get total upgrade count
    const [upgradeCount] = await connection.execute('SELECT COUNT(*) as count FROM upgrade_log');
    const totalUpgrades = upgradeCount[0].count;
    console.log(`Total upgrades to audit: ${totalUpgrades}\n`);

    // Get player count
    const [playerCount] = await connection.execute('SELECT COUNT(*) as count FROM players');
    const totalPlayers = playerCount[0].count;
    console.log(`Total players in database: ${totalPlayers}\n`);

    // Sample some upgrades to show what we're working with
    const [sampleUpgrades] = await connection.execute(`
      SELECT 
        playerName,
        userName,
        date,
        sourceType,
        upgradeType,
        badgeOrAttribute,
        fromValue,
        toValue
      FROM upgrade_log
      ORDER BY createdAt DESC
      LIMIT 10
    `);

    console.log('Sample of recent upgrades:');
    console.table(sampleUpgrades);

    // Check for common violations manually
    console.log('\n=== CHECKING FOR COMMON VIOLATIONS ===\n');

    // 1. Check for attributes below 60 being upgraded
    const [lowAttrUpgrades] = await connection.execute(`
      SELECT 
        id,
        playerName,
        badgeOrAttribute,
        fromValue,
        toValue,
        sourceType
      FROM upgrade_log
      WHERE upgradeType = 'Attribute'
        AND fromValue IS NOT NULL
        AND fromValue != ''
        AND CAST(fromValue AS UNSIGNED) < 60
        AND CAST(fromValue AS UNSIGNED) > 0
      LIMIT 20
    `);

    if (lowAttrUpgrades.length > 0) {
      console.log(`❌ Found ${lowAttrUpgrades.length} upgrades with attributes below 60:`);
      console.table(lowAttrUpgrades);
    } else {
      console.log('✅ No attributes below 60 were upgraded');
    }

    // 2. Check for attributes exceeding 88 from gameplay upgrades
    const gameplayTypes = ['Welcome', '5-Game', '7-Game', 'Rookie', 'OG', 'Activity'];
    const gameplayCondition = gameplayTypes.map(t => `sourceType LIKE '%${t}%'`).join(' OR ');

    const [highAttrUpgrades] = await connection.execute(`
      SELECT 
        id,
        playerName,
        badgeOrAttribute,
        fromValue,
        toValue,
        sourceType
      FROM upgrade_log
      WHERE upgradeType = 'Attribute'
        AND toValue IS NOT NULL
        AND toValue != ''
        AND CAST(toValue AS UNSIGNED) > 88
        AND (${gameplayCondition})
      LIMIT 20
    `);

    if (highAttrUpgrades.length > 0) {
      console.log(`\n❌ Found ${highAttrUpgrades.length} gameplay upgrades exceeding 88:`);
      console.table(highAttrUpgrades);
    } else {
      console.log('\n✅ No gameplay upgrades exceeded 88');
    }

    // 3. Check for HOF/Legend badges from gameplay upgrades
    const [hofBadges] = await connection.execute(`
      SELECT 
        id,
        playerName,
        badgeOrAttribute,
        fromValue,
        toValue,
        sourceType
      FROM upgrade_log
      WHERE upgradeType = 'Badge'
        AND (toValue = 'Hall of Fame' OR toValue = 'Legend')
        AND (${gameplayCondition})
      LIMIT 20
    `);

    if (hofBadges.length > 0) {
      console.log(`\n❌ Found ${hofBadges.length} HOF/Legend badges from gameplay upgrades:`);
      console.table(hofBadges);
    } else {
      console.log('\n✅ No HOF/Legend badges from gameplay upgrades');
    }

    // 4. Check for new badges in 5-Game upgrades
    const [newBadges5GM] = await connection.execute(`
      SELECT 
        id,
        playerName,
        badgeOrAttribute,
        fromValue,
        toValue,
        sourceType
      FROM upgrade_log
      WHERE upgradeType = 'Badge'
        AND (fromValue IS NULL OR fromValue = '' OR fromValue = 'None')
        AND sourceType LIKE '%5%'
      LIMIT 20
    `);

    if (newBadges5GM.length > 0) {
      console.log(`\n❌ Found ${newBadges5GM.length} new badges in 5-Game upgrades (should be upgrades only):`);
      console.table(newBadges5GM);
    } else {
      console.log('\n✅ No new badges in 5-Game upgrades');
    }

    // 5. Check for players over 90 OVR getting upgrades
    const [highOVRUpgrades] = await connection.execute(`
      SELECT 
        ul.id,
        ul.playerName,
        p.overall,
        ul.badgeOrAttribute,
        ul.toValue,
        ul.sourceType
      FROM upgrade_log ul
      JOIN players p ON p.name = ul.playerName
      WHERE p.overall > 90
        AND (${gameplayCondition})
      LIMIT 20
    `);

    if (highOVRUpgrades.length > 0) {
      console.log(`\n❌ Found ${highOVRUpgrades.length} upgrades on players over 90 OVR:`);
      console.table(highOVRUpgrades);
    } else {
      console.log('\n✅ No upgrades on players over 90 OVR');
    }

    // Summary
    console.log('\n=== AUDIT SUMMARY ===\n');
    const totalViolations = 
      lowAttrUpgrades.length +
      highAttrUpgrades.length +
      hofBadges.length +
      newBadges5GM.length +
      highOVRUpgrades.length;

    console.log(`Total upgrades checked: ${totalUpgrades}`);
    console.log(`Potential violations found: ${totalViolations}`);
    console.log(`Compliance rate: ${((totalUpgrades - totalViolations) / totalUpgrades * 100).toFixed(2)}%`);

    if (totalViolations === 0) {
      console.log('\n🎉 All upgrades appear to be compliant!');
    } else {
      console.log('\n⚠️  Some violations were found. Review the details above.');
      console.log('\nNext steps:');
      console.log('1. Review violations in the admin UI at /admin/upgrade-compliance');
      console.log('2. Resolve or document each violation');
      console.log('3. Integrate validator into Discord bot workflow');
    }

  } catch (error) {
    console.error('Error running audit:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runAudit().catch(console.error);
