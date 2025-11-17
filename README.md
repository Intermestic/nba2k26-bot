# NBA 2K26 Player Database

A comprehensive database system for managing NBA 2K26 player data, free agent bidding, and Discord bot integration.

## Features

- **Player Database**: Complete player roster with stats, ratings, and team assignments
- **Free Agent Bidding System**: Automated bid parsing and processing from Discord messages
- **Fuzzy Name Matching**: Advanced player name matching with typo tolerance and nickname support
- **Discord Bot Integration**: Real-time bid monitoring and processing
- **Trade Management**: Player trade tracking and validation
- **Bid Window Management**: Automated bidding period control

## Testing

The project includes comprehensive test suites to ensure reliability and prevent regressions.

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/__tests__/fa-bid-parser.test.ts
pnpm test server/__tests__/fuzzy-name-matching.test.ts

# Run tests in watch mode
pnpm test --watch
```

### Test Suites

#### 1. FA Bid Parser Tests (`fa-bid-parser.test.ts`)

Tests the free agent bid message parsing logic with comprehensive edge case coverage.

**Coverage:**
- Valid bid formats (with/without "bid" keyword)
- Player names containing acquisition keywords (Saddiq, Addison, Signor)
- Cut/drop/waive transactions
- Bid amount extraction (explicit and standalone numbers)
- Error scenarios (missing player, invalid format)
- Special cases (multiple spaces, case variations, punctuation)

**Example test cases:**
```typescript
// Valid bids
"Sign LeBron James bid 100" → { playerName: "LeBron James", bidAmount: 100 }
"Add Stephen Curry 50" → { playerName: "Stephen Curry", bidAmount: 50 }

// Edge cases with special names
"Sign Saddiq Bey 25" → { playerName: "Saddiq Bey", bidAmount: 25 }
"Add Addison Patterson" → { playerName: "Addison Patterson", bidAmount: 1 }

// Cut transactions
"Cut Player A sign Player B" → { playerName: "Player B", dropPlayer: "Player A" }
```

#### 2. Fuzzy Name Matching Tests (`fuzzy-name-matching.test.ts`)

Tests the advanced fuzzy name matching system that handles typos, nicknames, and team context.

**Matching Strategies (in order):**

1. **Name Aliases** (Exact match on predefined aliases)
   - Special characters: `vit krejci` → `Vit Krejci`
   - Jr/Sr variations: `gary trent` → `Gary Trent Jr`
   - Common misspellings: `johnny murphy` → `Johnny Furphy`
   - Hyphenated names: `karl anthony towns` → `Karl-Anthony Towns`

2. **Team-Aware Matching** (60% threshold for roster matches)
   - Prioritizes players on the specified team roster
   - Lower threshold (60%) vs league-wide (70%)
   - Helps resolve ambiguous names

3. **First+Last Name Matching** (For common first names)
   - Matches first name exactly, fuzzy matches last name
   - Useful for names like "Johnny Murphy" → "Johnny Furphy"

4. **League-Wide Fuzzy Matching** (70% threshold)
   - Fallback strategy using Levenshtein distance
   - Handles typos: `lebron jams` → `LeBron James`
   - Partial names: `antetokounmpo` → `Giannis Antetokounmpo`

**Nickname Support:**

The system recognizes common NBA nicknames:
- `cp3` → `Chris Paul`
- `ad` → `Anthony Davis`
- `kat` → `Karl-Anthony Towns`
- `sga` → `Shai Gilgeous-Alexander`
- `greek freak` → `Giannis Antetokounmpo`
- `dame` → `Damian Lillard`
- `joker` → `Nikola Jokić`
- And many more...

**Free Agent Filtering:**

When `filterFreeAgents=true`, only returns players without team assignments (for FA bid targets).

**Test Coverage:**
- ✅ 53 tests covering all matching strategies
- ✅ Special character handling (diacritics)
- ✅ Jr/Sr suffix variations
- ✅ Nickname resolution
- ✅ Team context prioritization
- ✅ Typo tolerance (70% threshold)
- ✅ Free agent filtering
- ✅ Edge cases (empty strings, whitespace, case sensitivity)
- ✅ Return value structure validation

**Example test cases:**
```typescript
// Alias matching
findPlayerByFuzzyName('jokic') → { name: 'Nikola Jokić', ... }
findPlayerByFuzzyName('sengun') → { name: 'Alperen Şengün', ... }

// Nickname matching
findPlayerByFuzzyName('cp3') → { name: 'Chris Paul', ... }
findPlayerByFuzzyName('greek freak') → { name: 'Giannis Antetokounmpo', ... }

// Team-aware matching
findPlayerByFuzzyName('lebron jame', 'Lakers') → { name: 'LeBron James', team: 'Lakers', ... }

// Typo handling
findPlayerByFuzzyName('stephen cury') → { name: 'Stephen Curry', ... }
findPlayerByFuzzyName('kevin durent') → { name: 'Kevin Durant', ... }

// Free agent filtering
findPlayerByFuzzyName('player name', undefined, true) → Only returns if player is FA
```

## Development

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Push database schema
pnpm db:push

# Run development server
pnpm dev
```

### Database Management

```bash
# Generate migration
pnpm db:generate

# Push schema changes
pnpm db:push

# Open database studio
pnpm db:studio
```

## Architecture

### Fuzzy Name Matching System

The fuzzy name matching system (`findPlayerByFuzzyName`) is a critical component that enables robust player identification despite typos, nicknames, and name variations.

**Function Signature:**
```typescript
async function findPlayerByFuzzyName(
  name: string,              // Player name to search for
  teamContext?: string,      // Optional team to prioritize roster matches
  filterFreeAgents?: boolean, // If true, only return free agents
  context: string = 'fa_bid' // Context for logging
): Promise<{
  id: string;
  name: string;
  team: string;
  overall: number;
  salaryCap?: number | null;
} | null>
```

**Matching Thresholds:**
- Team-aware matching: **60%** similarity (lower threshold for roster context)
- League-wide fuzzy matching: **70%** similarity (higher threshold for accuracy)
- First+last name matching: **60%** on last name (when first name matches exactly)

**Auto-Learning:**
Failed searches are logged to help identify missing aliases and improve matching over time.

### FA Bid Parser

The FA bid parser (`parseBidMessage`) extracts structured data from natural language Discord messages.

**Function Signature:**
```typescript
function parseBidMessage(message: string): ParsedBid | null

interface ParsedBid {
  playerName: string;
  bidAmount: number;
  dropPlayer?: string; // Optional for cut transactions
}
```

**Detection Logic:**
1. Checks for acquisition keywords: `sign`, `add`, `pickup`
2. Checks for value keywords: `bid`, `coin`, `$`
3. Must have at least one acquisition OR value keyword
4. Extracts cut player (optional): `cut/drop/waive <player>`
5. Extracts signed player (required): `sign/add/pickup <player>`
6. Extracts bid amount: `bid <amount>` or standalone number at end

**Regex Patterns:**
- Acquisition keywords: `/\b(sign|add|pickup)\b/i`
- Value keywords: `/\b(bid|coins?|\$)\b/i`
- Cut pattern: `/\b(cut|drop|waive)\s+(.+?)(?:\s+(?:sign|add|pickup))/i`
- Sign pattern: `/\b(sign|add|pickup)\s+(.+?)(?:\s+(?:bid|\d+)|$)/i`
- Bid amount: `/\bbid\s*[:\s]*(\d+)/i` or `/(\d+)\s*$/`

## Contributing

When adding new features or fixing bugs:

1. Write tests first (TDD approach)
2. Ensure all tests pass: `pnpm test`
3. Update documentation
4. Create a checkpoint: Use the webdev tools to save your changes

## License

MIT
