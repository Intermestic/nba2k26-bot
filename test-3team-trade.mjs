/**
 * Test 3-team trade parsing
 */

// Mock Discord message structure
const mockMessage = {
  content: '',
  embeds: [
    {
      description: `**Lakers Sends:**

LeBron James 94 (26)
Anthony Davis 93 (24)
--
187/50

**Celtics Sends:**

Jayson Tatum 95 (28)
Jaylen Brown 89 (22)
--
184/50

**Warriors Sends:**

Stephen Curry 96 (30)
Klay Thompson 85 (20)
--
181/50`
    }
  ]
};

console.log('Testing 3-team trade parsing...');
console.log('Trade message:');
console.log(mockMessage.embeds[0].description);
console.log('\n---\n');

// Simulate parsing
const text = mockMessage.embeds[0].description;

// Extract team names
const NBA_TEAMS = [
  '76ers', 'Sixers', 'Bucks', 'Bulls', 'Cavaliers', 'Cavs', 'Celtics', 'Grizzlies',
  'Hawks', 'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic',
  'Mavs', 'Mavericks', 'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons',
  'Raptors', 'Rockets', 'Spurs', 'Suns', 'Timberwolves', 'Wolves',
  'Trail Blazers', 'Blazers', 'Warriors', 'Wizards'
];

const foundTeams = [];
for (const teamName of NBA_TEAMS) {
  if (text.toLowerCase().includes(teamName.toLowerCase())) {
    if (!foundTeams.includes(teamName)) {
      foundTeams.push(teamName);
    }
  }
}

console.log('Found teams:', foundTeams);
console.log('Number of teams:', foundTeams.length);

if (foundTeams.length >= 3) {
  console.log('✅ Successfully detected 3-team trade!');
} else {
  console.log('❌ Failed to detect 3-team trade');
}
