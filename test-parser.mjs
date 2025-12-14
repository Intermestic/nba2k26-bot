const description = "Kings sends:\nBen Sheppard74 (2)\nKelly Olynyk 76 (7)\n150 OVR\n9 badges\n\nRaptors Sends:\n\nKyle Lowry 75 OVR (8)\nDay'Ron Sharpe\n74 OVR(7)\n149 OVR\n15 badges";

const playerPattern = /([A-Za-z\s\.'-]+?)(\d+)\s*\((\d+)\)/g;
const sections = description.split(/[A-Za-z\s]+\s+sends?:/i);

console.log('Team 1 Section:', sections[1]);
console.log('\nMatches:');
let match;
while ((match = playerPattern.exec(sections[1])) !== null) {
  console.log(`  Player: "${match[1].trim()}" OVR: ${match[2]} Salary: ${match[3]}`);
}
