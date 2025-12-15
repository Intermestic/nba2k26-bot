import { extract } from 'fuzzball';

const searchName = "giannis";
const playerNames = [
  "Giannis Antetokounmpo",
  "RayJ Dennis",
  "Brandon Miller",
  "Anthony Davis",
  "Jaylen Brown"
];

console.log('Searching for:', searchName);
console.log('\nFuzzy matches:');
const matches = extract(searchName, playerNames);
matches.forEach(([name, score]) => {
  console.log(`  ${name}: ${score}`);
});

console.log('\nBest match:', matches[0]);
