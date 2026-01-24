import Fuse from 'fuse.js';

// Test data with common player names
const testPlayers = [
  { id: 1, name: 'Nikola Jokic', overall: 99, team: 'Nuggets' },
  { id: 2, name: 'Luka Doncic', overall: 98, team: 'Mavericks' },
  { id: 3, name: 'Anthony Edwards', overall: 95, team: 'Timberwolves' },
  { id: 4, name: 'Kawhi Leonard', overall: 94, team: 'Clippers' },
  { id: 5, name: 'Dennis Schroder', overall: 82, team: 'Warriors' },
  { id: 6, name: 'Kristaps Porzingis', overall: 88, team: 'Celtics' },
  { id: 7, name: 'Bogdan Bogdanovic', overall: 85, team: 'Hawks' },
  { id: 8, name: 'Jusuf Nurkic', overall: 84, team: 'Suns' },
];

// Create fuzzy search index
const fuse = new Fuse(testPlayers, {
  keys: ['name', 'team'],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
});

// Test cases
const testCases = [
  { query: 'jokic', expected: 'Nikola Jokic', description: 'Simple last name' },
  { query: 'nikola', expected: 'Nikola Jokic', description: 'First name only' },
  { query: 'nikola jokik', expected: 'Nikola Jokic', description: 'Typo in last name (k instead of c)' },
  { query: 'luka d', expected: 'Luka Doncic', description: 'Partial name' },
  { query: 'luka donci', expected: 'Luka Doncic', description: 'Partial with typo' },
  { query: 'anthony', expected: 'Anthony Edwards', description: 'First name' },
  { query: 'edwards', expected: 'Anthony Edwards', description: 'Last name' },
  { query: 'schroeder', expected: 'Dennis Schroder', description: 'Misspelled (extra e)' },
  { query: 'schrod', expected: 'Dennis Schroder', description: 'Partial misspelled' },
  { query: 'kristaps', expected: 'Kristaps Porzingis', description: 'First name of complex name' },
  { query: 'porzingis', expected: 'Kristaps Porzingis', description: 'Last name of complex name' },
  { query: 'bogdan', expected: 'Bogdan Bogdanovic', description: 'Repeated name (first part)' },
  { query: 'JOKIC', expected: 'Nikola Jokic', description: 'Uppercase query' },
  { query: 'jOkIc', expected: 'Nikola Jokic', description: 'Mixed case query' },
  { query: 'nurkic', expected: 'Jusuf Nurkic', description: 'Last name with special char removed' },
  { query: 'kawhi', expected: 'Kawhi Leonard', description: 'First name' },
  { query: 'leonard', expected: 'Kawhi Leonard', description: 'Last name' },
];

console.log('=== Fuzzy Search Test Results ===\n');

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, index) => {
  const results = fuse.search(testCase.query);
  const topResult = results[0];
  const matched = topResult?.item.name === testCase.expected;
  
  const status = matched ? '✓ PASS' : '✗ FAIL';
  const score = topResult ? Math.round((1 - topResult.score) * 100) : 0;
  
  console.log(`${status} | Test ${index + 1}: "${testCase.query}"`);
  console.log(`       Description: ${testCase.description}`);
  console.log(`       Expected: ${testCase.expected}`);
  console.log(`       Got: ${topResult?.item.name || 'No match'} (${score}% match)`);
  console.log();
  
  if (matched) {
    passCount++;
  } else {
    failCount++;
  }
});

console.log(`=== Summary ===`);
console.log(`Passed: ${passCount}/${testCases.length}`);
console.log(`Failed: ${failCount}/${testCases.length}`);
console.log(`Success Rate: ${Math.round((passCount / testCases.length) * 100)}%`);
