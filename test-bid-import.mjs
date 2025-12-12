const statusMessage = `2kleague
@everyone

📊 Active FA Bid Summary
Updated as of 12:26 PM transaction

🏆 Leading Bids
Keldon Johnson
Bid: 100 (MAX)
Leader: ⚠️ TIE between seabaschin (Spurs) & frostychild (Cavs)
Tie-breaker: Worst record at lock.

Jake Laravia
Bid: 90
Leader: sirjordan10 (Blazers)

Charles Bassey
Bid: 71
Leader: alldayballin713 (Rockets)

Luke Kornet
Bid: 61
Leader: lameloballcashed (Raptors)

Grayson Allen
Bid: 50
Leader: rickflair_ (Bulls)

Adou Thiero
Bid: 45
Leader: jayguwop.
History: Overtook cam2345 (40).

Rocco Zikarsky
Bid: 25
Leader: kuroko4 (Nuggets)

Pelle Larsson
Bid: 10
Leader: itzbreezyyy (Nets)

Jordan Clarkson
Bid: 5
Leader: itzbreezyyy (Nets)

Chris Paul
Bid: 1
Leader: kuroko4 (Nuggets)

Kobe Sanders
Bid: 1
Leader: itzbreezyyy (Nets)

Kyle Anderson
Bid: 1
Leader: lameloballcashed (Raptors)

Oso Ighodaro
Bid: 1
Leader: cam2345 (Magic)

Moses Moody
Bid: 1
Leader: kuroko4 (Nuggets)

PJ Dozier
Bid: 1
Leader: sirjordan10 (Blazers)

Drew Timme
Bid: 1
Leader: sirjordan10 (Blazers)

---

💰 Outstanding Coin Commitments
(Total coins tied up in winning bids)

100 - seabaschin (Spurs)
100 - frostychild (Cavs)
 92 - sirjordan10 (Blazers)
 71 - alldayballin713 (Rockets)
 62 - lameloballcashed (Raptors)
 50 - rickflair_ (Bulls)
 45 - jayguwop.
 27 - kuroko4 (Nuggets)
 16 - itzbreezyyy (Nets)
  1 - cam2345 (Magic)
Today at 12:33 PM`;

const lines = statusMessage.split('\n');

let currentPlayer = null;
let currentBid = null;
let found = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Check if this is a bid amount line
  const bidMatch = line.match(/^Bid:\s*(\d+)/);
  if (bidMatch && currentPlayer) {
    currentBid = parseInt(bidMatch[1]);
    console.log(`Found bid: ${currentPlayer} = $${currentBid}`);
    continue;
  }
  
  // Check if this is a leader line
  const leaderMatch = line.match(/^Leader:\s*(?:⚠️\s*TIE\s*between\s*)?([^(]+)\s*\(([^)]+)\)/);
  if (leaderMatch && currentPlayer && currentBid !== null) {
    const bidderName = leaderMatch[1].trim().split(' & ')[0];
    const team = leaderMatch[2].trim();
    
    console.log(`✅ Complete bid: ${currentPlayer} - $${currentBid} by ${bidderName} (${team})`);
    found++;
    
    // Reset
    currentPlayer = null;
    currentBid = null;
    continue;
  }
  
  // Check if this line is a player name
  if (line && 
      !line.startsWith('Bid:') && 
      !line.startsWith('Leader:') &&
      !line.startsWith('History:') &&
      !line.startsWith('Tie-breaker:') &&
      !line.includes('📊') &&
      !line.includes('🏆') &&
      !line.includes('💰') &&
      !line.includes('---') &&
      !line.includes('@everyone') &&
      !line.includes('2kleague') &&
      !line.includes('Updated as of')) {
    console.log(`Potential player name: "${line}"`);
    currentPlayer = line;
  }
}

console.log(`\nTotal bids found: ${found}`);
