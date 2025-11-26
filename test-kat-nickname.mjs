import { findPlayerByFuzzyName } from './server/trade-parser.ts';

console.log('Testing "Kat" nickname resolution...\n');

// Test 1: Search for "Kat" without team filter
console.log('Test 1: Search for "Kat" (no team filter)');
const result1 = await findPlayerByFuzzyName('Kat', undefined, 'test');
if (result1) {
  console.log(`✅ Found: ${result1.name} (Team: ${result1.team}, OVR: ${result1.overall})`);
} else {
  console.log('❌ Not found');
}

console.log('\n---\n');

// Test 2: Search for "Kat" with Wizards team filter
console.log('Test 2: Search for "Kat" on Wizards roster');
const result2 = await findPlayerByFuzzyName('Kat', 'Wizards', 'test');
if (result2) {
  console.log(`✅ Found: ${result2.name} (Team: ${result2.team}, OVR: ${result2.overall})`);
} else {
  console.log('❌ Not found');
}

console.log('\n---\n');

// Test 3: Search for "Karl-Anthony Towns" directly
console.log('Test 3: Search for "Karl-Anthony Towns" (full name)');
const result3 = await findPlayerByFuzzyName('Karl-Anthony Towns', undefined, 'test');
if (result3) {
  console.log(`✅ Found: ${result3.name} (Team: ${result3.team}, OVR: ${result3.overall})`);
} else {
  console.log('❌ Not found');
}

process.exit(0);
