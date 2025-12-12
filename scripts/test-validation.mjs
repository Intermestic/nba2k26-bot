import { parseUpgradeRequests } from '../server/upgrade-parser.js';
import { validateUpgradeRequest } from '../server/upgrade-validator.js';

const testInput = `
Suggs - SS → Bronze
Suggs - PTZ → Bronze
Giddey - CHL → Bronze
Giddey - SSS → Bronze
Brooks - SS → Bronze
Sarr - LR → Bronze
Kat - MID +3 → 72
Kat - 3PT +2 → 86
Simmons - FT +3 → 76
Brooks - SS → Silver
Kat - MID +3 → 75
`;

console.log("Testing upgrade validation with real requests...\n");
console.log("="*80);

const upgrades = parseUpgradeRequests(testInput);

console.log(`\nParsed ${upgrades.length} upgrade requests:\n`);

for (const upgrade of upgrades) {
  console.log(`\n${upgrade.playerName} - ${upgrade.badgeName || upgrade.statName} → ${upgrade.toLevel || upgrade.newStatValue}`);
  
  try {
    const validation = await validateUpgradeRequest(upgrade, "Test Team");
    
    if (validation.valid) {
      console.log("  ✅ Valid");
      if (validation.ruleViolations.length > 0) {
        console.log("  ⚠️  Warnings:");
        validation.ruleViolations.forEach(w => console.log(`     • ${w}`));
      }
    } else {
      console.log("  ❌ Invalid");
      console.log("  Errors:");
      validation.errors.forEach(e => console.log(`     • ${e}`));
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
}

console.log("\n" + "="*80);
console.log("Test complete!");
