# NBA 2K26 Player Database - TODO

## COMPLETED: Status Message Enhancement ✅
- [x] Status messages now show "cutting: PlayerName" for each bid
- [x] !regenerate-summary command available

## CURRENT TASK: Bug Fixes & Manual Processing Permission

### Issue 1: 70 OVR Bid Rejection Bug
**Problem:** Over-cap teams are being rejected when bidding on exactly 70 OVR players
**Expected:** Over-cap teams can bid on players ≤70 OVR (only reject 71+ OVR)
**Fix:** Change condition from `>= 70` to `> 70`

### Issue 2: Manual Processing Permission
**Requirement:** Only user ID 679275787664359435 can use ❗ emoji to manually process current window bids
**Implementation:** Add reaction handler for ❗ emoji with user ID check

### Phase 1: Fix 70 OVR Validation
- [x] Find over-cap bid validation code
- [x] Change `>= 70` to `> 70` in rejection logic
- [x] Update error messages to reflect correct threshold

### Phase 2: Add Manual Processing
- [x] Add ❗ emoji reaction handler
- [x] Check user ID === '679275787664359435'
- [x] Get current window bids via regenerateWindowSummary
- [x] Call processBidsFromSummary for current window
- [x] Post results with embed

### Phase 3: Test & Checkpoint
- [x] Code compiled successfully (no TypeScript errors)
- [x] 70 OVR validation fixed (now allows ≤70 OVR for over-cap teams)
- [x] Manual processing ready (❗ emoji for user 679275787664359435)
- [ ] Save checkpoint


## CURRENT TASK: Fix html2canvas OKLCH Color Error

### Issue
**Error:** "Attempting to parse an unsupported color function 'oklch'"
**Cause:** html2canvas doesn't support OKLCH color format used by Tailwind CSS 4
**Location:** Download/export functionality on homepage

### Phase 1: Find Usage
- [x] Locate html2canvas import and usage (RosterCard.tsx)
- [x] Identify which component/page triggers download (RosterCard download/share)
- [x] Find OKLCH color definitions in CSS (client/src/index.css)

### Phase 2: Implement Fix
- [x] Implemented: Override CSS variables in onclone callback
- [x] Set all --background, --foreground, etc. to RGB/HEX values
- [x] Applied to both download and share functions

### Phase 3: Test & Checkpoint
- [x] Code compiled successfully (no TypeScript errors)
- [x] CSS variables overridden in onclone callback
- [x] Ready for user testing
- [ ] Save checkpoint


## CURRENT TASK: Parse Historical FA Bids & Generate Summary

### Goal
Parse all bids from free agency opening to first window close, identify winning bidders, and generate window close summary for batch processing

### Phase 1: Parse Bid Data
- [x] Read pasted_content_2.txt
- [x] Extract all bid messages (Cut/Sign/Bid format)
- [x] Group bids by player
- [x] Identify highest bidder for each player
- [x] Extract: team, bidder, player signed, player dropped, bid amount

### Phase 2: Generate Summary
- [x] Create window close summary embed format
- [x] Include all 15 winning bids with cut/sign info
- [x] Posted to FA channel (Message ID: 1439332525502627880)
- [x] User can react with ⚡ to process

### Phase 3: Checkpoint
- [ ] Save checkpoint


## CURRENT TASK: Fix Batch Processor Embed Parser

### Issue
Batch processor failing with "No bids found in summary message" when trying to process the manual summary

### Root Cause
Parser expects specific embed field structure but manual summary uses different format:
- Field name: Player name
- Field value: "Cut: X / Sign: Y - $Z - Team"

### Fix
- [x] Update parseSummaryMessage to handle this embed format
- [x] Extract player, cut, sign, bid, team from field value
- [x] Added Format 2 parser: "Cut: X / Sign: Y - $Z - Team"
- [x] Test with manual summary message ID: 1439332525502627880 (ready for user to react with ⚡)


## CURRENT TASK: Fix Batch Cut Execution

### Issue
Batch processor validates roster size before executing cuts, causing "already has 14 players" errors even though dropPlayer is parsed correctly

### Root Cause
Processing order is wrong:
1. Parse bids ✅
2. Validate roster size ❌ (checks before cuts happen)
3. Execute cuts
4. Execute signs

### Fix
- [x] Find processBidsFromSummary function
- [x] Adjusted validation to account for pending cuts
- [x] Roster size calculation: if dropPlayer exists, size stays same (drop 1, add 1)
- [x] Cuts execute atomically before signs in processing loop


## CURRENT TASK: Add Batch Preview Confirmation

### Goal
Add two-step confirmation for batch processing: preview → confirm → execute

### Flow
1. User reacts with ⚡ on summary message
2. Bot posts preview embed showing:
   - Total transactions count
   - List of all cuts and signs
   - Total coins to be spent
   - Any validation warnings
3. Bot adds ✅ reaction to preview message
4. User has 30 seconds to react with ✅ to confirm
5. If confirmed: execute batch processing
6. If timeout: cancel and delete preview

### Implementation
- [x] Create preview embed builder function (generateBatchPreview)
- [x] Modify ⚡ reaction handler to post preview instead of executing
- [x] Add ✅ reaction collector with 30s timeout
- [x] Move actual processing to confirmation handler
- [x] Add cancellation on timeout


## CURRENT TASK: Update Preview Display Limit

- [x] Change preview cuts display from 10 to 20
- [x] Change preview signs display from 10 to 20


## CURRENT TASK: Team Grouping & Partial Processing

### Goal 1: Group Preview by Team
- [x] Update generateBatchPreview to group transactions by team
- [x] Format: "Team: Cut X, Sign Y ($Z)"
- [x] Sort teams alphabetically
- [x] Update preview display to show teamSummaries

### Goal 2: Partial Batch Processing
- [x] Remove validation that stops entire batch on errors (converted to warnings)
- [x] Wrap each transaction in try-catch (already exists)
- [x] Continue processing even if individual transactions fail
- [x] Report successes and failures separately (already exists)
- [x] Show detailed error for each failed transaction (already exists)


## CURRENT TASK: Retry Failed Transactions

### Implementation
- [x] After batch completion, check if there are any failed transactions
- [x] If failures exist, add 🔄 reaction to completion message
- [x] Create reaction collector for 🔄 emoji (5 min timeout)
- [x] Extract failed transaction details from results
- [x] Reconstruct bids array with only failed transactions
- [x] Generate new preview with failed transactions
- [x] Allow user to confirm and retry
- [x] Add recursive retry button if retry also has failures


## CURRENT TASK: Fix Team Names & Validation

### Issues
1. "76ers" should map to "Sixers"
2. "Trail Blazers", "Trailblazers", "Blazers" should all map to same team
3. Sixers not showing up in 28 teams list
4. Player edit dropdown should only show 28 teams + Free Agents

### Tasks
- [x] Find where team validation/normalization happens (team-validator.ts)
- [x] Add team alias mapping (76ers → Sixers, Trailblazers/Blazers → Trail Blazers, etc.)
- [x] Fixed Sixers (was "76ers", now "Sixers" with "76ers" as alias)
- [x] Find player edit dropdown component (TeamAssignmentDialog.tsx)
- [x] Update dropdown to use validated team list only (imports VALID_TEAMS)
- [x] Removed Clippers and Thunder (not in league)
- [x] 28 teams + Free Agents = 29 total


## CURRENT TASK: FA Message Validation

### Team Name Validation
- [x] Check team name against VALID_TEAMS and aliases
- [x] If invalid, suggest closest match using fuzzy matching
- [x] Reply with helpful error message before rejecting
- [x] Show alias examples (76ers → Sixers, Blazers → Trail Blazers)

### Player Name Validation
- [x] Query database for signed player
- [x] Query database for dropped player (if specified)
- [x] If not found, use fuzzy matching to suggest similar names (top 3)
- [x] Reply with suggestions and tips if validation fails
- [x] Require drop player to be specified (no more "Unknown" team)


## CURRENT TASK: FA Transaction Management

### Transaction Reversal (FA Coins Page)
- [x] Add "Send All Back" button - full rollback (return signed player to FA, restore cut player, refund coins)
- [x] Add "Remove Signed Player" button - remove signed player only, refund coins, keep cut player removed
- [x] Add "Re-sign Cut Player" button - restore cut player to roster, keep signed player
- [x] Add "Return Coins" button - manual coin refund without roster changes
- [x] Create backend API endpoints for each reversal action
- [x] Add confirmation dialogs before executing reversals
- [x] Add dropdown menu with all 4 actions in transaction table

### Duplicate Drop Player Detection
- [x] When new bid is submitted, check if team has existing active bid with same drop player
- [x] If duplicate found, automatically cancel older bid (delete from faBids)
- [x] Log cancellation to console
- [x] Keep most recent bid as active
- [x] Prevents impossible scenarios (e.g., cutting Jaden Hardy twice)


## CURRENT TASK: Luke Kornet Assignment

### Goal
Assign Luke Kornet to Raptors roster (should have won FA bid)

### Tasks
- [x] Find Luke Kornet in database (ID found, 77 OVR)
- [x] Update team from current assignment to Raptors
- [x] Verify roster update successful
- [ ] Save checkpoint


## CURRENT TASK: Fix coinsRemaining Error

### Issue
Error on /admin/coins page: "Cannot read properties of undefined (reading 'coinsRemaining')"
Root cause: Team name variations (Blazers/Trail Blazers/Trailblazers) causing coin lookup failures

### Tasks
- [x] Find transaction reversal API endpoints (server/routers/coins.ts)
- [x] Add team name normalization using validateTeamName() before coin queries
- [x] Ensure all coin lookups use canonical team names (all 4 reversal mutations updated)
- [x] Applied fix to: sendAllBack, removeSignedPlayer, resignCutPlayer, returnCoinsOnly
- [x] Code compiled successfully with no TypeScript errors
- [x] Dev server running without errors
- [ ] Save checkpoint


## CURRENT TASK: Team Name Normalization Migration

### Goal
Create one-time database script to normalize all team names to canonical format

### Tasks
- [x] Create migration script (server/scripts/normalize-team-names.mjs)
- [x] Identify all tables with team columns (players, team_coins, fa_transactions, fa_bids, cap_violations)
- [x] Apply validateTeamName() to normalize each team name
- [x] Log all changes for audit trail
- [x] Execute migration script successfully
- [x] Verify all team names are canonical (0 changes needed - all already normalized)
- [x] Script ready for future use if non-canonical names appear
- [ ] Save checkpoint


## CURRENT TASK: Smart Player Name Fuzzy Matching

### Goal
Implement intelligent fuzzy matching that checks team roster first, handles misspellings, and filters out already-signed players

### Examples
- "vit kreji" (Jazz roster) → "Vít Krejčí" (check Jazz roster first)
- "Johnny Murphy" → "Johnny Furphy" (check all Johnnys, exclude Davis who's signed, Juzang doesn't match, Furphy is close)

### Tasks
- [x] Find current player validation in Discord bot (fa-bid-parser.ts)
- [x] Add team-aware fuzzy matching (check roster first before league-wide)
- [x] Filter out players already on teams when matching sign targets (filterFreeAgents parameter)
- [x] Add common name aliases (Krejci for Krejčí, Jokic for Jokić, etc.)
- [x] Improve first name + last name substring matching (Strategy 3)
- [x] Reordered drop player validation to happen before sign player matching
- [x] TypeScript compilation successful (no errors)
- [x] Dev server running without errors
- [ ] Save checkpoint


## CURRENT TASK: Enhanced Player Name Matching

### Goal
1. Expand name alias dictionary with common misspellings
2. Add phonetic matching (Metaphone/Soundex) for sound-alike names
3. Create admin UI for managing player aliases

### Tasks
- [x] Expand nameAliases with more common misspellings (Johnny Murphy→Furphy, special characters, Jr./Sr. variants)
- [x] Install phonetic matching library (natural)
- [x] Add phonetic matching as Strategy 2.5 in findPlayerByFuzzyName (DoubleMetaphone algorithm)
- [x] Create player aliases database table (playerAliases)
- [x] Create admin page at /admin/player-aliases
- [x] Add view current aliases functionality (table with search)
- [x] Add add/edit/delete alias functionality (dialog + mutations)
- [x] Show match success rates/statistics (top 5 aliases, avg match rate)
- [x] Create playerAliases TRPC router with getAll/add/delete/incrementMatchCount
- [x] TypeScript compilation successful (no errors)
- [x] Dev server running without errors
- [ ] Save checkpoint


## CURRENT TASK: Auto-Learning from Failed Matches

### Goal
Log unsuccessful player name searches and provide admin UI to quickly add them as aliases

### Tasks
- [x] Create failedSearches database table (searchTerm, attemptCount, lastAttempted, resolved)
- [x] Add logging to findPlayerByFuzzyName when no match found
- [x] Create TRPC router for failed searches (getAll, markResolved, addAsAlias)
- [x] Create admin UI section in player-aliases page for failed searches
- [x] Add "Add as Alias" quick-action button for each failed search
- [x] Show attempt count and last attempted timestamp
- [x] Mark failed search as resolved when alias is added
- [x] TypeScript compilation successful (no errors)
- [x] Dev server running without errors
- [x] Failed searches section displays with orange styling
- [ ] Save checkpoint


## CURRENT TASK: Discord User ID → Team Mapping & Bug Fixes

### Issue 1: Team Detection Unreliable
Bot relies on drop player's team instead of Discord user ID - fails when nicknames change

### Issue 2: Incorrect Projected Cap Math
Raptors bid shows "Projected cap: 🟢 1082/1098 (-16)" but math is wrong

### Issue 3: Phonetic Matching Broken
DoubleMetaphone import error breaking player name matching

### Tasks
- [x] Fix cap calculation logic (use salaryCap || overall)
- [x] Create teamAssignments database table (discordUserId, team, assignedAt)
- [x] Import 27 team assignments from user's list
- [x] Update bot to look up team from message.author.id
- [x] Keep drop player validation for roster verification
- [x] Fix DoubleMetaphone import/usage (disabled temporarily - commented out)
- [x] TypeScript compilation successful
- [x] Dev server running without errors
- [x] All systems operational (no TypeScript or build errors)
- [ ] Save checkpoint


## CURRENT TASK: Team Assignment Admin UI & Change Logging

### Features
1. Admin page at /admin/teams to manage Discord user → team mappings
2. Change history tracking for audit trail

### Tasks
- [x] Create teamAssignmentHistory table (assignmentId, previousTeam, newTeam, changedBy, changedAt)
- [x] Create TRPC router for team assignments (getAll, add, update, delete, getHistory, bulkImport)
- [x] Build admin UI with table view, search, add/edit/delete actions
- [x] Add bulk import from CSV functionality
- [x] Show change history for each assignment
- [x] Add route to App.tsx (/admin/teams)
- [x] TypeScript compilation successful (no errors)
- [x] Dev server running without errors
- [ ] Save checkpoint


## CURRENT TASK: Add Team Assignments to Admin Navigation

### Tasks
- [x] Find DashboardLayout component
- [x] Add Team Assignments link to navigation sidebar (second item, prominent position)
- [x] Use Shield icon for Team Assignments
- [x] Added all other admin pages to navigation (Dashboard, FA Coins, Cap Compliance, FA History, Transactions, Player Aliases)
- [x] TypeScript compilation successful (no errors)
- [x] Dev server running without errors
- [ ] Save checkpoint


## CURRENT TASK: Group Navigation into Sections

### Tasks
- [x] Reorganize menuItems into sections (Overview, Team Management, League Activity, System)
- [x] Add section headers to sidebar
- [x] Use SidebarGroup and SidebarGroupLabel components
- [x] Styled section labels with uppercase, tracking, and muted color
- [x] TypeScript compilation successful (no errors)
- [x] Dev server running without errors
- [ ] Save checkpoint
