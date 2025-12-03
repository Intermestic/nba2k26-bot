/**
 * Test script to verify trade parser works with multi-player trade
 */

// Sample embed description from Bucks/Pacers trade
const sampleEmbed = `**Bucks Sends:**

Naz Reid 82 (18)
Thomas Sorber 71 (1)
--
153 (19)

**Pacers Sends:**

Jaime Jaquez Jr 80 (9)
Kyle Kuzma 77 (14)
--
157 (23)`;

console.log('Testing trade parser with multi-player trade...\n');
console.log('Sample embed:');
console.log(sampleEmbed);
console.log('\n---\n');

// Strip markdown formatting
let description = sampleEmbed.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '');
console.log('After stripping markdown:');
console.log(description);
console.log('\n---\n');

// Extract team names
const teamPattern = /([A-Za-z\s]+)\s+sends?:/gi;
const teamMatches = Array.from(description.matchAll(teamPattern));

console.log('Team matches:', teamMatches.length);
teamMatches.forEach((match, i) => {
  console.log(`  Team ${i + 1}: "${match[1].trim()}"`);
});
console.log('\n---\n');

// Split by team sections
const sections = description.split(/[A-Za-z\s]+\s+sends?:/i);
console.log('Sections:', sections.length);

// Parse players from each section
const playerPattern = /([A-Za-z\s\.'-]+)\s+(\d+)\s*\((\d+)\)/g;

const team1Section = sections[1];
const team2Section = sections[2];

console.log('Parsing Team 1 players:');
const team1Players = [];
let match;
while ((match = playerPattern.exec(team1Section)) !== null) {
  const playerName = match[1].trim();
  // Skip summary lines
  if (playerName === '--' || playerName.startsWith('--')) {
    console.log(`  Skipped summary line: ${playerName}`);
    continue;
  }
  
  const player = {
    name: playerName,
    overall: parseInt(match[2]),
    salary: parseInt(match[3])
  };
  team1Players.push(player);
  console.log(`  ✓ ${player.name} ${player.overall} (${player.salary})`);
}

console.log('\nParsing Team 2 players:');
playerPattern.lastIndex = 0; // Reset regex
const team2Players = [];
while ((match = playerPattern.exec(team2Section)) !== null) {
  const playerName = match[1].trim();
  // Skip summary lines
  if (playerName === '--' || playerName.startsWith('--')) {
    console.log(`  Skipped summary line: ${playerName}`);
    continue;
  }
  
  const player = {
    name: playerName,
    overall: parseInt(match[2]),
    salary: parseInt(match[3])
  };
  team2Players.push(player);
  console.log(`  ✓ ${player.name} ${player.overall} (${player.salary})`);
}

console.log('\n---\n');
console.log('✅ FINAL RESULT:');
console.log(`${teamMatches[0][1].trim()} sends ${team1Players.length} player(s):`);
team1Players.forEach(p => console.log(`  - ${p.name} (${p.overall} OVR, ${p.salary}M)`));
console.log(`\n${teamMatches[1][1].trim()} sends ${team2Players.length} player(s):`);
team2Players.forEach(p => console.log(`  - ${p.name} (${p.overall} OVR, ${p.salary}M)`));
