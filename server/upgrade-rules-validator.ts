import { getDb } from './db';
import { validationRules, playerUpgrades, upgradeRequests, players, badgeAdditions } from '../drizzle/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import type { ParsedUpgrade } from './upgrade-parser';

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive upgrade validation based on user's rule system
 * Validates: Rookie status, back-to-backs, +6 limits, OVR, attributes, badges, game counts
 * SKIPS: Age and height validation (manual verification)
 */
export async function validateUpgradeRules(
  upgrade: ParsedUpgrade,
  teamName: string,
  discordUserId?: string
): Promise<RuleValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const db = await getDb();
  if (!db) {
    errors.push("Database not available");
    return { valid: false, errors, warnings };
  }

  // Fetch player data (case-insensitive)
  const playerData = await db
    .select()
    .from(players)
    .where(sql`LOWER(${players.name}) = LOWER(${upgrade.playerName})`)
    .limit(1);

  if (playerData.length === 0) {
    warnings.push(`Player ${upgrade.playerName} not found in database - some validations skipped`);
  }

  const player = playerData[0];

  // Determine upgrade type from game number or context
  const upgradeType = determineUpgradeType(upgrade);

  // Run validations based on upgrade type
  switch (upgradeType) {
    case 'Global':
      await validateGlobalRules(upgrade, player, errors, warnings, db);
      break;
    case 'Welcome':
      await validateWelcomeUG(upgrade, player, teamName, errors, warnings, db);
      break;
    case '5-Game Badge':
      await validate5GameBadge(upgrade, player, teamName, errors, warnings, db);
      break;
    case '7-Game Attribute':
      await validate7GameAttribute(upgrade, player, teamName, errors, warnings, db);
      break;
    case 'Rookie':
      await validateRookieUG(upgrade, player, teamName, errors, warnings, db);
      break;
    case 'OG':
      await validateOGUG(upgrade, player, teamName, errors, warnings, db);
      break;
    case 'Superstar Pack':
      await validateSuperstarPack(upgrade, player, teamName, errors, warnings, db);
      break;
    case 'Activity Bonus':
      await validateActivityBonus(upgrade, player, teamName, discordUserId, errors, warnings, db);
      break;
  }

  // Always run global validations
  await validateGlobalRules(upgrade, player, errors, warnings, db);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Determine upgrade type from context
 */
function determineUpgradeType(upgrade: ParsedUpgrade): string {
  // This would be determined from Discord message context or admin selection
  // For now, return 'Global' to run global validations
  // TODO: Extract upgrade type from Discord message or admin UI
  return 'Global';
}

/**
 * Global attribute and badge rules
 */
async function validateGlobalRules(
  upgrade: ParsedUpgrade,
  player: any,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Global Attribute Rules
  if (upgrade.upgradeType === 'stat' || upgrade.statIncrease) {
    // Attributes must be at least 60 to be eligible
    if (upgrade.newStatValue && upgrade.newStatValue < 60) {
      errors.push(`Attributes must be at least 60 (got ${upgrade.newStatValue})`);
    }

    // Max 88 for gameplay upgrades (Welcome, 5GM, 7GM, Rookie, OG, Activity)
    if (upgrade.newStatValue && upgrade.newStatValue > 88) {
      warnings.push(`Attribute ${upgrade.newStatValue} exceeds gameplay upgrade cap of 88 (Award/Challenge/Superstar can go to 90)`);
    }

    // Check for back-to-back attribute upgrades on same attribute
    if (upgrade.statName) {
      const recentUpgrades = await db
        .select()
        .from(playerUpgrades)
        .where(
          and(
            eq(playerUpgrades.playerName, upgrade.playerName),
            eq(playerUpgrades.statName, upgrade.statName)
          )
        )
        .orderBy(desc(playerUpgrades.createdAt))
        .limit(2);

      if (recentUpgrades.length >= 2) {
        const lastTwo = recentUpgrades.slice(0, 2);
        const timeDiff = lastTwo[0].createdAt && lastTwo[1].createdAt
          ? new Date(lastTwo[0].createdAt).getTime() - new Date(lastTwo[1].createdAt).getTime()
          : 0;

        // If both upgrades are within 7 days, it's likely back-to-back
        if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
          errors.push(`Cannot apply back-to-back attribute upgrades to ${upgrade.statName} on ${upgrade.playerName}`);
        }
      }
    }
  }

  // Global Badge Rules
  if (upgrade.upgradeType === 'badge' && upgrade.badgeName && upgrade.toLevel) {
    // Only Bronze/Silver/Gold allowed (no HOF/Legend)
    const tier = upgrade.toLevel.toLowerCase();
    if (tier === 'hall of fame' || tier === 'hof' || tier === 'legend') {
      errors.push(`Hall of Fame and Legend badges are not allowed except via Superstar Pack Option B`);
    }

    // Check restricted badges for non-rookies
    if (player && !player.isRookie) {
      const restrictedBadges = ['Paint Patroller', 'Dimer', 'On-Ball Menace'];
      if (restrictedBadges.some(b => upgrade.badgeName?.toLowerCase().includes(b.toLowerCase()))) {
        errors.push(`Non-rookies may not add or upgrade: ${restrictedBadges.join(', ')}`);
      }
    }

    // Strong Handle cannot be added or upgraded by anyone
    if (upgrade.badgeName.toLowerCase().includes('strong handle')) {
      errors.push(`Strong Handle cannot be added or upgraded by any player`);
    }
  }
}

/**
 * Welcome UG validation
 */
async function validateWelcomeUG(
  upgrade: ParsedUpgrade,
  player: any,
  teamName: string,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Check OVR limit
  if (player && player.overall > 90) {
    errors.push(`Welcome UG requires player ≤90 OVR (${player.name} is ${player.overall} OVR)`);
  }

  // Check team hasn't already used Welcome UG this season
  const existingWelcome = await db
    .select()
    .from(playerUpgrades)
    .where(
      and(
        sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.upgradeType') = 'Welcome'`,
        sql`YEAR(${playerUpgrades.createdAt}) = YEAR(CURDATE())`
      )
    );

  if (existingWelcome.length > 0) {
    errors.push(`Team has already used their Welcome Upgrade this season`);
  }

  // Check per-player limits: max +5 attributes, +4 badges
  // This would need to be tracked in the upgrade metadata
  warnings.push(`Verify Welcome UG limits: max +5 attributes and +4 badges for this player`);
}

/**
 * 5-Game Badge validation
 */
async function validate5GameBadge(
  upgrade: ParsedUpgrade,
  player: any,
  teamName: string,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Must be badge upgrade (no new badges)
  if (upgrade.upgradeType !== 'badge') {
    errors.push(`5-Game Badge UG can only upgrade existing badges (no new badges)`);
  }

  // Check OVR limit
  if (player && player.overall > 90) {
    errors.push(`5-Game Badge UG requires player ≤90 OVR (${player.name} is ${player.overall} OVR)`);
  }

  // Check for back-to-back on same player
  const recentUpgrades = await db
    .select()
    .from(playerUpgrades)
    .where(
      and(
        eq(playerUpgrades.playerName, upgrade.playerName),
        sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.upgradeType') = '5-Game Badge'`
      )
    )
    .orderBy(desc(playerUpgrades.createdAt))
    .limit(1);

  if (recentUpgrades.length > 0) {
    const lastUpgrade = recentUpgrades[0];
    const daysSince = lastUpgrade.createdAt
      ? (Date.now() - new Date(lastUpgrade.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSince < 7) {
      errors.push(`Cannot apply 5-Game Badge UG to same player back-to-back (last upgrade ${Math.floor(daysSince)} days ago)`);
    }
  }
}

/**
 * 7-Game Attribute validation
 */
async function validate7GameAttribute(
  upgrade: ParsedUpgrade,
  player: any,
  teamName: string,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Must be attribute upgrade
  if (upgrade.upgradeType !== 'stat') {
    errors.push(`7-Game Attribute UG can only upgrade attributes (not badges)`);
  }

  // Check OVR limit
  if (player && player.overall > 90) {
    errors.push(`7-Game Attribute UG requires player ≤90 OVR (${player.name} is ${player.overall} OVR)`);
  }

  // Check seasonal +6 cap per attribute
  if (upgrade.statName) {
    const seasonUpgrades = await db
      .select()
      .from(playerUpgrades)
      .where(
        and(
          eq(playerUpgrades.playerName, upgrade.playerName),
          eq(playerUpgrades.statName, upgrade.statName),
          sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.upgradeType') = '7-Game Attribute'`,
          sql`YEAR(${playerUpgrades.createdAt}) = YEAR(CURDATE())`
        )
      );

    const totalIncrease = seasonUpgrades.reduce((sum: number, u: any) => sum + (u.statIncrease || 0), 0);
    if (totalIncrease + (upgrade.statIncrease || 0) > 6) {
      errors.push(`7-Game Attribute UG: max +6 per attribute per season (${upgrade.statName} already has +${totalIncrease} this season)`);
    }
  }

  // Check for back-to-back on same attribute
  if (upgrade.statName) {
    const recentUpgrades = await db
      .select()
      .from(playerUpgrades)
      .where(
        and(
          eq(playerUpgrades.playerName, upgrade.playerName),
          eq(playerUpgrades.statName, upgrade.statName),
          sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.upgradeType') = '7-Game Attribute'`
        )
      )
      .orderBy(desc(playerUpgrades.createdAt))
      .limit(1);

    if (recentUpgrades.length > 0) {
      const lastUpgrade = recentUpgrades[0];
      const daysSince = lastUpgrade.createdAt
        ? (Date.now() - new Date(lastUpgrade.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSince < 7) {
        errors.push(`Cannot apply 7-Game UG to same attribute back-to-back (${upgrade.statName} upgraded ${Math.floor(daysSince)} days ago)`);
      }
    }
  }
}

/**
 * Rookie UG validation
 */
async function validateRookieUG(
  upgrade: ParsedUpgrade,
  player: any,
  teamName: string,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Must be a rookie
  if (player && !player.isRookie) {
    errors.push(`Rookie UG can only be applied to designated rookie-class players (${player.name} is not a rookie)`);
  }

  // Check +6 max per attribute from Rookie UGs
  if (upgrade.upgradeType === 'stat' && upgrade.statName) {
    const rookieUpgrades = await db
      .select()
      .from(playerUpgrades)
      .where(
        and(
          eq(playerUpgrades.playerName, upgrade.playerName),
          eq(playerUpgrades.statName, upgrade.statName),
          sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.upgradeType') = 'Rookie'`
        )
      );

    const totalIncrease = rookieUpgrades.reduce((sum: number, u: any) => sum + (u.statIncrease || 0), 0);
    if (totalIncrease + (upgrade.statIncrease || 0) > 6) {
      errors.push(`Rookie UG: max +6 to any single attribute (${upgrade.statName} already has +${totalIncrease} from Rookie UGs)`);
    }

    // Check for back-to-back on same attribute
    const recentUpgrades = rookieUpgrades.sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    if (recentUpgrades.length > 0) {
      const lastUpgrade = recentUpgrades[0];
      const daysSince = lastUpgrade.createdAt
        ? (Date.now() - new Date(lastUpgrade.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSince < 14) {
        errors.push(`Rookie UG: cannot give +3 to same attribute twice in a row (${upgrade.statName} upgraded ${Math.floor(daysSince)} days ago)`);
      }
    }
  }

  // Badge validation for rookies
  if (upgrade.upgradeType === 'badge') {
    // Check if upgrading an added badge to silver
    if (upgrade.fromLevel === 'bronze' && upgrade.toLevel === 'silver' && upgrade.badgeName) {
      // Check if this badge was added (not original)
      const addedBadge = await db
        .select()
        .from(badgeAdditions)
        .where(
          and(
            eq(badgeAdditions.playerId, player?.id || ''),
            eq(badgeAdditions.badgeName, upgrade.badgeName)
          )
        )
        .limit(1);
      
      if (addedBadge.length > 0) {
        // This is an added badge being upgraded to silver
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
          .where(eq(badgeAdditions.playerId, player?.id || ''));
        
        if (silverUpgradedAddedBadges.length >= 2) {
          errors.push(
            `Rookie badge limit: Only 2 added badges can be upgraded to Silver. ` +
            `This player already has ${silverUpgradedAddedBadges.length} added badges at Silver ` +
            `(${silverUpgradedAddedBadges.map((b: any) => b.badgeName).join(', ')})`
          );
        }
      }
    }
    
    // General warning for rookie badge rules
    if (upgrade.fromLevel === 'none') {
      warnings.push(`Rookie badge rule: Only two added badges may be upgraded to Silver, others must stay Bronze`);
    }
  }
}

/**
 * OG UG validation
 */
async function validateOGUG(
  upgrade: ParsedUpgrade,
  player: any,
  teamName: string,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Check OVR limit
  if (player && player.overall > 90) {
    errors.push(`OG UG requires player ≤90 OVR (${player.name} is ${player.overall} OVR)`);
  }

  // OG UGs cannot add new badges
  if (upgrade.upgradeType === 'badge') {
    warnings.push(`OG UGs can only upgrade existing badges (cannot add new badges)`);
  }

  // Attributes must be between 60 and 85
  if (upgrade.upgradeType === 'stat' && upgrade.newStatValue) {
    if (upgrade.newStatValue < 60 || upgrade.newStatValue > 85) {
      errors.push(`OG UG: attributes must be between 60 and 85 (got ${upgrade.newStatValue})`);
    }
  }

  // Check for back-to-back in same category (attribute or badge)
  const category = upgrade.upgradeType === 'stat' ? 'attribute' : 'badge';
  const recentUpgrades = await db
    .select()
    .from(playerUpgrades)
    .where(
      and(
        eq(playerUpgrades.playerName, upgrade.playerName),
        sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.upgradeType') = 'OG'`,
        sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.category') = '${category}'`
      )
    )
    .orderBy(desc(playerUpgrades.createdAt))
    .limit(1);

  if (recentUpgrades.length > 0) {
    const lastUpgrade = recentUpgrades[0];
    const daysSince = lastUpgrade.createdAt
      ? (Date.now() - new Date(lastUpgrade.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSince < 14) {
      errors.push(`OG UG: cannot apply back-to-back in same category (last ${category} upgrade ${Math.floor(daysSince)} days ago)`);
    }
  }
}

/**
 * Superstar Pack validation
 */
async function validateSuperstarPack(
  upgrade: ParsedUpgrade,
  player: any,
  teamName: string,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Check OVR limit
  if (player && player.overall > 88) {
    errors.push(`Superstar Pack requires player ≤88 OVR (${player.name} is ${player.overall} OVR)`);
  }

  // Option B: Hall of Fame badge upgrade
  if (upgrade.upgradeType === 'badge' && upgrade.toLevel) {
    const tier = upgrade.toLevel.toLowerCase();
    if (tier === 'hall of fame' || tier === 'hof') {
      warnings.push(`Superstar Pack Option B: verify badge is archetype-appropriate and player has ≥40 games`);
    }
  }

  // Option A: +4 to every attribute in 3 subcategories
  warnings.push(`Verify Superstar Pack requirements: ≤88 OVR, ≥40 games with team`);
}

/**
 * Activity Bonus validation
 */
async function validateActivityBonus(
  upgrade: ParsedUpgrade,
  player: any,
  teamName: string,
  discordUserId: string | undefined,
  errors: string[],
  warnings: string[],
  db: any
) {
  // Check OVR limit
  if (player && player.overall > 90) {
    errors.push(`Activity Bonus requires player ≤90 OVR (${player.name} is ${player.overall} OVR)`);
  }

  // Check for back-to-back same player in consecutive Activity Bonus cycles
  if (discordUserId) {
    const recentBonuses = await db
      .select()
      .from(playerUpgrades)
      .where(
        and(
          eq(playerUpgrades.playerName, upgrade.playerName),
          sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.upgradeType') = 'Activity Bonus'`,
          sql`JSON_EXTRACT(${playerUpgrades.metadata}, '$.userId') = '${discordUserId}'`
        )
      )
      .orderBy(desc(playerUpgrades.createdAt))
      .limit(1);

    if (recentBonuses.length > 0) {
      const lastBonus = recentBonuses[0];
      const daysSince = lastBonus.createdAt
        ? (Date.now() - new Date(lastBonus.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSince < 7) {
        errors.push(`Cannot upgrade same player in consecutive Activity Bonus cycles (last bonus ${Math.floor(daysSince)} days ago)`);
      }
    }
  }

  // Verify alternating pattern (85=Badge, 90=Attribute, 95=Badge, etc.)
  warnings.push(`Verify Activity Bonus pattern: Badge at 85/95/105/115/125, Attribute at 90/100/110/120`);
}
