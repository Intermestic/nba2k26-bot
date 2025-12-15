const raptorsSection = "\n\nKyle Lowry 75 OVR (8)\nDay'Ron Sharpe\n74 OVR(7)\n149 OVR\n15 badges";

console.log('Raptors section:');
console.log(raptorsSection);
console.log('\n---\n');

// Pattern 1: "PlayerName OVR (salary)"
const pattern1 = /([A-Za-z\s\.'-]+?)(\d+)\s*\((\d+)\)/g;
let match;

console.log('Pattern 1 matches:');
while ((match = pattern1.exec(raptorsSection)) !== null) {
  const playerName = match[1].trim();
  console.log(`  Player: "${playerName}" OVR: ${match[2]} Salary: ${match[3]}`);
  
  // Check if should skip
  if (!playerName || playerName.match(/^\d+$/) || playerName.toLowerCase().includes('ovr') || playerName.toLowerCase().includes('badge')) {
    console.log(`    -> SKIPPED (filter matched)`);
  }
}
