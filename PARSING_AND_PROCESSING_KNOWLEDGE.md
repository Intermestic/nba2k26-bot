# NBA 2K26 Bot - Parsing, Processing & Fuzzy Matching Knowledge Base

This document preserves all the hard-earned parsing logic, processing rules, and fuzzy matching strategies that have been developed through extensive testing and refinement. This is the institutional knowledge needed to rebuild the bot with the same capabilities.

---

## Table of Contents

1. [Trade Parsing](#trade-parsing)
2. [FA Bid Parsing](#fa-bid-parsing)
3. [Player Name Matching & Fuzzy Logic](#player-name-matching--fuzzy-logic)
4. [Transaction Processing](#transaction-processing)
5. [Error Handling & Fallbacks](#error-handling--fallbacks)
6. [Learned Aliases System](#learned-aliases-system)
7. [Team Management](#team-management)

---

## Trade Parsing

### Overview
Trade parsing handles Discord messages containing trade proposals with the format:
```
**Team1 Sends:**
Player Name OVR (salary)
...

**Team2 Sends:**
Player Name OVR (salary)
...
```

### Key Features

#### 1. **Team Detection**
- Uses word boundary matching to find NBA team names
- Supports both full names and aliases:
  - `76ers` / `Sixers`
  - `Cavaliers` / `Cavs`
  - `Mavericks` / `Mavs`
  - `Timberwolves` / `Wolves`
  - `Trail Blazers` / `Blazers`
- Handles mention format: `@Team(nickname)` (e.g., `@Pacers(Steph and browski)`)
- Teams are found in order of appearance in the message

#### 2. **Player List Parsing**
Handles multiple formats:
- `Player Name 81 (10)` - Basic format
- `Player Name 81 (10 badges)` - With badges notation
- `Player Name: 81 (10)` - With colon
- `• Player Name 81 (10)` - With bullet points
- `- Player Name 81 (10)` - With dashes

Regex pattern:
```regex
^([A-Za-z\s\-'\.\.]+?)\s*:?\s*(\d+)\s*\(?\s*(\d+)\s*(?:badges)?\)?$
```

#### 3. **Format Detection**
The parser uses regex patterns to match "Team Send(s):" format:
```regex
(?:@?\*{0,2}TEAM(?:\([^)]*\))?\s+sends?\*{0,2}\s*:|\*{0,2}TEAM\s+sends?\*{0,2}\s*:)\s*([^]*?)(?=@?\*{0,2}NEXT_TEAM|$)
```

Key aspects:
- Handles optional asterisks (markdown bold)
- Matches both "send" and "sends"
- Handles @mention format with optional nickname in parentheses
- Case-insensitive matching

#### 4. **Fallback Strategies**
If pattern matching fails:
1. Try alternative format without "Sends:" - parse all players and split between teams
2. Try database lookup by message ID - retrieve cached trade data
3. Return null if all strategies fail

#### 5. **Edge Cases Handled**
- Partial messages (fetches full message if needed)
- Messages with embeds instead of content
- Embed fields and titles as fallback sources
- Discord mentions and markdown formatting (filtered out)
- Total lines and separator lines (skipped)
- Special characters in player names (apostrophes, hyphens, periods)

### Implementation File
- **Primary**: `/server/simple-trade-parser.ts`
- **Tests**: `/server/__tests__/simple-trade-parser.test.ts`
- **Backup**: `/server/trade-parser.ts` (older implementation)

---

## FA Bid Parsing

### Overview
FA (Free Agent) bid parsing handles messages like:
```
Cut: Player1
Sign: Player2
Bid: 100
```

Or variations:
```
Drop Player1, Add Player2 50
```

### Key Features

#### 1. **Bid Message Detection**
A message is considered a valid bid if it contains:
- **Acquisition keywords**: `sign`, `add`, `pickup`
- **Value indicators**: `bid`, `coins`, `$`, or any number
- **Optional cut/drop**: `cut`, `drop`, `waive`

#### 2. **Parsing Steps**

**Step A: Identify Cut Player (Optional)**
```regex
\b(cut|drop|waive)\s*:?\s*(.+?)(?:\s+(?:sign|add|pickup))
```
- Matches everything after cut/drop/waive until sign/add/pickup
- Handles optional colons

**Step B: Identify Signed Player (Required)**
```regex
\b(sign|add|pickup)\s*:?\s*(.+?)(?:\s+(?:bid|\d+)|\n|$)
```
- Matches everything after sign/add/pickup
- Stops at bid keyword, number, newline, or end

**Step C: Identify Bid Amount**
1. First, look for explicit "Bid X" pattern:
   ```regex
   \bbid\s*[:\s]*(\d+)
   ```
2. If not found, look for standalone number at end of line:
   ```regex
   (\d+)\s*$
   ```
3. Default to 1 if no bid amount found

#### 3. **Output Format**
```typescript
interface ParsedBid {
  playerName: string;      // Player to sign
  bidAmount: number;       // Bid amount (default: 1)
  dropPlayer?: string;     // Optional player to cut
}
```

### Implementation File
- **Primary**: `/server/fa-bid-parser.ts`

---

## Player Name Matching & Fuzzy Logic

### Overview
The system uses multi-strategy fuzzy matching to find players despite misspellings, nicknames, and special characters.

### Key Features

#### 1. **Name Normalization**
Normalizes names by:
- Converting to lowercase
- Removing diacritics (é → e, ñ → n, etc.) using Unicode NFD
- Removing apostrophes and hyphens
- Normalizing Jr/Jr. variations
- Collapsing whitespace

Examples:
```
"Nikola Jokić" → "nikola jokic"
"D'Angelo Russell" → "dangelo russell"
"Karl-Anthony Towns" → "karlanthony towns"
"José Alvarado" → "jose alvarado"
```

#### 2. **Matching Strategies (In Order)**

**Strategy 0: Learned Aliases (FIRST)**
- Checks database of previously learned aliases
- Prevents creating wrong aliases when filtering for free agents
- Example: User typed "obi topping" before, system learned it → "Jacob Toppin"

**Strategy 1: Name Aliases (Exact Match)**
Hardcoded aliases for:
- Special characters: `Vit Krejci`, `Nikola Jokić`, `Luka Dončić`, etc.
- Common misspellings: `Kyle Filipowski` (vs "Flipowski"), `Johnny Furphy` (vs "Murphy")
- Compound names: `DeMar DeRozan`, `DeAndre Jordan`, etc.

**Strategy 2: Nicknames**
Hardcoded nickname mappings:
```
"cp3" → "Chris Paul"
"lebron" → "LeBron James"
"greek freak" → "Giannis Antetokounmpo"
"joker" → "Nikola Jokic"
"sga" → "Shai Gilgeous-Alexander"
"kat" → "Karl-Anthony Towns"
... and many more
```

**Strategy 3: Fuzzy Matching (Fuzzball)**
- Uses fuzzball library for fuzzy string matching
- Threshold: 75% similarity
- Filters by team context if provided
- Handles free agent filtering

**Strategy 4: Team Context Matching**
- If team context provided, prioritizes players on that team
- Useful for trades (searches team roster first)

**Strategy 5: Partial Name Matching**
- Matches on last name if full name fails
- Example: "Randle" matches "Julius Randle"

#### 3. **Free Agent Filtering**
When `filterFreeAgents=true`:
- Only returns players with `team === null` or `team === 'Free Agent'`
- Prevents matching non-free agents when signing players
- Important: Learned aliases are checked BEFORE filtering to avoid wrong matches

#### 4. **Learned Aliases System**
The system learns from successful matches:
- Stores `(alias, canonicalName, context, useCount)`
- Example: User types "obi topping" → system learns it maps to "Jacob Toppin"
- Next time user types "obi topping", it's found immediately
- Prevents repeated fuzzy matching for common misspellings

### Implementation Files
- **Name Normalization**: `/server/name-normalizer.ts`
- **Fuzzy Matching**: `/server/fa-bid-parser.ts` (contains `findPlayerByFuzzyName`)
- **Tests**: `/server/__tests__/name-normalizer.test.ts`

### Fuzzy Matching Thresholds
- **Excellent match**: 90%+ similarity
- **Good match**: 75-90% similarity
- **Poor match**: <75% (rejected)

---

## Transaction Processing

### Overview
Processes both FA transactions and trades with validation, coin management, and team roster updates.

### FA Transaction Processing

#### 1. **Validation Steps**
1. Check if dropped player exists on team
2. Check if signed player is free agent
3. Check if team has enough coins
4. Validate salary cap constraints

#### 2. **Transaction Steps**
1. Deduct coins from team
2. Update dropped player's team to "Free Agent"
3. Update signed player's team to acquiring team
4. Record transaction in database
5. Update Discord with confirmation

#### 3. **Graceful Degradation**
If database is unavailable:
- Enter degradation mode
- Queue transaction with status "pending"
- Automatically retry when database recovers
- Maintains queue state in memory

#### 4. **Error Handling**
- Database errors trigger degradation mode
- Validation errors return specific error messages
- Network errors are retried with exponential backoff

### Trade Processing

#### 1. **Validation Steps**
1. Parse trade from message
2. Find all players involved
3. Validate all players exist
4. Check salary cap impact for each team
5. Verify trade doesn't violate league rules

#### 2. **Transaction Steps**
1. Update each player's team
2. Update salary cap totals
3. Record trade in database
4. Generate trade story/summary
5. Update Discord with confirmation

#### 3. **Auto-Processing**
Trades auto-process when:
- 7 or more 👍 votes received
- 5 or more 👎 votes received (rejected)
- Scans every 30 seconds for new votes

### Implementation Files
- **FA Processing**: `/server/fa-transaction-processor.ts`
- **Trade Processing**: `/server/trade-voting.ts`
- **Graceful Degradation**: `/server/graceful-degradation.ts`

---

## Error Handling & Fallbacks

### Database Connection Errors
1. **Immediate**: Queue transaction
2. **Enter degradation mode**: Accept queued transactions
3. **Monitor recovery**: Check connection every 5 seconds
4. **Auto-retry**: Process queued transactions when DB recovers

### Parsing Errors
1. **Trade parsing fails**: Try alternative formats
2. **Player not found**: Return fuzzy match candidates
3. **Bid parsing fails**: Reject message with explanation
4. **Message fetch fails**: Use cached data if available

### Player Matching Errors
1. **Exact match fails**: Try fuzzy matching
2. **Fuzzy match fails**: Try nickname lookup
3. **Nickname fails**: Try last name matching
4. **All fail**: Return null with suggestions

### Discord API Errors
1. **Message fetch fails**: Use partial message data
2. **Embed parsing fails**: Try message content
3. **Reaction handling fails**: Log and continue
4. **Send message fails**: Retry with exponential backoff

---

## Learned Aliases System

### Purpose
Learn from user inputs to improve future matching without requiring exact names.

### Data Structure
```typescript
interface LearnedAlias {
  id: string;
  alias: string;           // What user typed (normalized)
  canonicalName: string;   // What player was actually found
  context: string;         // Where learned (fa_bid, trade, etc)
  useCount: number;        // How many times used
  createdAt: Date;
  lastUsedAt: Date;
}
```

### Learning Process
1. User types player name
2. Fuzzy matching finds correct player
3. System records the mapping
4. Next time user types same name, it's found immediately

### Example
```
User types: "obi topping"
System finds: "Jacob Toppin" (78% match)
Learns: "obi topping" → "Jacob Toppin" (context: fa_bid)

Next time user types "obi topping":
System finds immediately without fuzzy matching
```

### Implementation
- **Storage**: `learnedAliases` table in database
- **Lookup**: Checked first in `findPlayerByFuzzyName()`
- **Recording**: Happens after successful match

---

## Team Management

### Team Data
- **30 NBA Teams**: Kings, Magic, Pacers, Rockets, Knicks, Bucks, Hawks, Wizards, Trail Blazers, Sixers, Lakers, Raptors, Bulls, Pistons, Pelicans, Hornets, Mavs, Grizzlies, Spurs, Warriors, Suns, Cavaliers, Jazz, Nuggets, Timberwolves, Celtics, Nets, Heat, Hornets
- **Free Agents**: Players with `team === null` or `team === 'Free Agent'`

### Team Aliases
```
76ers → Sixers
Cavaliers → Cavs
Mavericks → Mavs
Timberwolves → Wolves
Trail Blazers → Blazers
```

### Team Coin Management
- Each team has a coin balance
- Coins spent on FA signings
- Coins reset at season start
- Overcap alerts when team exceeds salary cap

### Overcap Role Management
- Teams exceeding salary cap get "Overcap" Discord role
- Role automatically added/removed based on salary cap
- Checked on bot startup and after each transaction

---

## Key Lessons Learned

### What Works
1. **Multi-strategy matching**: Trying multiple strategies catches edge cases
2. **Learned aliases**: Remembering user inputs dramatically improves UX
3. **Graceful degradation**: Queuing transactions during DB downtime prevents data loss
4. **Regex patterns with word boundaries**: Prevents false matches in player names
5. **Embed fallbacks**: Using embed fields/titles when description missing
6. **Team context**: Searching team roster first improves accuracy

### What Doesn't Work
1. **Single fuzzy match threshold**: Different names need different thresholds
2. **Exact matching only**: Users make typos, need fuzzy fallback
3. **No nickname support**: Many players known by nicknames
4. **Immediate failure on DB error**: Queue and retry instead
5. **Case-sensitive matching**: Always normalize to lowercase

### Common Pitfalls
1. **Checking learned aliases AFTER free agent filter**: Creates wrong aliases
2. **Not fetching partial messages**: Embeds might be incomplete
3. **Hardcoding team names**: Need aliases for common variations
4. **No fallback for trade parsing**: Some Discord formats aren't standard
5. **Not logging fuzzy match scores**: Hard to debug why matches fail

---

## Testing Strategy

### Unit Tests
- Trade parser: 6+ test cases covering all formats
- Name normalizer: Tests for diacritics, punctuation, special cases
- Fuzzy matching: Tests for nicknames, misspellings, edge cases
- FA bid parser: Tests for all bid formats and edge cases

### Integration Tests
- Full trade flow: Parse → Validate → Process → Confirm
- Full FA flow: Parse → Match → Validate → Process → Confirm
- Degradation mode: DB down → Queue → DB up → Auto-retry

### Manual Testing
- Test with real Discord messages
- Test with user-provided examples
- Test edge cases and unusual formats
- Monitor logs for unexpected behavior

---

## Deployment Checklist

When rebuilding the bot:

- [ ] Implement name normalization (diacritics, punctuation)
- [ ] Set up learned aliases table in database
- [ ] Implement trade parser with all format variations
- [ ] Implement FA bid parser with all format variations
- [ ] Set up fuzzy matching with fuzzball library
- [ ] Implement player matching with multi-strategy approach
- [ ] Add team alias mappings
- [ ] Implement transaction processing with validation
- [ ] Add graceful degradation for DB errors
- [ ] Set up trade voting system
- [ ] Add team coin management
- [ ] Implement overcap role management
- [ ] Add comprehensive logging
- [ ] Write unit tests for all parsers
- [ ] Write integration tests for full flows
- [ ] Test with real Discord messages
- [ ] Monitor for edge cases and unusual formats

---

## Questions & Improvements

### Possible Enhancements
1. Machine learning for player name matching
2. Caching of fuzzy match results
3. User-defined aliases (let users create custom mappings)
4. Multi-language support for international players
5. Automatic nickname detection from Discord
6. Real-time validation feedback as user types

### Known Limitations
1. Fuzzy matching is slow for large datasets (1000+ players)
2. No support for player name variations (e.g., "LeBron" vs "Bron")
3. Learned aliases not shared across contexts
4. No conflict detection for similar player names
5. Trade parsing assumes specific Discord format

---

## References

### Key Files
- Trade Parsing: `server/simple-trade-parser.ts`
- FA Bid Parsing: `server/fa-bid-parser.ts`
- Name Normalization: `server/name-normalizer.ts`
- Transaction Processing: `server/fa-transaction-processor.ts`
- Trade Voting: `server/trade-voting.ts`
- Graceful Degradation: `server/graceful-degradation.ts`

### Dependencies
- `fuzzball`: Fuzzy string matching
- `discord.js`: Discord API client
- `drizzle-orm`: Database ORM
- `drizzle-kit`: Database migrations

### External Resources
- Discord.js Documentation: https://discord.js.org/
- Fuzzball Documentation: https://github.com/nk2028/fuzzball.js
- Unicode Normalization: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize

