import { getDb } from './db';
import { badgeRequirements, badgeAbbreviations, validationRules, upgradeRequests, playerUpgrades } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
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
  playerHeight?: string,
  discordUserId?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const ruleViolations: string[] = [];
  
  // Fetch enabled validation rules from database
  const db = await getDb();
  if (db) {
    const rules = await db.select().from(validationRules).where(eq(validationRules.enabled, true));
    
    // Apply each enabled rule
    for (const rule of rules) {
      const ruleResult = await applyValidationRule(rule, upgrade, teamName, discordUserId, db);
      if (ruleResult.errors.length > 0) {
        errors.push(...ruleResult.errors);
      }
      if (ruleResult.warnings.length > 0) {
        ruleViolations.push(...ruleResult.warnings);
      }
    }
  }
  
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

/**
 * Apply a validation rule to an upgrade request
 */
async function applyValidationRule(
  rule: any,
  upgrade: ParsedUpgrade,
  teamName: string,
  discordUserId: string | undefined,
  db: any
): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const config = typeof rule.config === 'string' ? JSON.parse(rule.config) : rule.config;
    
    switch (rule.ruleType) {
      case 'badge_limit':
        // Check max upgrades per window
        if (rule.ruleName === 'max_upgrades_per_window' && config.maxUpgrades) {
          const recentUpgrades = await db
            .select()
            .from(upgradeRequests)
            .where(
              and(
                eq(upgradeRequests.team, teamName),
                eq(upgradeRequests.status, 'pending')
              )
            );
          
          if (recentUpgrades.length >= config.maxUpgrades) {
            if (rule.severity === 'error') {
              errors.push(rule.errorMessage || `Maximum ${config.maxUpgrades} upgrades per window exceeded`);
            } else {
              warnings.push(rule.errorMessage || `Team has ${recentUpgrades.length} pending upgrades`);
            }
          }
        }
        
        // Check duplicate badges
        if (rule.ruleName === 'allow_duplicate_badges' && !config.allowDuplicates && upgrade.badgeName) {
          const existingBadges = await db
            .select()
            .from(playerUpgrades)
            .where(
              and(
                eq(playerUpgrades.playerName, upgrade.playerName),
                eq(playerUpgrades.badgeName, upgrade.badgeName)
              )
            );
          
          if (existingBadges.length > 0) {
            if (rule.severity === 'error') {
              errors.push(rule.errorMessage || `Player already has ${upgrade.badgeName} badge`);
            } else {
              warnings.push(rule.errorMessage || `Duplicate badge detected: ${upgrade.badgeName}`);
            }
          }
        }
        
        // Auto-approve bronze badges
        if (rule.ruleName === 'auto_approve_bronze' && config.autoApprove && upgrade.toLevel === 'bronze') {
          warnings.push('Bronze badge - eligible for auto-approval');
        }
        break;
      
      case 'cooldown':
        // Check upgrade cooldown period
        if (rule.ruleName === 'upgrade_cooldown_period' && config.cooldownHours && config.perPlayer) {
          const cooldownMs = config.cooldownHours * 60 * 60 * 1000;
          const cutoffTime = new Date(Date.now() - cooldownMs);
          
          const recentPlayerUpgrades = await db
            .select()
            .from(upgradeRequests)
            .where(
              and(
                eq(upgradeRequests.playerName, upgrade.playerName),
                eq(upgradeRequests.team, teamName)
              )
            )
            .orderBy(desc(upgradeRequests.createdAt))
            .limit(1);
          
          if (recentPlayerUpgrades.length > 0) {
            const lastUpgrade = recentPlayerUpgrades[0];
            if (lastUpgrade.createdAt && new Date(lastUpgrade.createdAt) > cutoffTime) {
              const hoursRemaining = Math.ceil((new Date(lastUpgrade.createdAt).getTime() + cooldownMs - Date.now()) / (60 * 60 * 1000));
              if (rule.severity === 'error') {
                errors.push(rule.errorMessage || `Must wait ${hoursRemaining} more hours before next upgrade for ${upgrade.playerName}`);
              } else {
                warnings.push(`Recent upgrade for ${upgrade.playerName} (${hoursRemaining}h ago)`);
              }
            }
          }
        }
        break;
      
      case 'attribute_check':
        // Check minimum attributes required
        if (rule.ruleName === 'min_attributes_required' && config.minAttributes && upgrade.upgradeType === 'badge') {
          const attrCount = upgrade.attributes ? Object.keys(upgrade.attributes).length : 0;
          if (attrCount < config.minAttributes) {
            if (rule.severity === 'error') {
              errors.push(rule.errorMessage || `At least ${config.minAttributes} attributes required (got ${attrCount})`);
            } else {
              warnings.push(`Only ${attrCount} attributes provided (recommended: ${config.minAttributes})`);
            }
          }
        }
        break;
      
      case 'game_requirement':
        // Check if screenshot proof is required
        if (rule.ruleName === 'require_match_proof' && config.requireScreenshot) {
          if (!upgrade.gameNumber) {
            if (rule.severity === 'error') {
              errors.push(rule.errorMessage || 'Screenshot proof is required for badge upgrade requests');
            } else {
              warnings.push('No game number specified - verify screenshot proof was provided');
            }
          }
        }
        break;
    }
  } catch (error) {
    console.error(`[Validation Rule] Error applying rule ${rule.ruleName}:`, error);
    warnings.push(`Failed to apply rule: ${rule.ruleName}`);
  }
  
  return { errors, warnings };
}
