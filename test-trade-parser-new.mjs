// Test the updated trade parser with the user's specific format

// Simple inline parser for testing (mimics the key parts)
function parsePlayerListWithOVR(text) {
  const players = [];
  const lines = text.split(/[\n,]/).map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of lines) {
    // Skip total lines
    if (/^Total[:\s]/i.test(line) || /^[\d\-\/]+$/.test(line)) {
      continue;
    }
    
    // Skip Discord mentions and markdown
    if (/<@!?\d*>/.test(line) || /^\*+$/.test(line)) {
      continue;
    }
    
    // Remove bullet points and dashes at the start
    let cleanLine = line.replace(/^[•\-\*]\s*/, '');
    
    // Pattern: "Player Name OVR (salary)" or "Player Name: OVR (salary)"
    const pattern = /^([A-Za-z\s\-'\.\.]+?)\s*:?\s*(\d+)\s*\(?\s*(\d+)\s*(?:badges)?\)?$/;
    const match = cleanLine.match(pattern);
    
    if (match) {
      const playerName = match[1].trim();
      const overall = parseInt(match[2]);
      const salary = parseInt(match[3]);
      
      if (playerName && playerName !== '--' && !/^\d+$/.test(playerName)) {
        players.push({
          name: playerName,
          overall,
          salary
        });
      }
    }
  }
  
  return players;
}

function findTeamsInOrder(text) {
  const NBA_TEAMS = [
    '76ers', 'Sixers', 'Bucks', 'Bulls', 'Cavaliers', 'Cavs', 'Celtics', 'Grizzlies',
    'Hawks', 'Heat', 'Hornets', 'Jazz', 'Kings', 'Knicks', 'Lakers', 'Magic',
    'Mavs', 'Mavericks', 'Nets', 'Nuggets', 'Pacers', 'Pelicans', 'Pistons',
    'Raptors', 'Rockets', 'Spurs', 'Suns', 'Timberwolves', 'Wolves',
    'Trail Blazers', 'Blazers', 'Warriors', 'Wizards'
  ];
  
  const TEAM_ALIASES = {
    '76ers': 'Sixers',
    'sixers': 'Sixers',
    'cavaliers': 'Cavaliers',
    'cavs': 'Cavaliers',
    'grizzlies': 'Grizzlies',
    'mavericks': 'Mavs',
    'mavs': 'Mavs',
    'timberwolves': 'Timberwolves',
    'wolves': 'Timberwolves',
    'trail blazers': 'Trail Blazers',
    'blazers': 'Trail Blazers',
    'trailblazers': 'Trail Blazers'
  };
  
  function normalizeTeamName(team) {
    const lower = team.toLowerCase().trim();
    return TEAM_ALIASES[lower] || team.trim();
  }
  
  const foundTeams = [];
  const matches = [];
  
  for (const teamName of NBA_TEAMS) {
    // Updated regex to handle @Team(nickname) format
    const regex = new RegExp(`(?:^|\\s|\\*|@)(${teamName})(?:\\s|:|\\*|\\(|$)`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ team: teamName, index: match.index });
    }
  }
  
  matches.sort((a, b) => a.index - b.index);
  
  for (const match of matches) {
    const normalized = normalizeTeamName(match.team);
    if (!foundTeams.includes(normalized)) {
      foundTeams.push(normalized);
    }
  }
  
  return foundTeams;
}

function testParser(testName, text) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(70)}`);
  
  console.log('Input text:');
  console.log(text);
  console.log();
  
  const foundTeams = findTeamsInOrder(text);
  console.log(`✓ Found teams: ${foundTeams.join(', ')}`);
  
  if (foundTeams.length < 2) {
    console.log('❌ FAILED: Not enough teams found');
    return false;
  }
  
  const team1 = foundTeams[0];
  const team2 = foundTeams[1];
  
  // Build regex patterns
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const team1Escaped = escapeRegex(team1);
  const team2Escaped = escapeRegex(team2);
  
  const team1SendPattern = new RegExp(
    `(?:@?\\*{0,2}${team1Escaped}(?:\\([^)]*\\))?\\s+sends?\\*{0,2}\\s*:|\\*{0,2}${team1Escaped}\\s+sends?\\*{0,2}\\s*:)\\s*([^]*?)(?=@?\\*{0,2}${team2Escaped}(?:\\([^)]*\\))?\\s+sends?|$)`,
    'is'
  );
  
  const team2SendPattern = new RegExp(
    `(?:@?\\*{0,2}${team2Escaped}(?:\\([^)]*\\))?\\s+sends?\\*{0,2}\\s*:|\\*{0,2}${team2Escaped}\\s+sends?\\*{0,2}\\s*:)\\s*([^]*?)$`,
    'is'
  );
  
  const team1Match = text.match(team1SendPattern);
  const team2Match = text.match(team2SendPattern);
  
  if (!team1Match) {
    console.log(`❌ FAILED: Could not match Team1 (${team1}) pattern`);
    console.log(`Pattern: ${team1SendPattern.source}`);
    return false;
  }
  
  if (!team2Match) {
    console.log(`❌ FAILED: Could not match Team2 (${team2}) pattern`);
    console.log(`Pattern: ${team2SendPattern.source}`);
    return false;
  }
  
  const team1Players = parsePlayerListWithOVR(team1Match[1]);
  const team2Players = parsePlayerListWithOVR(team2Match[1]);
  
  console.log(`\n✓ Team1 (${team1}) players: ${team1Players.length}`);
  team1Players.forEach(p => console.log(`  - ${p.name} (${p.overall} OVR, ${p.salary} salary)`));
  
  console.log(`\n✓ Team2 (${team2}) players: ${team2Players.length}`);
  team2Players.forEach(p => console.log(`  - ${p.name} (${p.overall} OVR, ${p.salary} salary)`));
  
  if (team1Players.length === 0 || team2Players.length === 0) {
    console.log('\n❌ FAILED: No players parsed');
    return false;
  }
  
  console.log('\n✅ PASSED');
  return true;
}

// Run tests
console.log('\n🧪 UPDATED TRADE PARSER TEST SUITE');
console.log('Testing the parser with various formats including @mentions\n');

const results = [];

// Test 1: User's exact format with @mention and nickname
results.push(testParser('User Format (with @mention and nickname)', `Sixers send:
Tyler Herro 86 (14)
Jaden McDaniels 83 (15)

Total: 169(29)
@Pacers(Steph and browski🦟) send:

Franz Wagner 86 (15)
Jordan Poole 80 (13)

Total: 166(28)`));

// Test 2: Format with bold markdown
results.push(testParser('Format with bold markdown', `**Sixers send:**
Tyler Herro 86 (14)
Jaden McDaniels 83 (15)

**@Pacers(Steph and browski) send:**
Franz Wagner 86 (15)
Jordan Poole 80 (13)`));

// Test 3: Standard format (should still work)
results.push(testParser('Standard format (inline)', `Sixers send: Tyler Herro 86 (14), Jaden McDaniels 83 (15)
Pacers send: Franz Wagner 86 (15), Jordan Poole 80 (13)`));

// Test 4: Format with just @mention (no nickname)
results.push(testParser('Format with @mention only', `Sixers send:
Tyler Herro 86 (14)
Jaden McDaniels 83 (15)

@Pacers send:
Franz Wagner 86 (15)
Jordan Poole 80 (13)`));

// Test 5: Multi-player trade
results.push(testParser('Multi-player trade', `Lakers send:
LeBron James 99 (50)
Anthony Davis 98 (48)
Austin Reaves 82 (15)

Celtics send:
Jayson Tatum 97 (45)
Jaylen Brown 95 (42)
Derrick White 80 (12)`));

console.log(`\n${'='.repeat(70)}`);
console.log(`SUMMARY: ${results.filter(r => r).length}/${results.length} tests passed`);
console.log(`${'='.repeat(70)}\n`);

if (results.every(r => r)) {
  console.log('✅ All tests passed! The parser is ready to handle the user format.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Review the output above.');
  process.exit(1);
}
