// Test the trade parser with the Spurs-Hawks trade format

const testMessage = `Spurs Sends:

Nickeil Alexander-Walker 80 (11 badges)
Jakob Poeltl 79 (11 badges)

Total: 159 OVR (22 badges)

Hawks Sends:

Zach Edey 79 (8 badges)
Kyle Kuzma 77 (14 badges)

Total: 156 OVR (22 badges)`;

function parsePlayers(section) {
  const players = [];
  
  // Pattern 1 & 2: "PlayerName OVR (salary)" or "PlayerNameOVR (salary)" or "Player Name OVR (X badges)"
  // Also handle "Player Name OVR OVR (salary)" where the word "OVR" appears
  const pattern1 = /([A-Za-z\s\.'-]+?)(\d+)\s*(?:OVR)?\s*\((\d+)(?:\s+badges)?\)/gi;
  let match;
  while ((match = pattern1.exec(section)) !== null) {
    const playerName = match[1].trim();
    // Skip summary lines, placeholders, and lines with just numbers
    if (!playerName || 
        playerName === '--' || 
        playerName.match(/^\d+$/) || 
        playerName.toLowerCase().includes('ovr') || 
        playerName.toLowerCase().includes('badge') ||
        playerName.toLowerCase().includes('total')) {
      continue;
    }
    
    players.push({
      name: playerName,
      overall: parseInt(match[2]),
      salary: parseInt(match[3])
    });
  }
  
  return players;
}

// Strip markdown formatting
let description = testMessage.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '');

// Extract team names
const teamPattern = /(?:^|[\r\n]+)([A-Za-z\s]+)\s+sends?\s*:?/gim;
const teamMatches = Array.from(description.matchAll(teamPattern));

console.log('Team matches:', teamMatches.length);
teamMatches.forEach((match, i) => {
  console.log(`Match ${i}: team='${match[1]}', full='${match[0].replace(/\n/g, '\\n')}'`);
});

// Split by team sections
const sections = description.split(/[A-Za-z\s]+\s+sends?\s*:?/i);

console.log('\nSections:', sections.length);
console.log('Team1 section:', sections[1]?.substring(0, 100));
console.log('Team2 section:', sections[2]?.substring(0, 100));

// Parse players
const team1Players = parsePlayers(sections[1]);
const team2Players = parsePlayers(sections[2]);

console.log('\nParsed results:');
console.log('Team 1 players:', team1Players);
console.log('Team 2 players:', team2Players);
