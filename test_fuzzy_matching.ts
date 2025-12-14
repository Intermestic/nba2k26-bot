import { findPlayerByFuzzyName } from './server/trade-parser';

const testCases = [
  { input: 'Angelo Russell', expected: "D'Angelo Russell" },
  { input: 'Mohammed Bamba', expected: 'Mohamed Bamba' },
  { input: 'Derrick Jones Jr.', expected: 'Derrick Jones Jr' },
  { input: 'Kelly Oubre Jr.', expected: 'Kelly Oubre Jr' },
  { input: 'Derrick Jones Jr', expected: 'Derrick Jones Jr' },
  { input: 'Kelly Oubre Jr', expected: 'Kelly Oubre Jr' }
];

console.log('Testing fuzzy matching fixes...\n');

for (const testCase of testCases) {
  console.log(`Testing: "${testCase.input}"`);
  const result = await findPlayerByFuzzyName(testCase.input, undefined, 'test');
  
  if (result) {
    const success = result.name === testCase.expected || result.name.toLowerCase() === testCase.expected.toLowerCase();
    console.log(`  ✓ Found: ${result.name} (${result.team}) - ${success ? 'SUCCESS' : 'MISMATCH'}`);
    if (!success) {
      console.log(`    Expected: ${testCase.expected}`);
    }
  } else {
    console.log(`  ✗ NOT FOUND - Expected: ${testCase.expected}`);
  }
  console.log('');
}

process.exit(0);
