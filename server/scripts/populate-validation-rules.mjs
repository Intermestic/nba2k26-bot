import { getDb } from '../db.js';

/**
 * Populate validation_rules table with existing hardcoded rules
 */
async function populateValidationRules() {
  console.log('[Validation Rules] Starting population...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Validation Rules] Failed to connect to database');
    process.exit(1);
  }

  const rules = [
    {
      ruleKey: 'back_to_back_upgrades',
      ruleName: 'Back-to-Back Upgrades Check',
      description: 'Prevents players from being upgraded in consecutive games. If enabled, warns when a player was upgraded in the previous game.',
      ruleType: 'boolean',
      enabled: 1,
      numericValue: null,
      textValue: null,
    },
    {
      ruleKey: 'badge_level_limit',
      ruleName: 'Badge Level Increase Limit',
      description: 'Maximum total badge level increases allowed per player (bronze=+1, silver=+2, gold=+3). Default is +6.',
      ruleType: 'numeric',
      enabled: 1,
      numericValue: 6,
      textValue: null,
    },
    {
      ruleKey: 'no_new_badges',
      ruleName: 'No New Badges',
      description: 'Prevents adding badges that the player does not already have. Only existing badges can be upgraded.',
      ruleType: 'boolean',
      enabled: 1,
      numericValue: null,
      textValue: null,
    },
  ];

  try {
    for (const rule of rules) {
      // Check if rule already exists
      const existing = await db.query.validationRules.findFirst({
        where: (vr, { eq }) => eq(vr.ruleKey, rule.ruleKey),
      });

      if (existing) {
        console.log(`[Validation Rules] Rule '${rule.ruleKey}' already exists, skipping`);
        continue;
      }

      // Insert new rule
      await db.insert(db.schema.validationRules).values(rule);
      console.log(`[Validation Rules] ✓ Added rule: ${rule.ruleName}`);
    }

    console.log('[Validation Rules] Population complete!');
    process.exit(0);
  } catch (error) {
    console.error('[Validation Rules] Error:', error);
    process.exit(1);
  }
}

populateValidationRules();
