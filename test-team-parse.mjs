const description = "Kings sends:\nBen Sheppard74 (2)\nKelly Olynyk 76 (7)\n150 OVR\n9 badges\n\nRaptors Sends:\n\nKyle Lowry 75 OVR (8)\nDay'Ron Sharpe\n74 OVR(7)\n149 OVR\n15 badges";

// Current pattern
const teamPattern = /([A-Za-z\s]+)\s+sends?\s*:?/gi;
const teamMatches = Array.from(description.matchAll(teamPattern));

console.log('Team matches:');
teamMatches.forEach((match, i) => {
  console.log(`  ${i+1}. Full match: "${match[0]}"`);
  console.log(`     Team name: "${match[1].trim()}"`);
});

// Try improved pattern - only match at start of line or after double newline
const improvedPattern = /(?:^|[\r\n]+)([A-Za-z\s]+)\s+sends?\s*:?/gim;
const improvedMatches = Array.from(description.matchAll(improvedPattern));

console.log('\nImproved pattern matches:');
improvedMatches.forEach((match, i) => {
  console.log(`  ${i+1}. Full match: "${match[0]}"`);
  console.log(`     Team name: "${match[1].trim()}"`);
});
