import { getDb } from './db';
import { badgeRequirements, playerUpgrades, players, validationRules } from '../drizzle/schema';
import { ParsedUpgrade, getBadgeRequirements } from './upgrade-parser';
import { findPlayerByFuzzyName } from './trade-parser';

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requirements: Array<{
    attribute: string;
    required: number;
    provided?: number;
    met: boolean;
  }>;
  heightCheck?: {
    playerHeight: string;
    minHeight: string;
    maxHeight: string;
    met: boolean;
  };
  ruleViolations: string[];
}

/**
 * Validate upgrade request against badge requirements and league rules
 */
export async function validateUpgradeRequest(
  upgrade: ParsedUpgrade,
  team: string,
  playerHeight?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ruleViolations: string[] = [];
  
  // Get badge requirements for the target level
  const reqs = await getBadgeRequirements(upgrade.badgeName, upgrade.toLevel);
  
  if (reqs.length === 0) {
    errors.push(`❌ **No Requirements Found**`);
    errors.push('');
    errors.push(`Badge **${upgrade.badgeName}** at **${upgrade.toLevel}** level has no requirements in the database.`);
    errors.push('');
    errors.push('**Possible reasons:**');
    errors.push('• Badge name might be misspelled or abbreviated incorrectly');
    errors.push('• This badge level might not exist in the requirements table');
    errors.push('• This badge may not be upgradeable to this level');
    errors.push('');
    errors.push('**Tip:** Check the badge requirements spreadsheet or contact admin.');
    return {
      valid: false,
      errors,
      warnings,
      requirements: [],
      ruleViolations
    };
  }
  
  // Check if attributes were provided
  if (!upgrade.attributes || Object.keys(upgrade.attributes).length === 0) {
    errors.push('❌ **Missing Attribute Values**');
    errors.push('You must provide attribute values for verification.');
    errors.push('');
    errors.push(`**${upgrade.badgeName} - ${upgrade.toLevel.toUpperCase()} Requirements:**`);
    
    for (const req of reqs) {
      errors.push(`• ${req.attribute}: **${req.minValue}+**`);
    }
    
    if (reqs[0].minHeight && reqs[0].maxHeight) {
      errors.push(`• Height: **${reqs[0].minHeight} - ${reqs[0].maxHeight}**`);
    }
    
    return {
      valid: false,
      errors,
      warnings,
      requirements: reqs.map(r => ({
        attribute: r.attribute,
        required: r.minValue,
        met: false
      })),
      ruleViolations
    };
  }
  
  // Validate each attribute requirement
  const requirementChecks = reqs.map(req => {
    const provided = upgrade.attributes![req.attribute];
    const met = provided !== undefined && provided >= req.minValue;
    
    if (!met) {
      if (provided === undefined) {
        errors.push(`• ${req.attribute}: **Not provided** (need ${req.minValue}+)`);
      } else {
        errors.push(`• ${req.attribute}: **${provided}** (need ${req.minValue}+) ❌`);
      }
    }
    
    return {
      attribute: req.attribute,
      required: req.minValue,
      provided,
      met
    };
  });
  
  // Height check (informational only - does not fail validation)
  let heightCheck: ValidationResult['heightCheck'] = undefined;
  if (reqs[0].minHeight && reqs[0].maxHeight && playerHeight) {
    const heightMet = isHeightInRange(playerHeight, reqs[0].minHeight, reqs[0].maxHeight);
    heightCheck = {
      playerHeight,
      minHeight: reqs[0].minHeight,
      maxHeight: reqs[0].maxHeight,
      met: heightMet
    };
    
    // Height is informational only - don't add to errors
    // Admin will review height requirements manually
  }
  
  // Check league rules
  const ruleChecks = await checkLeagueRules(upgrade, team);
  ruleViolations.push(...ruleChecks);
  
  // Only check attribute requirements, not height (height is informational)
  const allRequirementsMet = requirementChecks.every(r => r.met);
  
  return {
    valid: allRequirementsMet && errors.length === 0,
    errors,
    warnings,
    requirements: requirementChecks,
    heightCheck,
    ruleViolations
  };
}

/**
 * Check if height is within range
 */
function isHeightInRange(playerHeight: string, minHeight: string, maxHeight: string): boolean {
  const parseHeight = (h: string): number => {
    const match = h.match(/(\d+)'(\d+)/);
    if (!match) return 0;
    return parseInt(match[1]) * 12 + parseInt(match[2]);
  };
  
  const player = parseHeight(playerHeight);
  const min = parseHeight(minHeight);
  const max = parseHeight(maxHeight);
  
  return player >= min && player <= max;
}

/**
 * Check league rules: back-to-back, +6 limit, no added badges
 * Rules are now configurable via database
 */
async function checkLeagueRules(upgrade: ParsedUpgrade, team: string): Promise<string[]> {
  const violations: string[] = [];
  const db = await getDb();
  if (!db) return violations;
  
  // Load validation rules from database
  const rules = await db.select().from(validationRules);
  const ruleMap = new Map(rules.map(r => [r.ruleKey, r]));
  
  // Find player in database
  const player = await findPlayerByFuzzyName(upgrade.playerName, team, 'upgrade');
  if (!player) {
    return violations; // Can't check rules without player data
  }
  
  // Get player's upgrade history
  const allUpgrades = await db
    .select()
    .from(playerUpgrades);
  
  const history = allUpgrades.filter(u => u.playerId === player.id);
  
  // Rule 1: Back-to-back upgrades (configurable)
  const backToBackRule = ruleMap.get('back_to_back_upgrades');
  if (backToBackRule && backToBackRule.enabled === 1 && upgrade.gameNumber && history.length > 0) {
    const lastUpgrade = history[history.length - 1];
    if (lastUpgrade.gameNumber && upgrade.gameNumber - lastUpgrade.gameNumber === 1) {
      violations.push(`⚠️ **Back-to-Back Upgrade**: ${upgrade.playerName} was upgraded at game ${lastUpgrade.gameNumber}`);
    }
  }
  
  // Rule 2: Badge level limit (configurable)
  const badgeLimitRule = ruleMap.get('badge_level_limit');
  if (badgeLimitRule && badgeLimitRule.enabled === 1) {
    const limit = badgeLimitRule.numericValue || 6;
    const levelValues = { none: 0, bronze: 1, silver: 2, gold: 3 };
    const totalIncrease = history.reduce((sum, h) => {
      const increase = levelValues[h.toLevel] - levelValues[h.fromLevel];
      return sum + increase;
    }, 0);
    
    const thisIncrease = levelValues[upgrade.toLevel] - levelValues[upgrade.fromLevel];
    
    if (totalIncrease + thisIncrease > limit) {
      violations.push(`⚠️ **+${limit} Limit Exceeded**: ${upgrade.playerName} has +${totalIncrease} already, this would make +${totalIncrease + thisIncrease}`);
    }
  }
  
  // Rule 3: No new badges (configurable)
  const noNewBadgesRule = ruleMap.get('no_new_badges');
  if (noNewBadgesRule && noNewBadgesRule.enabled === 1 && upgrade.fromLevel === 'none') {
    const existingBadges = history.filter(h => h.badgeName === upgrade.badgeName);
    if (existingBadges.length === 0) {
      violations.push(`⚠️ **New Badge Added**: ${upgrade.badgeName} is not in ${upgrade.playerName}'s current badge list`);
    }
  }
  
  return violations;
}

/**
 * Format validation result as Discord message
 */
export function formatValidationMessage(
  upgrade: ParsedUpgrade,
  validation: ValidationResult
): string {
  const lines: string[] = [];
  
  if (validation.valid) {
    lines.push('✅ **Upgrade Request Valid**');
    lines.push('');
    lines.push(`**Player:** ${upgrade.playerName}`);
    lines.push(`**Badge:** ${upgrade.badgeName} (${upgrade.badgeAbbreviation})`);
    lines.push(`**Change:** ${upgrade.fromLevel} → **${upgrade.toLevel}**`);
    if (upgrade.gameNumber) {
      lines.push(`**Game:** ${upgrade.gameNumber}`);
    }
    lines.push('');
    lines.push('**Verified Attributes:**');
    for (const req of validation.requirements) {
      lines.push(`• ${req.attribute}: **${req.provided}** ✅ (need ${req.required}+)`);
    }
    
    if (validation.heightCheck) {
      const heightStatus = validation.heightCheck.met ? '✅' : '⚠️';
      lines.push(`• Height: **${validation.heightCheck.playerHeight}** ${heightStatus} (requirement: ${validation.heightCheck.minHeight} - ${validation.heightCheck.maxHeight})`);
    }
  } else {
    lines.push('❌ **Upgrade Request Rejected**');
    lines.push('');
    lines.push(...validation.errors);
  }
  
  // Add rule violations as warnings
  if (validation.ruleViolations.length > 0) {
    lines.push('');
    lines.push('**⚠️ Rule Violations Detected:**');
    lines.push(...validation.ruleViolations);
    lines.push('');
    lines.push('*Admin review required for these violations.*');
  }
  
  return lines.join('\n');
}
