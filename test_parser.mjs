// Test the bid parser
const message = "Cut Cole swider\nSign Jae Crowder\nBid 1";

function parseBidMessage(message) {
  const text = message.trim().toLowerCase();
  
  // Check for acquisition keywords
  const hasAcquisition = /\b(sign|add|pickup)\b/i.test(text);
  
  // Check for value keywords OR standalone numbers
  const hasValue = /\b(bid|coins?|\$)\b/i.test(text);
  const hasNumber = /\d+/.test(text);
  
  // Must have at least one acquisition OR (value keyword OR number)
  if (!hasAcquisition && !hasValue && !hasNumber) {
    return null;
  }
  
  // Step A: Identify cut player (optional)
  let dropPlayer;
  const cutPattern = /\b(cut|drop|waive)\s*:?\s*(.+?)(?:\s+(?:sign|add|pickup))/i;
  const cutMatch = message.match(cutPattern);
  if (cutMatch) {
    dropPlayer = cutMatch[2].trim();
  }
  
  // Step B: Identify signed player (required)
  const signPattern = /\b(sign|add|pickup)\s*:?\s*(.+?)(?:\s+(?:bid|\d+)|\n|$)/i;
  const signMatch = message.match(signPattern);
  
  if (!signMatch) {
    return null;
  }
  
  let playerName = signMatch[2].trim();
  
  // Step C: Identify bid amount
  let bidAmount = 1;
  
  const bidKeywordPattern = /\bbid\s*[:\s]*(\d+)/i;
  const bidKeywordMatch = message.match(bidKeywordPattern);
  
  if (bidKeywordMatch) {
    bidAmount = parseInt(bidKeywordMatch[1]);
  } else {
    const standaloneNumberPattern = /(\d+)\s*$/;
    const standaloneMatch = message.match(standaloneNumberPattern);
    
    if (standaloneMatch) {
      bidAmount = parseInt(standaloneMatch[1]);
    }
  }
  
  return {
    playerName: playerName.trim(),
    bidAmount,
    dropPlayer
  };
}

const result = parseBidMessage(message);
console.log('Test message:', message);
console.log('Parsed result:', JSON.stringify(result, null, 2));
