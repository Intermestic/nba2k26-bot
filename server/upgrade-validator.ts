import { getDb } from './db';
import { badgeRequirements, badgeAbbreviations } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { ParsedUpgrade } from './upgrade-parser';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  ruleViolations: string[]; // Warnings that don't block approval
}

/**
 * Validate an upgrade request
 * Checks badge requirements and attribute thresholds for badge upgrades
 * Validates stat increases for stat upgrades
 */
export async function validateUpgradeRequest(
  upgrade: ParsedUpgrade,
  teamName: string,
  playerHeight?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const ruleViolations: string[] = [];
  
  // Handle stat upgrades differently
  if (upgrade.upgradeType === "stat") {
    return validateStatUpgrade(upgrade, errors, ruleViolations);
  }
  
  // Badge upgrade validation
  return validateBadgeUpgrade(upgrade, errors, ruleViolations, playerHeight);
}

/**
 * Validate stat upgrade
 * Stat upgrades have simpler validation - just check format
 */
function validateStatUpgrade(
  upgrade: ParsedUpgrade,
  errors: string[],
  ruleViolations: string[]
): ValidationResult {
  if (!upgrade.statName || !upgrade.statIncrease || !upgrade.newStatValue) {
    errors.push("Invalid stat upgrade format. Expected: +X stat to value");
    return { valid: false, errors, ruleViolations };
  }
  
  // Validate stat name is recognized
  const validStats = ['3pt', 'mid', 'ft', 'dunk', 'layup', 'pd', 'agl', 'vert', 'str', 'spd'];
  if (!validStats.includes(upgrade.statName.toLowerCase())) {
    ruleViolations.push(`Unrecognized stat: ${upgrade.statName}. Admin review required.`);
  }
  
  // Validate increase is reasonable (1-10 points)
  if (upgrade.statIncrease < 1 || upgrade.statIncrease > 10) {
    ruleViolations.push(`Unusual stat increase: +${upgrade.statIncrease}. Verify this is correct.`);
  }
  
  // Validate new value is reasonable (25-99)
  if (upgrade.newStatValue < 25 || upgrade.newStatValue > 99) {
    ruleViolations.push(`Unusual stat value: ${upgrade.newStatValue}. Verify this is correct.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    ruleViolations,
  };
}

/**
 * Validate badge upgrade
 * Checks badge requirements and attribute thresholds
 */
async function validateBadgeUpgrade(
  upgrade: ParsedUpgrade,
  errors: string[],
  ruleViolations: string[],
  playerHeight?: string
): Promise<ValidationResult> {
  // Check if badge requirements exist for this badge + tier
  const db = await getDb();
  if (!db) {
    errors.push("Database not available");
    return { valid: false, errors, ruleViolations };
  }
  
  // Badge name and tier must be present for badge upgrades
  if (!upgrade.badgeName || !upgrade.toLevel) {
    errors.push("Invalid badge upgrade format. Expected: +1 BADGE to Tier (attributes)");
    return { valid: false, errors, ruleViolations };
  }
  
  // Step 1: Look up full badge name from abbreviation
  const abbreviationLookup = await db
    .select()
    .from(badgeAbbreviations)
    .where(eq(badgeAbbreviations.abbreviation, upgrade.badgeName));
  
  const fullBadgeName = abbreviationLookup.length > 0 
    ? abbreviationLookup[0].fullName 
    : upgrade.badgeName; // Fallback to original if not found
  
  // Step 2: Look up requirements using full badge name
  const requirements = await db
    .select()
    .from(badgeRequirements)
    .where(
      and(
        eq(badgeRequirements.badgeName, fullBadgeName),
        eq(badgeRequirements.tier, upgrade.toLevel as any) // Cast to satisfy TypeScript
      )
    );
  
  if (requirements.length === 0) {
    // No requirements found - this is a warning, not an error
    ruleViolations.push(`No requirements found for ${fullBadgeName} (${upgrade.badgeName}) ${upgrade.toLevel}. Admin review required.`);
    return { valid: true, errors, ruleViolations };
  }
  
  const requirement = requirements[0];
  
  // Check if attributes were provided
  if (!upgrade.attributes || Object.keys(upgrade.attributes).length === 0) {
    errors.push(`Missing attributes. Required: ${formatRequirements(requirement)}`);
    return { valid: false, errors, ruleViolations };
  }
  
  // Validate each required attribute
  if (requirement.attribute1 && requirement.threshold1) {
    const value = upgrade.attributes[requirement.attribute1.toLowerCase()];
    if (value === undefined) {
      errors.push(`Missing required attribute: ${requirement.attribute1}`);
    } else if (value < requirement.threshold1) {
      errors.push(`${requirement.attribute1} must be at least ${requirement.threshold1} (got ${value})`);
    }
  }
  
  if (requirement.attribute2 && requirement.threshold2) {
    const value = upgrade.attributes[requirement.attribute2.toLowerCase()];
    if (value === undefined) {
      errors.push(`Missing required attribute: ${requirement.attribute2}`);
    } else if (value < requirement.threshold2) {
      errors.push(`${requirement.attribute2} must be at least ${requirement.threshold2} (got ${value})`);
    }
  }
  
  if (requirement.attribute3 && requirement.threshold3) {
    const value = upgrade.attributes[requirement.attribute3.toLowerCase()];
    if (value === undefined) {
      errors.push(`Missing required attribute: ${requirement.attribute3}`);
    } else if (value < requirement.threshold3) {
      errors.push(`${requirement.attribute3} must be at least ${requirement.threshold3} (got ${value})`);
    }
  }
  
  // Check game number requirement (5GM for most, 7GM for some, Rookie/OG exceptions)
  if (!upgrade.gameNumber) {
    ruleViolations.push("No game number specified. Verify game requirement (5GM/7GM/Rookie/OG).");
  }
  
  return {
    valid: errors.length === 0,
    errors,
    ruleViolations,
  };
}

/**
 * Format requirements for display
 */
function formatRequirements(requirement: any): string {
  const parts: string[] = [];
  if (requirement.attribute1 && requirement.threshold1) {
    parts.push(`${requirement.attribute1} ${requirement.threshold1}`);
  }
  if (requirement.attribute2 && requirement.threshold2) {
    parts.push(`${requirement.attribute2} ${requirement.threshold2}`);
  }
  if (requirement.attribute3 && requirement.threshold3) {
    parts.push(`${requirement.attribute3} ${requirement.threshold3}`);
  }
  return parts.join(", ");
}

/**
 * Format validation message for Discord reply
 */
export function formatValidationMessage(upgrade: ParsedUpgrade, validation: ValidationResult): string {
  const lines: string[] = [];
  
  // Header
  if (upgrade.upgradeType === "badge") {
    lines.push(`**${upgrade.playerName}** - ${upgrade.badgeName} → ${capitalize(upgrade.toLevel || "")}`);
  } else {
    lines.push(`**${upgrade.playerName}** - ${upgrade.statName?.toUpperCase()} +${upgrade.statIncrease} → ${upgrade.newStatValue}`);
  }
  
  if (validation.valid) {
    lines.push("✅ **Valid** - Awaiting admin approval");
    if (validation.ruleViolations.length > 0) {
      lines.push("⚠️ **Warnings:**");
      validation.ruleViolations.forEach(v => lines.push(`  • ${v}`));
    }
  } else {
    lines.push("❌ **Invalid** - Cannot be approved");
    lines.push("**Errors:**");
    validation.errors.forEach(e => lines.push(`  • ${e}`));
    if (validation.ruleViolations.length > 0) {
      lines.push("**Warnings:**");
      validation.ruleViolations.forEach(v => lines.push(`  • ${v}`));
    }
  }
  
  return lines.join('\n');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
