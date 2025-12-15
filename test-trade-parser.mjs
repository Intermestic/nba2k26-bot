/**
 * Test script to verify trade parser works with actual Discord embed format
 */

// Sample embed description from actual Discord message
const sampleEmbed = `**Lakers Sends:**

Adou Thiero 70 (5)
--
70 (5)

**Celtics Sends:**

Colin Castleton 70 (3)
--
70 (3)`;

console.log('Testing trade parser with actual Discord format...\n');
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
sections.forEach((section, i) => {
  console.log(`  Section ${i}:`, JSON.stringify(section.substring(0, 50)));
});
console.log('\n---\n');

// Parse players from each section
const playerPattern = /([A-Za-z\s\.'-]+)\s+(\d+)\s*\((\d+)\)/g;

const team1Section = sections[1];
const team2Section = sections[2];

console.log('Parsing Team 1 players from section:');
console.log(team1Section);
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
  console.log(`  Found: ${player.name} ${player.overall} (${player.salary})`);
}

console.log('\n---\n');

console.log('Parsing Team 2 players from section:');
console.log(team2Section);
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
  console.log(`  Found: ${player.name} ${player.overall} (${player.salary})`);
}

console.log('\n---\n');
console.log('FINAL RESULT:');
console.log(`Team 1: ${teamMatches[0][1].trim()} (${team1Players.length} players)`);
console.log(`Team 2: ${teamMatches[1][1].trim()} (${team2Players.length} players)`);
console.log('\nTeam 1 players:', team1Players);
console.log('Team 2 players:', team2Players);
