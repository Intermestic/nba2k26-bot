/**
 * Migration script to sync upgrade_log data to player_upgrades table
 * This ensures historical upgrades from the upgrade log show up when viewing player upgrade history
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { upgradeLog, playerUpgrades, players, playerAliases } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔄 Starting upgrade_log to player_upgrades migration...\n');

  // Use DATABASE_URL like the server does
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔌 Connecting to database using DATABASE_URL\n');

  // Create database connection using DATABASE_URL (same as server/db.ts)
  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Fetch all upgrade log entries
    const allUpgrades = await db.select().from(upgradeLog);
    console.log(`📊 Found ${allUpgrades.length} entries in upgrade_log\n`);

    // Fetch all players to map names to IDs
    const allPlayers = await db.select().from(players);
    const playerNameMap = new Map();
    allPlayers.forEach(player => {
      playerNameMap.set(player.name.toLowerCase().trim(), player.id);
    });
    console.log(`👥 Loaded ${allPlayers.length} players for name mapping\n`);
    
    // Fetch all aliases to map alternate names to IDs
    const allAliases = await db.select().from(playerAliases);
    const aliasMap = new Map();
    allAliases.forEach(alias => {
      aliasMap.set(alias.alias.toLowerCase().trim(), alias.playerId);
    });
    console.log(`🔗 Loaded ${allAliases.length} player aliases\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process each upgrade log entry
    for (const upgrade of allUpgrades) {
      try {
        // Find player ID by name (check both direct name and aliases)
        const normalizedName = upgrade.playerName.toLowerCase().trim();
        let playerId = playerNameMap.get(normalizedName);
        
        // If not found by name, check aliases
        if (!playerId) {
          playerId = aliasMap.get(normalizedName);
        }
        
        if (!playerId) {
          console.log(`⚠️  Skipping: Player "${upgrade.playerName}" not found in players table or aliases`);
          skipCount++;
          continue;
        }

        // Check if this upgrade already exists in player_upgrades
        // We'll use a combination of playerId, badgeName/statName, and createdAt to detect duplicates
        const existingUpgrades = await db
          .select()
          .from(playerUpgrades)
          .where(eq(playerUpgrades.playerId, playerId));

        // Check for duplicate based on badge/attribute name and similar timestamp (within 1 hour)
        const isDuplicate = existingUpgrades.some(existing => {
          const timeDiff = Math.abs(new Date(existing.createdAt).getTime() - new Date(upgrade.createdAt).getTime());
          const withinOneHour = timeDiff < 3600000; // 1 hour in milliseconds
          
          if (upgrade.upgradeType === 'Badge') {
            return existing.badgeName === upgrade.badgeOrAttribute && withinOneHour;
          } else {
            return existing.statName === upgrade.badgeOrAttribute && withinOneHour;
          }
        });

        if (isDuplicate) {
          skipCount++;
          continue;
        }

        // Prepare player_upgrades entry
        const upgradeData = {
          playerId: playerId,
          playerName: upgrade.playerName,
          createdAt: upgrade.createdAt,
          completedAt: upgrade.createdAt,
        };

        if (upgrade.upgradeType === 'Badge') {
          // Badge upgrade
          upgradeData.upgradeType = upgrade.fromValue === 'None' ? 'new_badge' : 'badge_level';
          upgradeData.badgeName = upgrade.badgeOrAttribute;
          upgradeData.fromLevel = mapBadgeLevel(upgrade.fromValue);
          upgradeData.toLevel = mapBadgeLevel(upgrade.toValue);
          upgradeData.statName = null;
          upgradeData.statIncrease = null;
          upgradeData.newStatValue = null;
        } else {
          // Attribute upgrade
          upgradeData.upgradeType = 'attribute';
          upgradeData.badgeName = null;
          upgradeData.fromLevel = null;
          upgradeData.toLevel = null;
          upgradeData.statName = upgrade.badgeOrAttribute;
          
          // Calculate stat increase
          const fromVal = parseInt(upgrade.fromValue) || 0;
          const toVal = parseInt(upgrade.toValue) || 0;
          upgradeData.statIncrease = toVal - fromVal;
          upgradeData.newStatValue = toVal;
        }

        // Parse game number from sourceDetail if available
        upgradeData.gameNumber = parseGameNumber(upgrade.sourceDetail);

        // Build metadata JSON
        upgradeData.metadata = JSON.stringify({
          upgradeType: upgrade.sourceType,
          sourceDetail: upgrade.sourceDetail,
          userName: upgrade.userName,
          date: upgrade.date,
          notes: upgrade.notes,
          flagged: upgrade.flagged === 1,
          flagReason: upgrade.flagReason,
          migratedFrom: 'upgrade_log',
        });

        // Insert into player_upgrades
        await db.insert(playerUpgrades).values(upgradeData);
        
        successCount++;
        console.log(`✅ Migrated: ${upgrade.playerName} - ${upgrade.badgeOrAttribute} (${upgrade.upgradeType})`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing upgrade ID ${upgrade.id}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ⚠️  Skipped (no player match or duplicate): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${allUpgrades.length}\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Map badge level string to enum value
 */
function mapBadgeLevel(level) {
  if (!level) return null;
  const normalized = level.toLowerCase().trim();
  if (normalized === 'none') return 'none';
  if (normalized === 'bronze') return 'bronze';
  if (normalized === 'silver') return 'silver';
  if (normalized === 'gold') return 'gold';
  return null;
}

/**
 * Parse game number from sourceDetail string
 * Examples: "Game 5 badge", "5gm", "7GM badge"
 */
function parseGameNumber(sourceDetail) {
  if (!sourceDetail) return null;
  
  // Match patterns like "Game 5", "5gm", "7GM"
  const match = sourceDetail.match(/(?:Game\s+)?(\d+)\s*(?:gm|GM)?/i);
  if (match && match[1]) {
    return parseInt(match[1]);
  }
  
  return null;
}

// Run migration
main()
  .then(() => {
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
