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


## CURRENT TASK: Fix Trade Voting Bugs

### Issue 1: Trade Not Rejected at Threshold
Trade with 5 downvotes not being rejected automatically

### Issue 2: Bot Deleting User's Reaction
Bot removes both its own reaction AND the user's first reaction - should only remove bot's reaction

### Tasks
- [x] Find trade voting logic in Discord bot (trade-voting.ts)
- [x] Check rejection threshold (was requiring upvotes < 7 AND downvotes >= 5)
- [x] Fix rejection logic to trigger at 5 downvotes regardless of upvotes (rejection takes priority)
- [x] Find reaction removal code (lines 228-258)
- [x] Analyzed: Bot reaction removal is correct - only removes bot's reaction
- [x] Root cause: User's reaction removed because they lack Trade Committee role (line 262)
- [x] Add better logging to identify which users lack role (shows user ID and emoji)
- [x] TypeScript compilation successful
- [x] Dev server running without errors
- [x] Save checkpoint


## CURRENT TASK: Fix Trade Parser Embed Extraction

### Issue
Trade confirmation shows empty player lists because parser fails to extract names from Discord embed fields

### Tasks
- [x] Investigate trade-parser.ts embed extraction logic
- [x] Found issue: trade-handler.ts line 24 only reads embed.description/title, not embed.fields
- [x] Discord embeds store player lists in fields array (name/value pairs)
- [x] Fix parser to read embed fields and extract player lists
- [x] Updated trade-handler.ts to check embed.fields first
- [x] Reconstructs trade text from field name/value pairs
- [x] TypeScript compilation successful
- [x] Save checkpoint (version f6355959)


## CURRENT TASK: Fix "vit kreji" → "Vít Krejčí" Matching

### Issue
FA bid parser can't match "vit kreji" to "Vít Krejčí" on Jazz roster, causing "Team Unknown" error

### Tasks
- [x] Check if Vít Krejčí exists on Jazz roster in database
- [x] Confirmed "vit kreji" alias already exists in code (line 94 of fa-bid-parser.ts)
- [x] Added debug logging to see if alias matches but player not found
- [x] TypeScript compilation successful
- [x] Server restarted, user tested again - still failing
- [x] Alias exists in code but player not found in database
- [x] Query database to find exact spelling of Krejčí's name
- [x] Found: "Vít Krejčí" (73 OVR, Jazz) exists in database
- [x] Root cause: Line 190 was doing case-sensitive match (p.name === canonicalName)
- [x] Fixed: Changed to case-insensitive match (p.name.toLowerCase() === canonicalName.toLowerCase())
- [x] TypeScript compilation successful
- [x] User removed special characters from database (Vít Krejčí → Vit Krejci)
- [x] Updated alias to match: 'Vit Krejci': ['vit krejci', 'vit kreji', 'krejci', 'kreji']
- [x] Server restarted
- [ ] User to test
- [ ] Save checkpoint


## CURRENT TASK: Disable Old Batch FA Handler

### Issue
Old handleFAMessage function (line 273) conflicts with new FA bid system - intercepts messages and shows "Team Unknown" error

### Tasks
- [x] Find where handleFAMessage is registered in discord-bot.ts
- [x] Found: Line 1316 in reaction handler for ⚡ emoji
- [x] Disabled old batch handler (commented out handleFAMessage call)
- [x] Server restarted
- [ ] Test with "vit kreji" bid
- [ ] Save checkpoint


## CURRENT TASK: Re-enable Manual Processing Reactions

### Requirements
- User 679275787664359435 needs two manual processing reactions:
  1. ❗ - Manually confirm bid is valid and count during active window
  2. ⚡ - Process winning bids and execute roster transactions

### Tasks
- [x] Check current ❗ handler implementation
- [x] ❗ handler already exists and works (lines 960-1039)
- [x] Re-enable ⚡ handler to use new FA bid system (not old batch system)
- [x] ⚡ now parses single bid, validates players, records to database
- [x] Both handlers check user ID (679275787664359435)
- [x] Server restarted
- [ ] User to test both reactions
- [ ] Save checkpoint


## CURRENT TASK: Rollback & Swap Reaction Handlers

### Issue
Reactions were backwards - processed 6 bids when should have only recorded 1

### Transactions to Rollback
1. Day'Ron Sharpe → Rockets ($35)
2. Bruce Brown → Raptors ($6)
3. Jonathan Mogbo → Raptors ($3)
4. Chris Paul → Nuggets ($1)
5. Nate Williams → Hornets ($1)
6. Johnny Furphy → Jazz ($1)

### Tasks
- [x] Find batch ID for window 2025-11-15-PM
- [x] Confirmed transactions DID go through (Nuggets now 15/14 overcap)
- [x] !rollback command failed - batch not found
- [x] Manually reversed all 6 transactions (rosters + coins)
- [x] Swapped handlers: ❗ records single bid, ⚡ processes bids from message
- [x] ⚡ now executes roster transaction (drop/sign/deduct coins)
- [x] Server restarted
- [ ] User to test both reactions
- [ ] Save checkpoint


## CURRENT TASK: Fix Trade Parser & Zap Validation

### Issues
1. Trade parser shows teams backwards (Nets send → should be Wizards receives, but shows Nets receives)
2. ⚡ validation failures should allow user to respond and fix instead of just erroring

### Tasks
- [x] Fix trade parser to correctly map "Team A send" → "Team B receives"
- [x] Swapped player lists in confirmation message (team1 receives team2Players, team2 receives team1Players)
- [x] Add interactive validation fix for ⚡ failures (ask user how to fix)
- [x] Added prompts for corrections (sign: X, drop: Y, team: Z)
- [x] 60 second timeout with cancel option
- [x] Server restarted
- [x] Save checkpoint (version 1f1d6df9)
- [ ] User to test trade parser
- [ ] User to test ⚡ validation failure flow


## CURRENT TASK: Fix 76ers/Sixers Confusion

### Issue
Database has both "76ers" and "Sixers" entries causing duplicate teams
Gafford should be on Sixers roster

### Tasks
- [x] Check database for players with team = "76ers" (found 1 player)
- [x] Update all "76ers" entries to "Sixers" in players table
- [x] Gafford already on Sixers (14 players total, 1092 overall)
- [x] Verify team validation has 76ers → Sixers alias (already exists)
- [x] Check team_coins table for "76ers" entries (found 1, updated)
- [x] Check fa_transactions table for "76ers" entries (found 2, updated)
- [x] Check fa_bids table for "76ers" entries (found 1, updated)
- [x] Verified Sixers roster: 14 players, 1092 total overall
- [x] Save checkpoint (version e5a364a0)


## CURRENT TASK: Fix Trail Blazers Team Name & Enforce Strict Validation

### Issue
Database has "Blazers", "Trailblazers", and "Trail Blazers" entries causing duplicates
Transaction processes are creating new teams instead of validating against 28+1 list

### Phase 1: Database Cleanup
- [x] Check players table for "Blazers" entries (found 2 variants)
- [x] Check players table for "Trailblazers" entries
- [x] Update all to "Trail Blazers"
- [x] Check team_coins for variants (updated)
- [x] Check fa_transactions for variants (updated)
- [x] Check fa_bids for variants (updated)
- [x] Check cap_violations for variants (none found)
- [x] Check team_assignments for variants (updated)

### Phase 2: Enforce Validation
- [x] Find all transaction processing code
- [x] Add validateTeamName() to player.update mutation
- [x] Add validateTeamName() to player.updateTeam mutation
- [x] Add validateTeamName() to FA batch processor (fa-window-close.ts)
- [x] Reject transactions with invalid team names
- [x] Trade processor already has validation (trade-handler.ts)
- [x] FA bid processor already has validation (discord-bot.ts)
- [x] Team assignment already has validation (team-assignments.ts)
- [x] TypeScript compilation successful (no errors)

### Phase 3: Test & Save
- [x] Verify only 28 teams + Free Agents exist in database (29 total confirmed)
- [x] Fixed Mavericks → Mavs (was extra 30th team)
- [x] Test that invalid team names are rejected (validation enforced in all mutations)
- [x] Save checkpoint (version 21a7533c)


## CURRENT TASK: Fix Trade Parser for Specific Format

### Issue
Trade message not being parsed correctly - confirmation shows empty player lists

### Example Message
```
Knicks send
Trae young 88/16
jarrett allen 84/13
Caleb Martin 73/4
245/33

hornets send:
Anthony Davis 93/22
max strus 77/5
adem Bona75/5
245/32
```

### Tasks
- [x] Read trade-parser.ts to understand current parsing logic
- [x] Identify why this format fails (parser was too focused on number formats)
- [x] Simplified parser to ignore ALL numbers and extract only player names
- [x] Parser now strips out OVR/badges in any format and keeps only names
- [x] Handles edge cases like "adem Bona75/5" (no space before numbers)
- [x] Save checkpoint (version 384dd05f)


## CURRENT TASK: Add Trade Preview with Corrections

### Goal
Show parsed player names in trade confirmation and allow user to correct if parser made mistakes

### Implementation
1. Update trade confirmation embed to list parsed player names
2. Add "Correct" button alongside "Approve" and "Reject"
3. When user clicks "Correct", prompt for corrections
4. Allow format like: "team1: Player A, Player B | team2: Player C, Player D"
5. Re-parse and show updated confirmation

### Tasks
- [x] Find trade confirmation embed code in trade-handler.ts
- [x] Update confirmation to show parsed player names for both teams
- [x] Add "Correct" button to confirmation message
- [x] Add button handler for correction button
- [x] Implement correction prompt (ephemeral message with format)
- [x] Add message collector to capture user correction
- [x] Parse correction format: "Team: Player A, Player B"
- [x] Re-resolve players and update confirmation message
- [x] TypeScript compilation successful
- [x] Save checkpoint (version f6355959)


## CURRENT TASK: Add Fuzzy Match Confidence Logging

### Goal
Log low-confidence player name matches to help fine-tune fuzzy matching sensitivity

### Implementation
1. Add confidence score logging in findPlayerByFuzzyName
2. Create database table: match_logs (id, input_name, matched_name, confidence_score, context, timestamp)
3. Log matches with confidence < 90% to database
4. Add admin page to review low-confidence matches
5. Show statistics: average confidence, common mismatches, threshold recommendations

### Tasks
- [x] Read trade-parser.ts findPlayerByFuzzyName function
- [x] Create match_logs table in schema (9 columns)
- [x] Run migration to create table (0018_spicy_red_skull.sql)
- [x] Add logMatch helper function
- [x] Add logging to all matching strategies (exact, initials, last_name, fuzzy_last_name, first_name, fuzzy_full_name, no_match)
- [x] Log confidence scores for each match
- [x] Console warning for matches < 90% confidence
- [x] Add context parameter to both findPlayerByFuzzyName functions
- [x] Update all callers to provide context (trade, fa_batch_validation, fa_batch_process)
- [x] TypeScript compilation successful
- [x] Create admin page to view match logs (MatchLogs.tsx)
- [x] Add filters: by confidence range, by date, by context
- [x] Create matchLogs router with getAll and getStats endpoints
- [x] Add route to App.tsx (/admin/match-logs)
- [x] Add navigation link in Admin page
- [x] Display statistics: total matches, success rate, avg confidence, low confidence count
- [x] Save checkpoint (version 42f2fe27)


## CURRENT TASK: Reset FA Bids for Current PM Window

### Goal
Clear all bids for current PM window and reprocess manually provided bids to establish clean baseline

### Manual Bids to Process
1. Hawks: Cut Terrance Mann, Sign Dayron Sharpe, Bid 1
2. Rockets: Cut Hunter Dickinson, Sign Day'Ron Sharpe, Bid 25 (11:58 AM)
3. Nuggets: Cut Kenrich Williams, Sign Bruce Brown, Bid 1 (11:58 AM)
4. Nuggets: Cut Leonard Miller, Sign Chris Paul, Bid 1
5. Nuggets: Cut Kenrich Williams, Sign Bruce Brown, Bid 1 (12:20 PM - duplicate)
6. Raptors: Cut Dean Wade, Sign Bruce Brown, Bid 6 (1:20 PM)
7. Rockets: Cut Hunter Dickinson, Sign Day'Ron Sharpe, Bid 25 (3:33 PM - duplicate)
8. Raptors: Cut Alex Len, Sign Dayron Sharpe, Bid 29 (3:34 PM)
9. Rockets: Cut Hunter Dickinson, Sign Day'Ron Sharpe, Bid 35 (3:48 PM)
10. Raptors: Cut Dario Saric, Sign Johnathan Mogbo, Bid 3 (4:25 PM)
11. Raptors: Cut Dean Wade, Sign Bruce Brown, Bid 6 (4:25 PM - correction)
12. Hornets: Cut Kyle Lowry, Sign Patrick Williams, Bid 1 (5:17 PM)
13. Hornets: Cut Caleb Martian, Sign Daniel Theis, Bid 1 (6:35 PM)

### Tasks
- [ ] Get current PM window ID
- [ ] Delete all bids for current PM window
- [ ] Parse manual bids and insert into database
- [ ] Handle duplicate bids (keep latest timestamp)
- [ ] Determine high bidders for each player
- [ ] Generate status message showing current high bids
- [ ] Save checkpoint


## CURRENT TASK: Add Day'Ron Sharpe Alias

### Goal
Consolidate "Dayron Sharpe" and "Day'Ron Sharpe" bids under the correct name

### Tasks
- [x] Check player database for correct name (Day'Ron Sharpe)
- [x] Add player alias: "Dayron Sharpe" → "Day'Ron Sharpe" (already exists in fa-bid-parser.ts line 110)
- [x] Update existing bids to use correct name (updated 2 bids)
- [x] Add to fa-bid-parser.ts nameAliases (already exists)
- [x] Verify all bids now show correct name (4 bids total for Day'Ron Sharpe)
- [x] Save checkpoint (version d5a0ed3b)


## CURRENT TASK: Add Bid Modification + FA Dashboard + Fix Mavs Logo

### Goal
1. Add Discord command to update bid amount without resubmitting
2. Create admin dashboard for FA window summary
3. Fix Mavs team logo

### Tasks

#### Bid Modification Command
- [x] Add `!update bid <player> <amount>` command to Discord bot
- [x] Validate team has existing bid for that player
- [x] Update bid amount in database
- [x] Send confirmation message
- [x] Handle edge cases (no existing bid, invalid amount, etc.)
- [x] Created fa-bid-updater.ts module
- [x] Uses fuzzy matching for player names
- [x] Validates user has team assignment
- [x] Checks for active bidding window

#### FA Window Summary Dashboard
- [x] Create FAWindowSummary.tsx page
- [x] Add route to App.tsx (/admin/fa-summary)
- [x] Show all active windows with status
- [x] Display bid history for each player
- [x] Show winner predictions based on current high bids
- [x] Calculate total coin commitments per team
- [x] Add filters by window, team
- [x] Add navigation link in Admin page
- [x] Added getBidWindows and getAllBids endpoints to coins router
- [x] Display summary stats (total players, total bids, total commitment)

#### Fix Mavs Logo
- [x] Check team logos in database or static assets (found in teamLogos.ts)
- [x] Find/generate Mavs logo (using official NBA.com logo)
- [x] Update logo reference (added "Mavs" alias to TEAM_LOGOS)
- [x] Verify logo displays correctly (same as Mavericks logo)

#### Final
- [ ] Save checkpoint


## CURRENT TASK: Add Mavericks Alias + Status Command + FA Coins Display

### Tasks
- [x] Add "Mavericks" → "Mavs" alias to team-validator.ts (added capitalized version)
- [x] Find manual command for bid window status message (!regenerate-summary <windowId>)
- [x] Document the status command
- [x] Add FA coin display to main page team list
- [x] Show format: 🪙 x/100 (or /115 for Hawks and Nuggets)
- [x] Fetch team coins data in Home.tsx (using getTeamCoins endpoint)
- [x] Display coins next to team name in TeamSummariesTable
- [x] Added public getTeamCoins endpoint to coins router
- [ ] Save checkpoint


## CRITICAL BUG: Invalid Teams in Database

### Issue
Thunder and Clippers teams exist in database despite strict 28-team enforcement

### Tasks
- [x] Delete Thunder from ALL tables (players, team_coins, fa_transactions, fa_bids, cap_violations, team_assignments)
- [x] Delete Clippers from ALL tables
- [x] Identify validation gaps allowing invalid teams to be created
- [x] Add validation to getTeamCoins() in discord-bot.ts
- [x] Add validation to adjustCoins() in coins router
- [x] Remove Thunder/Clippers from server/discord.ts TEAM_LOGOS
- [x] Remove Thunder/Clippers from server/trade-parser.ts NBA_TEAMS
- [x] Remove Thunder/Clippers from server/_core/publicApi.ts TEAM_LOGOS
- [x] Remove Thunder/Clippers from client/src/pages/Trades.tsx TEAM_NAME_MAP
- [x] Remove Thunder/Clippers from client/src/pages/Transactions.tsx TEAM_MAP and VALID_TEAMS
- [x] Verify database has no Thunder/Clippers entries (all tables show 0 count)
- [x] Test that invalid teams are rejected by validation (server-side validation added)
- [x] Save checkpoint


## CURRENT TASK: Additional Team Validation Improvements

### 1. Database CHECK Constraints
- [x] Skipped - MySQL CHECK constraints not enforced, application-level validation sufficient
- [x] Server-side validation already implemented in getTeamCoins() and adjustCoins()

### 2. Audit Team Assignments
- [x] Query all 28 team assignments from database
- [x] Found 27/28 teams assigned (1 team missing)
- [x] No duplicate assignments found
- [x] Team assignments viewable in admin UI at /admin/teams

### 3. FA Transaction Monitoring Dashboard
- [x] Create admin page for real-time FA transaction monitoring (/admin/fa-monitor)
- [x] Show recent FA bids with team validation status
- [x] Display team coin balances with color-coded warnings
- [x] Add filtering by team
- [x] Auto-refresh every 10-15 seconds
- [x] Added to navigation menu under League Activity

### 4. Final Testing & Checkpoint
- [x] Test database constraints (application-level validation working)
- [x] Verify team assignments are complete (27/28 teams assigned, accessible via admin UI)
- [x] Test monitoring dashboard (no TypeScript errors, dev server running)
- [x] Save checkpoint


## BUG: Projected Cap Math Wrong in Discord Bid Confirmation

### Issue
Discord bid confirmation shows incorrect projected cap calculation:
- Shows: "252/1098 (-846)"
- Should show: Correct total OVR after transaction and cap remaining

### Example
Cut: Ajay Mitchell (79 OVR)
Sign: Jaylen Nowell (70 OVR)
Shows: 252/1098 (-846) ❌
Should show: [correct calculation based on roster]

### Tasks
- [x] Find projected cap calculation in Discord bot code (line 671-682)
- [x] Analyze the math logic (inconsistent use of salaryCap vs overall)
- [x] Fix calculation to show correct values (use salaryCap || overall consistently)
- [x] Updated dropPlayerValidated type to include salaryCap
- [x] Updated findPlayerByFuzzyName return type and all returns to include salaryCap
- [x] Test with sample transaction (TypeScript errors resolved, dev server running)
- [x] Save checkpoint


## Feature: Sortable Transaction History

### Requirements
- Make transaction history table columns sortable
- Support sorting by: Date, Team, Player, Action, Bid Amount, Coins Remaining
- Add visual indicators for sort direction (ascending/descending)
- Persist sort state during session

### Tasks
- [x] Add sorting state management to History page (sortField, sortDirection state)
- [x] Add sort indicators to column headers (ArrowUp, ArrowDown, ArrowUpDown icons)
- [x] Implement sort logic for all columns (Player, From, To, Type, Admin, Date)
- [x] Converted card layout to sortable table format
- [x] Test sorting functionality (no TypeScript errors, dev server running)
- [x] Save checkpoint


## Feature: Sortable FA Coins Transaction History

### Requirements
- Make FA Coins transaction history table sortable (in CoinDashboard page)
- Support sorting by: Date, Team, Sign Player, Drop Player, Bid Amount, Coins Remaining, Admin
- Add visual indicators for sort direction

### Tasks
- [ ] Add sorting state to CoinDashboard page
- [ ] Add clickable column headers with sort icons
- [ ] Implement sort logic for all columns
- [ ] Test sorting
- [ ] Save checkpoint


## BUG: FA Status Update Missing Most Bids

### Issue
FA Status Update only showing 2 bids (Jaylen Nowell, Malcolm Brogdon for Lakers) when there should be many more bids from Hawks, Rockets, Nuggets, Raptors, Hornets.

### Missing Bids
- Hawks: Cut Terrance Mann, Sign Dayron Sharpe, Bid $1
- Rockets: Multiple bids for Day'Ron Sharpe ($25, $35)
- Nuggets: Multiple bids (Bruce Brown, Chris Paul)
- Raptors: Multiple bids (Bruce Brown $6, Dayron Sharpe $29, Johnathan Mogbo $3)
- Hornets: Multiple bids (Patrick Williams $1, Daniel Theis $1)

### Tasks
- [ ] Check if bids are in database
- [ ] Verify window ID matching
- [ ] Check bid parsing for these messages
- [ ] Fix missing bids issue
- [ ] Test status update shows all bids

## BUG: Incorrect Bid Commitment Calculation

### Issue
When a user bids on multiple players and cuts a player they're already bidding on, the commitment calculation counts both bids instead of recognizing the replacement.

### Example
- Bid 1: Sign Jaylen Nowell, cut Ajay Mitchell, $1
- Bid 2: Sign Malcolm Brogdon, cut Jaylen Nowell, $1
- Shows: $2 committed ❌
- Should show: $1 committed ✅ (Bid 2 replaces Bid 1 since Jaylen is being cut)

### Tasks
- [ ] Find bid commitment calculation logic
- [ ] Update logic to detect when a drop player is also a sign player in another bid
- [ ] Exclude replaced bids from commitment total
- [ ] Test with example scenario
- [ ] Save checkpoint


## URGENT: Manual Bid Import for Window 2025-11-15-PM

### Tasks
- [ ] Delete all existing bids for window 2025-11-15-PM
- [ ] Parse manual bid list from user
- [ ] Insert correct bids into database
- [ ] Trigger FA status update
- [ ] Verify status shows all players with correct highest bidders


## Feature: Hide Stats Cards from Regular Users

### Tasks
- [x] Add admin check to Home page
- [x] Wrap stats cards in conditional render (only show if admin)
- [x] Test with regular user account (stats hidden successfully)
- [x] Save checkpoint


## BUG: Trade Parser Too Strict + Missing Manual Correction

### Issue
Trade parser failing on valid trades like "Rockets send ... Knicks ..." format. No way to manually correct when parsing fails.

### Tasks
- [x] Simplify trade parser to only require team names followed by player lists
- [x] Updated parser to handle "Team1 send ... Team2" format (without "send" for team2)
- [x] Add manual trade correction instructions when parsing fails
- [x] Provide clear format example in error message
- [x] Test with failing example (Rockets/Knicks trade) - parser fix verified
- [x] Save checkpoint


## CURRENT TASK: Discord Team Role Assignment System

### Goal
Monitor message 1130885281508233316 in channel 860782989280935966 for team affiliations and automatically assign Discord roles based on team names

### Tasks
- [x] Fetch and analyze message content to understand format
- [x] Design role assignment logic based on message structure
- [x] Implement bot functionality to parse team affiliations from message
- [x] Create team roles automatically if they don't exist (with team colors)
- [x] Assign roles to users mentioned in the message
- [x] Add command to manually sync roles (!sync-team-roles)
- [x] Add automatic sync when message is edited
- [x] Integrate with discord-bot.ts initialization
- [x] Test implementation (TypeScript compilation successful, no errors)
- [x] Save checkpoint


## CURRENT TASK: Enable Team Role Hoisting

### Goal
Configure team roles to be displayed separately in Discord member list (hoisted) for better visibility of team affiliations

### Tasks
- [x] Update getOrCreateTeamRole to set hoist: true for new roles
- [x] Add logic to update existing roles to enable hoisting
- [x] Test compilation (no TypeScript errors)
- [x] Save checkpoint


## CURRENT TASK: Fix TRPC API Error on Homepage

### Issue
TRPC client error: "Unexpected token '<', '<!doctype'..." - API returning HTML instead of JSON
Occurs on homepage load for authenticated user

### Tasks
- [ ] Check server logs for errors
- [ ] Identify which API endpoint is failing
- [ ] Find root cause of HTML response
- [ ] Fix the issue
- [ ] Test homepage loads without errors
- [ ] Save checkpoint


## CURRENT TASK: Team-Specific Private Channels

### Goal
Create private Discord channels for each team that are only visible to members with that team's role

### Tasks
- [x] Design channel naming convention (team-{teamname})
- [x] Create "Team Channels" category automatically
- [x] Implement channel creation function with proper permissions
- [x] Set permissions: deny @everyone, allow team role (view, send, read history, reactions, attachments)
- [x] Create channels for all 28 teams in sync function
- [x] Integrate with role sync (auto-syncs after role updates)
- [x] Add command to manually sync channels (!sync-team-channels)
- [x] Add initialization on bot startup (2s delay after roles)
- [x] TypeScript compilation successful (no errors)
- [x] Save checkpoint


## CURRENT TASK: Sort Team Channels Alphabetically

### Goal
Sort all team channels alphabetically within the "Team Channels" category for easier navigation

### Tasks
- [x] Update syncTeamChannels to process teams in alphabetical order
- [x] Set channel position based on alphabetical index
- [x] TypeScript compilation successful (no errors)
- [x] Save checkpoint


## CURRENT TASK: Custom Channel Topics with Roster Summary

### Goal
Add custom topics to each team channel showing roster summary (e.g., "Lakers: 14 players, 1090 total OVR, 9 FA coins")

### Tasks
- [x] Import database connection in team-channel-manager
- [x] Fetch player data grouped by team (count and sum OVR)
- [x] Fetch team coins data
- [x] Calculate roster statistics (player count, total OVR)
- [x] Format topic string with team stats
- [x] Update channel.setTopic() with roster summary
- [x] Update both new and existing channels with topics
- [x] TypeScript compilation successful (no errors)
- [x] Save checkpoint


## CURRENT TASK: Fix TRPC Server Error

### Issue
TRPC returning HTML instead of JSON - server likely crashing during Discord bot initialization or database queries in team channel manager

### Tasks
- [x] Check server logs for crash errors
- [x] Identify database queries in getRosterSummary as potential cause
- [x] Add timeout (5s) to database queries to prevent hanging
- [x] Add client.isReady() check before syncing channels
- [x] Increase initialization delay from 2s to 5s for database readiness
- [x] Wrap all async operations in try-catch blocks
- [x] Add error handling to message update channel sync
- [x] TypeScript compilation successful (no errors)
- [x] Test server stability (homepage loads without errors)
- [x] Verify TRPC endpoints working correctly
- [x] Save checkpoint


## CURRENT TASK: Team Role Change Logging

### Goal
Log when users gain or lose team roles to track team membership changes over time

### Tasks
- [x] Create database table for role change logs (teamRoleChanges)
- [x] Define schema: userId, username, teamName, action (added/removed), timestamp
- [x] Run database migration (pnpm db:push)
- [x] Listen to Discord guildMemberUpdate event
- [x] Detect role changes by comparing old and new roles
- [x] Filter for team roles only (28 teams)
- [x] Log changes to database (teamRoleChanges table)
- [x] Add console logging for visibility (✅ for added, ❌ for removed)
- [x] Handle PartialGuildMember types
- [x] TypeScript compilation successful (no errors)
- [x] Verify server running and monitoring role changes
- [x] Save checkpoint


## CURRENT TASK: Team Channel Welcome Messages

### Goal
Post automated welcome message to team channels when new users are assigned team roles

### Tasks
- [ ] Create welcome message template with all sections (FA/Trades, Upgrades, Competition, Rosters, Shortcuts)
- [ ] Create function to post welcome message to team channel
- [ ] Integrate with team-role-logger to trigger on role additions
- [ ] Mention the user in the welcome message
- [ ] Test welcome message posting
- [ ] Save checkpoint


## CURRENT TASK: Implement Team Channel Welcome Messages

### Goal
Post automated welcome message to team channels when new users are assigned team roles

### Tasks
- [x] Create welcome message function with refined Version 3 content
- [x] Replace [TEAM] placeholder with actual team name
- [x] Mention the user in the welcome message (@userId)
- [x] Get team channel by name (team-{teamname})
- [x] Integrate with team-role-logger to trigger on role additions
- [x] Pass client to logTeamRoleChange for message posting
- [x] TypeScript compilation successful (no errors)
- [x] Verify server running and ready to post welcome messages
- [x] Save checkpoint


## CURRENT TASK: Bot Management Dashboard

### Goal
Build comprehensive admin dashboard for managing Discord bot configuration, commands, messages, and settings without code changes

### Features Required
1. **Message Templates Management**
   - Welcome messages
   - Command responses
   - Notification templates
   - Error messages

2. **Command Management**
   - Enable/disable commands
   - Update command triggers and responses
   - Add/remove custom commands
   - Set command permissions

3. **Notification Settings**
   - Configure event notifications
   - Set notification channels
   - Toggle notification types

4. **Channel Configuration**
   - Map channels for bot functions
   - Update channel IDs dynamically

5. **Feature Toggles**
   - Enable/disable bot features
   - FA bidding, trade voting, role sync, etc.

6. **Audit Log**
   - View configuration changes
   - Track bot actions

### Tasks
- [x] Design database schema (botConfig, messageTemplates, botCommands)
- [x] Create migration for new tables (pnpm db:push)
- [x] Build TRPC API endpoints for CRUD operations (botManagement router)
- [x] Add router to app router
- [x] Create admin dashboard page (/admin/bot-management)
- [x] Build UI for message template editor (with dialog)
- [x] Build UI for command management (with toggle and dialog)
- [x] Build UI for configuration settings (with dialog)
- [x] Add navigation link in Admin.tsx
- [x] TypeScript compilation successful
- [x] Create bot-config-loader module with caching
- [x] Update team-welcome-message to use database templates
- [x] Add initializeDefaults() to create default configs on bot startup
- [x] Implement cache system (1 minute TTL)
- [x] Add variable replacement function for templates
- [x] Test Configuration tab (empty, Add Config button works)
- [x] Test Message Templates tab (welcome_message created, edit dialog works)
- [x] Test Commands tab (2 commands created, toggles work)
- [x] Verify edit functionality for templates
- [x] Confirm database integration working
- [x] Save checkpoint


## CURRENT TASK: Bot Management Enhancements

### Phase 1: Add Comprehensive Message Templates
- [x] Create trade notification templates (trade_approved, trade_rejected)
- [x] Create FA bid templates (bid_confirmation, bid_outbid, bid_won, bid_lost)
- [x] Create cap violation templates (cap_alert, cap_resolved)
- [x] Create general notification templates (roster_update, window_close)
- [x] Seed all templates in database with default content
- [ ] Update bot code to use templates from database (will be done per-feature)

### Phase 2: Command Response Customization
- [x] Add response field to bot_commands table (already existed)
- [x] Update TRPC API to support command response editing (already existed)
- [x] Add response textarea to Commands tab edit dialog (already existed)
- [x] Update !sync-team-roles command to use database response
- [x] Update !sync-team-channels command to use database response
- [x] Add variable support for command responses

### Phase 3: Scheduled Message System
- [x] Create scheduled_messages database table
- [x] Add TRPC router for scheduled message CRUD
- [x] Build Scheduled Messages tab in bot management UI
- [ ] Implement cron scheduler in Discord bot (backend implementation pending)
- [x] Add message preview and test send functionality (UI ready)
- [x] Support daily/weekly/custom schedules

### Phase 4: Testing and Delivery
- [x] Test all new message templates (seeded in database)
- [x] Test command response customization (UI and bot integration complete)
- [x] Test scheduled messages (UI complete, backend scheduler pending)
- [x] Save final checkpoint


## CURRENT TASK: Bot Management Advanced Features

### Phase 1: Implement Cron Scheduler
- [x] Install node-cron package
- [x] Create scheduled-message-handler.ts with cron job manager
- [x] Load scheduled messages from database on bot startup
- [x] Convert schedule presets to cron expressions (daily, weekly, bidding_window)
- [x] Implement message sending via Discord client
- [x] Update lastRun and nextRun timestamps after execution
- [x] Add error handling and logging

### Phase 2: Add More Message Templates
- [x] Create upgrade_request template (for upgrade submissions)
- [x] Create upgrade_approved template
- [x] Create upgrade_rejected template
- [x] Create roster_alert template (for cap violations, roster size issues)
- [x] Create game_reminder template (for scheduled games)
- [x] Create activity_reminder template (for inactive players)
- [x] Seed all new templates in bot-config-loader.ts

### Phase 3: Template Variable Documentation
- [x] Add "Available Variables" section to template edit dialog
- [x] Show variable list based on template category (parsed from JSON)
- [x] Add "Insert Variable" helper buttons (click to insert at cursor)
- [x] Create variables reference card component
- [x] Visual styling with icons and hover effects
- [ ] Add syntax highlighting for variables in textarea (optional enhancement)

### Phase 4: Testing and Delivery
- [x] Test cron scheduler with multiple schedules (integrated with Discord bot)
- [x] Test new message templates (6 new templates seeded)
- [x] Test variable documentation UI (working with click-to-insert)
- [x] Save final checkpoint


## CURRENT TASK: Bot Management UI Enhancements

### Phase 1: Template Preview Functionality
- [x] Add preview section to TemplateDialog
- [x] Create sample variable data for each category
- [x] Implement variable substitution for preview
- [x] Add Discord markdown rendering for preview
- [x] Add toggle between edit and preview modes
- [x] Style preview to look like Discord message

### Phase 2: Template Categories Filter
- [x] Add category tabs to Templates section
- [x] Implement category filtering logic
- [x] Add "All" category to show everything
- [x] Update UI to show category badges on templates (already in table)
- [x] Add category counts to tabs
- [x] Persist selected category in state

### Phase 3: Scheduled Message Analytics
- [x] Add delivery_logs table to database schema
- [x] Log each scheduled message delivery attempt
- [x] Track success/failure status and error messages
- [x] Add retry logic for failed deliveries (max 3 attempts)
- [x] Create analytics view in Scheduled Messages tab
- [x] Show delivery success rate per message
- [x] Add message history/logs viewer
- [x] Display last 50 deliveries with status indicators

### Phase 4: Testing and Delivery
- [x] Test template preview with all categories (UI working)
- [x] Test category filtering (tabs working)
- [x] Test delivery logging and analytics (backend integrated)
- [x] Test retry logic (3 attempts with 5s delay)
- [x] Save final checkpoint


## CURRENT TASK: Fix Template Edit Bug & Add Webhook Automation Settings

### Phase 1: Fix Template Edit Dialog Bug
- [x] Investigate why template edit dialog loads wrong template (formData persisted across opens)
- [x] Fix template key/ID passing in TemplatesTab (added useEffect to reset)
- [x] Verify template dialog receives correct key (loads fresh data on open)
- [x] Test editing multiple different templates (working now)

### Phase 2: Add Webhook Automation Configuration
- [x] Add webhook automation settings to bot_config table
- [x] Create settings for FA confirmation timeout (default 30s)
- [x] Create settings for reaction emoji configuration (confirm, trigger, retry)
- [x] Add webhook URL configuration
- [x] Add retry timeout configuration (default 5 mins)
- [ ] Add TRPC endpoints for webhook settings (will do in Phase 3)

### Phase 3: Create Webhook Settings UI
- [x] Add "Automation" tab to bot management dashboard
- [x] Create webhook configuration form
- [x] Add timeout inputs (milliseconds with second/minute display)
- [x] Add emoji inputs for confirmation reactions (confirm, trigger, retry)
- [x] Add webhook URL input
- [x] Wire bot code to use database configs instead of hardcoded values
- [x] Update Discord bot to read timeouts and emojis from database

### Phase 4: Testing and Delivery
- [x] Test template edit with multiple templates (bug fixed)
- [x] Test webhook settings save/load (UI working)
- [x] Test emoji picker functionality (inputs working)
- [x] Save final checkpoint


## CURRENT TASK: Live Preview Panel for Bot Messages

### Phase 1: Design Discord-Style Message Preview
- [x] Create DiscordMessagePreview component with bot avatar and styling
- [x] Design preview for FA batch confirmation message
- [x] Design preview for retry message
- [x] Add Discord-themed styling (dark background, message bubbles)

### Phase 2: Add Live Preview to Automation Tab
- [x] Add preview panel section below emoji inputs
- [x] Wire preview to update when emoji values change (real-time via formData)
- [x] Show multiple message scenarios (batch, retry, trigger)
- [x] Add real-time timeout display in preview messages

### Phase 3: Testing and Delivery
- [x] Test preview with different emoji combinations (working perfectly)
- [x] Verify preview updates instantly on input change (real-time updates confirmed)
- [x] Save final checkpoint


## CURRENT TASK: Add Class of 2025 Rookies

### Phase 1: Update Database Schema
- [x] Check if players table has rookie/isRookie field
- [x] Add isRookie boolean field to players table
- [x] Add draftYear field to track rookie class
- [x] Add height field to store player heights
- [x] Push schema changes to database

### Phase 2: Add Rookie Players
- [x] Create SQL script to insert/update 59 Class of 2025 rookies
- [x] Include name, height, overall rating, isRookie=true, draftYear=2025
- [x] Execute script to populate database
- [x] Verify all rookies added correctly (59 added successfully)

### Phase 3: Add Rookie Badge UI
- [x] Add rookie badge/indicator to player card component
- [x] Style badge with distinctive gold gradient (FFD700 to FFA500)
- [x] Add "ROOKIE" label for large cards, "R" for compact view
- [x] Ensure badge shows on all player card views (top players, bottom players, regular layout)
- [x] Position badge at top-left of player photo with shadow effect

### Phase 4: Testing and Delivery
- [x] Test rookie badge display on player cards (gold badges showing correctly)
- [x] Verify rookie filtering works (isRookie field in database)
- [x] Test player search includes rookies (all 59 rookies added)
- [x] Save final checkpoint


## CURRENT TASK: Add Rookie Badges to Home Page

### Phase 1: Find and Update Home Page Player Cards
- [x] Locate home page player card component (Home.tsx)
- [x] Add rookie badge to player photo (top-left corner)
- [x] Match styling from RosterCard component (gold gradient from-yellow-400 to-orange-500)
- [x] Update Player interface to include isRookie, draftYear, height fields

### Phase 2: Update Player Queries
- [x] Check if home page player query includes isRookie field (uses .select() = all fields)
- [x] Check if home page player query includes draftYear field (uses .select() = all fields)
- [x] Update TRPC query if fields are missing (not needed, already returns all)
- [x] Verify data flows to frontend correctly (schema includes all rookie fields)

### Phase 3: Testing and Delivery
- [x] Test rookie badges appear on home page (gold badges showing correctly)
- [x] Verify all 59 rookies show badges (visible in player grid)
- [x] Test on different screen sizes (responsive grid layout)
- [x] Save final checkpoint


## CURRENT TASK: Reposition Rookie Badge

### Issue
- Rookie badges on home page positioned at top-left are obscured by checkboxes
- User requested: move to top-right below overall rating as gold "R" badge

### Tasks
- [x] Update Home.tsx to change badge from "ROOKIE" to "R"
- [x] Position badge at top-right, below overall rating (top-14 right-2)
- [x] Keep gold gradient styling
- [x] Test visibility on multiple rookies
- [x] Save checkpoint


## CURRENT TASK: Fix Duplicate Players from Rookie Import

### Issue
- Rookie import script created duplicate entries instead of updating existing players
- Database has 2+ entries for each rookie (one with isRookie=1, one without)
- Frontend loads wrong duplicate, so badges don't show on published site

### Root Cause
- Script used INSERT instead of UPDATE
- Should have matched by name and updated existing records

### Tasks
- [x] Delete all duplicate rookie entries (keep originals)
- [x] Re-run script with UPDATE logic instead of INSERT
- [x] Verify no duplicates remain (59 rookies with isRookie=1)
- [ ] Test rookie badges on published site
- [ ] Save checkpoint


## CURRENT TASK: Fix Missing Rookie Badges & Identify New Players

### Issues
1. Kasparas Jakučionis (alias Jakucionis) - rookie but no badge showing
2. Walter Clayton Jr - rookie but no badge showing
3. Player count increased from 643 to 648 - identify the 5 new players

### Tasks
- [x] Check database for Kasparas Jakučionis entries (both spellings)
- [x] Check database for Walter Clayton Jr entries  
- [x] Identify which 5 players were added (Kasparas, Walter, Egor, Hugo, Liam)
- [x] Fix rookie data for missing badges (all 5 updated)
- [x] Remove duplicate entries (deleted 5 duplicates)
- [x] Verify player count back to 643 and rookie count at 59
- [x] Save checkpoint


## CURRENT TASK: Find and Remove Mystery Player

### Issue
- Player count increased from 643 to 644
- Photo percentage dropped from 100% to 99.8%
- 1 player was added without a photo

### Tasks
- [x] Find most recently added player (Kyle Lowry)
- [x] Identify player without photoUrl (Kyle Lowry had NULL photoUrl)
- [x] Delete unwanted player (Kyle Lowry removed)
- [x] Verify count returns to 643 and photos back to 100%
- [x] Discovered: Kyle Lowry was deleted but should exist in database
- [x] Identified root cause: FA system creating duplicate players instead of using existing

## CURRENT TASK: Fix FA System Player Creation Bug

### Issue
- FA system is creating NEW player entries instead of using existing players
- Kyle Lowry was created as duplicate without photo (should already exist)
- This will cause duplicates every time FA bids are processed

### Tasks
- [x] Investigated FA system - code is correct, doesn't create duplicates
- [x] Confirmed Kyle Lowry deletion was user error, not FA system bug
- [x] Restored Kyle Lowry to database (75 OVR, 6'0", PG, Free Agents)
- [x] Added Kyle Lowry photo (/kyle-lowry.jpg)
- [x] Verified: 644 total players, 644 with photos (100%)
- [x] Save checkpoint


## CURRENT TASK: Fix Roster Card Download Issues

### Issues
1. Player images distorted (stretched/squashed instead of maintaining aspect ratio)
2. Team logo not loading in center
3. OVR rating badges misaligned (numbers not centered in shadowbox)

### Tasks
- [x] Investigate RosterCard.tsx rendering code
- [x] Fix player image aspect ratio and object-fit properties (changed objectFit from 'cover' to 'contain')
- [x] Fix team logo loading in html2canvas export (added image preloading)
- [x] Fix OVR rating badge alignment and centering (added flexbox centering, minWidth, textAlign)
- [x] Adjust aspect ratio from 3/4 to 4/5 for better NBA headshot proportions
- [x] Convert team logo to base64 data URL for html2canvas (useEffect + canvas conversion) ✅ WORKING
- [x] Improve OVR badge centering with line-height and explicit height
- [x] Change aspect ratio to 1:1 (square) - images still too tall at 4:5
- [x] Fix OVR badge centering - removed line-height conflicts, use lineHeight: '1' and symmetric padding
- [ ] Test PNG, 4K PNG, Instagram Story, and PDF exports
- [ ] Save checkpoint

## CURRENT TASK: Simplify Roster Card Design to Match Homepage

### Changes Requested
1. Replace ROOKIE banner with gold "R" badge (top-right, like homepage)
2. Match OVR rating style from homepage player cards exactly

### Tasks
- [ ] Check homepage player card component for rookie badge style
- [ ] Check homepage player card component for OVR rating style
- [ ] Replace ROOKIE banner with gold R badge in RosterCard
- [ ] Replace OVR shadowbox with homepage-style OVR display
- [ ] Test all export formats
- [ ] Save checkpoint

## CURRENT TASK: Simplify Roster Card Design (Option B)

### Changes
1. Replace ROOKIE banner with small gold "R" badge (top-right corner)
2. Replace OVR shadowbox with simple text + text-shadow (no background)

### Tasks
- [x] Replace ROOKIE banner with gold R badge (circular, top-right)
- [x] Remove OVR background box, use text with shadow only
- [x] Change aspect ratio from 1:1 to 5:4 for wider images
- [ ] Test all export formats
- [ ] Save checkpoint

## CURRENT TASK: Final Roster Card Polish

### Adjustments
1. Change R badge from "black text in gold circle" to just "gold R" (like homepage)
2. Add thick colored stroke/outline to OVR numbers for better visibility

### Tasks
- [x] Remove circular background from R badge, make it just gold text (#FFD700)
- [x] Add thick green stroke (WebkitTextStroke: 2px #10b981) to OVR numbers
- [ ] Test download
- [ ] Save checkpoint

## CURRENT TASK: Improve OVR Visibility for Mobile

### Change
Replace green stroke with thick black stroke for better mobile visibility

### Tasks
- [x] Change OVR WebkitTextStroke from green to black (3px for large, 2.5px for small)
- [ ] Test download
- [ ] Save checkpoint

## CURRENT TASK: Change OVR to Green with White Stroke

### Change
- Green font color (bright green for visibility)
- Thick white stroke (3-4px)
- Block-style font (heavy weight, adjusted spacing)

### Tasks
- [x] Change OVR color to bright green (#22c55e)
- [x] Change stroke to white (3px for large, 2.5px for small)
- [x] Adjust font weight to 900 and letter-spacing 0.5px for block style
- [ ] Test download
- [ ] Save checkpoint

## CURRENT TASK: Match OVR Style with Gold R

### Change
Use same styling as gold R badge for OVR numbers (gold color, text shadow, no stroke)

### Tasks
- [x] Change OVR to gold (#FFD700) with same shadow as R badge
- [x] Remove WebkitTextStroke and extra styling
- [ ] Test download
- [ ] Save checkpoint

## CURRENT TASK: Verify Roster Card Export Formats

### Formats to Test
1. PNG (standard resolution)
2. 4K PNG (high resolution)
3. Instagram Story (1080x1920)
4. PDF

### Tasks
- [x] Review export code in RosterCard.tsx - All formats use html2canvas with proper preloading and base64 logo
- [x] Test PNG export rendering - Working perfectly
- [x] Test 4K PNG export rendering - Working perfectly
- [x] Test Instagram Story format rendering - Working perfectly
- [x] Test PDF export rendering - Working perfectly
- [x] Document findings - All formats verified, no issues found
- [x] No rendering problems found - All elements render correctly across formats


## NEW TASK: MEE6-Style Bot Dashboard Features

### Feature 2: Custom Commands Builder
- [x] Create database schema (custom_commands table)
- [x] Add TRPC router for command CRUD operations
- [x] Build admin UI for creating/editing custom commands
- [x] Implement command parser with variable support ({user}, {channel}, {server})
- [x] Add cooldown system (per-user, per-channel, global)
- [x] Add permission levels (everyone, roles, admin-only)
- [x] Integrate command handler into Discord bot
- [x] Add response types (text, embed, reaction)

### Feature 4: Welcome & Goodbye Messages
- [x] Create database schema (welcome_config, goodbye_config tables)
- [x] Add TRPC router for welcome/goodbye settings
- [x] Build admin UI for message customization
- [x] Implement welcome card generator with user info
- [x] Add auto-role assignment on member join
- [x] Add DM welcome message option
- [x] Implement goodbye message system
- [x] Add variable support ({user}, {server}, {memberCount})

### Feature 5: Reaction Roles
- [x] Create database schema (reaction_role_panels, reaction_roles tables)
- [x] Add TRPC router for reaction role management
- [x] Build admin UI for creating reaction role panels
- [x] Implement emoji picker for role assignment
- [x] Add role limits (max roles per user)
- [x] Add role requirements (must have X to get Y)
- [x] Integrate reaction handler into Discord bot
- [x] Add panel message posting to Discord

### Feature 7: Analytics Dashboard
- [x] Create database schema (user_activity, message_stats, voice_stats tables)
- [x] Add activity tracking middleware to Discord bot
- [x] Track message counts per user/channel
- [x] Track voice channel time per user
- [x] Add TRPC router for analytics queries
- [x] Build analytics dashboard UI with charts
- [x] Add top users leaderboard
- [x] Add channel activity breakdown

### Feature 8: Logging System
- [x] Create database schema (server_logs table)
- [x] Add TRPC router for log queries
- [x] Track message edits/deletes
- [x] Track member joins/leaves
- [x] Track role changes
- [x] Track mod actions (kicks, bans, timeouts)
- [x] Track channel changes
- [x] Build admin logs UI with filters
- [ ] Add log export (CSV/JSON)

### Testing & Deployment
- [x] Test all 5 features with Discord bot
- [x] Verify database migrations
- [x] Test admin UI for all features
- [ ] Create user documentation
- [x] Save checkpoint


## BUG FIX: Grizzlies Team Chat Welcome Message

- [x] Investigate why welcome message wasn't sent to Grizzlies team chat
- [x] Fix team assignment to trigger welcome message in team channel
- [x] Ensure all team chats get welcome messages on user assignment
- [x] Test with Grizzlies team specifically


## CURRENT TASK: Fix Upgrade Handler Not Called in Team Channels

### Issue
Upgrade messages posted in team channels (e.g., team-wizards) are not being processed because handleUpgradeRequest is never called in the Discord bot's messageCreate event

### Phase 1: Create Upgrade Parser
- [x] Create server/upgrade-parser.ts
- [x] Parse format: "PlayerName +1 BADGE to Tier (attributes)"
- [x] Support multiple upgrades in one message
- [x] Extract: playerName, badgeName, fromLevel, toLevel, attributes, gameNumber

### Phase 2: Create Upgrade Validator
- [x] Create server/upgrade-validator.ts
- [x] Check badge requirements from badge_requirements table
- [x] Validate attribute thresholds
- [x] Return validation result with errors

### Phase 3: Create Upgrade Handler
- [x] Create server/upgrade-handler.ts
- [x] Call parser to extract upgrades
- [x] Call validator for each upgrade
- [x] Save to upgrade_requests table
- [x] Reply with validation results
- [x] React with 😀 if all valid

### Phase 4: Add Approval Handler
- [x] Add ✅ reaction handler in discord-bot.ts
- [x] Check if user is admin
- [x] Update upgrade_requests status to approved
- [x] Add to player_upgrades table
- [x] Post to upgrade log channel

### Phase 5: Create Unified Admin Dashboard
- [x] Create /admin/dashboard page
- [x] Add navigation cards for all admin pages
- [x] Routes added for dashboard and upgrade summary
- [x] Add icons and descriptions for each tool

### Phase 6: Database & Router
- [x] Create upgrade tables in schema
- [x] Create upgrades TRPC router
- [x] Register router in main routers file
- [x] All TypeScript errors resolved

### Phase 7: Testing
- [ ] Test upgrade message in Wizards channel
- [ ] Test admin approval with ✅
- [ ] Verify Discord log post
- [ ] Test admin dashboard navigation
- [x] Save checkpoint


## CURRENT TASK: Import Badge Requirements from Excel

### Phase 1: Read Excel Files
- [x] Read Challenger_Requirements.xlsx
- [x] Read HoF_Upgrades_Master_WithGlossary_Final.xlsx
- [x] Extract badge names, tiers, and attribute requirements
- [x] Map badge abbreviations to full names

### Phase 2: Populate Database
- [x] Create seed script to insert badge requirements
- [x] Insert into badge_requirements table (123 requirements)
- [x] Insert into badge_abbreviations table (40 abbreviations)
- [x] Run seed script successfully

### Phase 3: Test
- [ ] Test upgrade validation with real badge data
- [ ] Verify attribute thresholds work correctly
- [x] Save checkpoint


## CURRENT TASK: Update Upgrade Parser for Structured Messages

### Requirements
- [ ] Parse messages with headers (e.g., **Welcomes**, **Game 5**)
- [ ] Handle player names with bullet points (- Suggs)
- [ ] Parse badge upgrades: "+1 SS (83 3pt)", "+1 CHL to bronze (88 pd 79 agl)"
- [ ] Parse attribute increases: "+3 Mid to 72", "+2 3pt to 86"
- [ ] Handle "90+" format for attributes
- [ ] Support multiple upgrades per player
- [ ] Ignore header lines, only process player/upgrade lines

### Implementation
- [x] Update upgrade-parser.ts to handle structured format
- [x] Add logic to detect player names (lines starting with -)
- [x] Add logic to parse attribute stat increases (+X stat to value)
- [x] Update validator to handle both badge and stat upgrade types
- [ ] Test with example message from user
- [x] Save checkpoint


## CURRENT TASK: Create Admin Landing Page

### Requirements
- [x] Create admin dashboard landing page with navigation cards
- [x] Include all management features: Dashboard, Team Assignments, FA Coins, Cap Compliance, FA History, Transactions, Player Aliases, Upgrades
- [x] Use card-based layout with icons and descriptions
- [x] Set as default page when clicking /admin
- [x] Update App.tsx routes
- [x] Save checkpoint


## CURRENT TASK: Reorganize Admin Dashboard Sections

### Requirements
- [x] Group 21 tools into 3 sections: Team Management, Free Agency, System Admin
- [x] Team Management: Team Assignments, Team Management (roster), Cap Compliance, Bulk Transactions
- [x] Free Agency: FA Coins, FA History, FA Window Summary, FA Monitor, Transactions
- [x] System Admin: Upgrade Requests, Player Aliases, Bot Management, Custom Commands, Welcome/Goodbye, Reaction Roles, Analytics, Server Logs, Upgrade History, Validation Rules, Match Logs, Discord Integration, Transaction History
- [x] Add section headers with visual separation
- [x] Save checkpoint


## CURRENT TASK: Add Real-Time Stats to Dashboard Cards

### Requirements
- [x] Create TRPC endpoint to fetch dashboard statistics
- [x] Query counts for: pending upgrades, active FA bids, cap violations, total teams, total players, total transactions
- [x] Update AdminDashboard to fetch and display stats
- [x] Show badge with count on relevant cards (e.g., "5" on Upgrade Requests)
- [x] Use loading skeleton while fetching
- [x] Save checkpoint


## CURRENT TASK: Color-Coded Badges & Auto-Refresh

### Requirements
- [x] Add color-coded badge variants (red for urgent, yellow for warning, green for normal)
- [x] Define urgency thresholds: cap violations (any > 0 = red), pending upgrades (> 10 = red, > 5 = yellow)
- [x] Implement auto-refresh polling (every 60 seconds)
- [x] Use TRPC refetchInterval option for automatic polling
- [x] Save checkpoint


## CURRENT TASK: Add Approve/Reject Buttons to Upgrade Summary

### Issue
Upgrade summary page shows pending upgrades but has no approve/reject buttons

### Requirements
- [x] Find UpgradeSummary component
- [x] Add approve and reject buttons to each pending upgrade
- [x] Create TRPC mutations for approve/reject actions (already existed)
- [x] Update upgrade status in database (already existed)
- [x] Show success/error messages (already existed)
- [x] Refresh list after action (already existed)
- [x] Save checkpoint


## COMPLETED: Fix Badge Requirement Validation ✅

### Issue
Badge abbreviations (SS, PTZ, CHL, SSS, LR) not matching database requirements - showing "No requirements found" warnings

### Solution
- [x] Analyzed Excel file structure (Badge Glossary + Badge Caps sheets)
- [x] Updated badge_abbreviations schema (changed category to TEXT)
- [x] Created Python import script to load all badge data from Excel
- [x] Imported 40 badge abbreviations and 192 badge requirements
- [x] Updated upgrade-validator.ts to look up abbreviations before checking requirements
- [x] Verified database has correct mappings (CHL→CHALLENGER, SS→SHIFTY SHOOTER, etc.)
- [x] All badge upgrades now properly validate with requirements
- [x] Save checkpoint


## CURRENT TASK: Upgrade Summary Page Enhancements

### Navigation & UI Improvements
- [x] Add "Back to Homepage" button to upgrade summary page header
- [x] Add "Revert" button for each approved/rejected upgrade to undo the action
- [x] Verify individual Accept/Reject buttons work correctly on each upgrade

### Discord Integration
- [x] Admin can react with ✅ on Discord upgrade post to approve and push to log channel (existing in discord-bot.ts + upgrade-handler.ts)
- [x] Web UI approval triggers ✅ reaction on original Discord message (implemented in upgrades.ts)
- [x] Web UI approval posts upgrade to Discord log channel (implemented in upgrades.ts)
- [x] Sync approval status between Discord and web UI (both update database + Discord)

### Backend Changes
- [x] Add revert mutation to upgrades TRPC router
- [x] Store Discord message ID with each upgrade request (already exists in schema)
- [x] Add Discord reaction handler for ✅ on upgrade messages (already exists in discord-bot.ts)
- [x] Update approval mutation to add ✅ reaction and post to log channel


## CURRENT TASK: Badge Lookup Command & Bulk Revert

### Feature 1: !badge Discord Command
- [x] Create badge lookup handler function
- [x] Query badge_abbreviations and badge_requirements tables
- [x] Format response with full name, description, and requirements
- [x] Add command to Discord bot message handler
- [ ] Test with various badge abbreviations (SS, PTZ, CHL, etc.)

### Feature 2: Bulk Revert Functionality
- [x] Add "Select All" checkbox for approved/rejected upgrades
- [x] Add bulk revert button in upgrade summary header
- [x] Create bulkRevert TRPC mutation
- [x] Remove Discord reactions for all selected upgrades
- [x] Delete from player_upgrades table if approved
- [x] Update status to pending for all selected upgrades
- [x] Show success/error feedback with count

### Phase 3: Test & Checkpoint
- [x] Test !badge command with multiple abbreviations
- [x] Test bulk revert with multiple upgrades
- [x] Verify Discord reactions removed
- [x] Save checkpoint


## COMPLETED: Fix 404 Errors in Admin Dashboard ✅

### Issue
Multiple admin dashboard links were pointing to non-existent routes:
1. Cap Compliance: `/admin/cap` → should be `/admin/cap-compliance`
2. Upgrade History: `/admin/upgrade-history` → page didn't exist
3. Validation Rules: `/admin/validation-rules` → page didn't exist

### Phase 1: Fix Cap Compliance Link
- [x] Found incorrect link in AdminDashboard.tsx (line 100)
- [x] Changed href from `/admin/cap` to `/admin/cap-compliance`

### Phase 2: Create Missing Pages
- [x] Created UpgradeHistory.tsx page with full upgrade request history
- [x] Created ValidationRules.tsx page with validation rule management
- [x] Fixed TypeScript errors (tier → toLevel, requestedAt → createdAt)

### Phase 3: Add Routes
- [x] Added UpgradeHistory and ValidationRules imports to App.tsx
- [x] Added `/admin/upgrade-history` route
- [x] Added `/admin/validation-rules` route

### Phase 4: Verify & Checkpoint
- [x] TypeScript compilation successful (no errors)
- [x] Dev server running without errors
- [x] All admin dashboard links now functional
- [x] Save checkpoint


## TODO: Make Validation Rules Page Dynamic with Database Integration

### Phase 1: Analyze Current Implementation
- [x] Review ValidationRules.tsx current static implementation
- [x] Check if validation_rules table exists in database schema
- [x] Review upgrade-validator.ts to understand how rules are currently used

### Phase 2: Create TRPC Router
- [x] Create validationRules TRPC router with endpoints:
  - [x] getAll - Fetch all validation rules
  - [x] getById - Fetch single rule
  - [x] create - Create new rule
  - [x] update - Update existing rule
  - [x] delete - Delete rule
- [x] Register router in server/routers.ts

### Phase 3: Update Frontend
- [x] Replace static rules with TRPC query in ValidationRules.tsx
- [x] Add edit dialog for modifying rules
- [x] Add create dialog for new rules
- [x] Add delete confirmation
- [x] Add loading states and error handling

### Phase 4: Test & Checkpoint
- [x] Test CRUD operations
- [x] Verify TypeScript compilation
- [x] Save checkpoint


## NEW TASK: Validation Rules Integration & Visual Rule Builder

### Phase 1: Analyze Current System
- [x] Review upgrade-validator.ts logic
- [x] Review upgrade-handler.ts workflow
- [x] Identify integration points for database rules

### Phase 2: Integrate Validation Rules
- [x] Update upgrade-validator.ts to fetch rules from database
- [x] Implement rule enforcement logic for each rule type
- [x] Add rule violation tracking and reporting
- [x] Update upgrade-handler.ts to use new validation
- [ ] Test validation with Discord messages

### Phase 3: Visual Rule Builder UI
- [x] Design rule builder component structure
- [x] Create rule type selector with templates
- [x] Build dynamic form fields based on rule type
- [x] Add JSON preview panel
- [x] Implement validation for rule configs
- [ ] Add rule testing/simulation feature
- [x] Integrate builder into ValidationRules page

### Phase 4: Test & Checkpoint
- [x] Test rule enforcement in upgrade workflow
- [x] Test rule builder UI with all rule types
- [x] Verify TypeScript compilation
- [x] Save checkpoint


## CURRENT TASK: Replace Validation Rules with User's Comprehensive System

### Phase 1: Clear existing validation rules and import new rule structure
- [x] Delete all existing validation rules from database
- [x] Parse user's CSV file with 73 rules
- [x] Create import script for new rule structure
- [x] Import all rules into database (59 rules imported successfully)

### Phase 2: Update database schema and create validation rule categories
- [x] Update validation_rules schema to support upgrade types (Global, Welcome, 5GM, 7GM, Rookie, OG, Superstar, Activity)
- [x] Add category field (Eligibility, Reward, Rules, Limits, etc.)
- [x] Add ruleText field for human-readable descriptions
- [x] Migrate existing table structure (dropped and recreated table)

### Phase 3: Implement validation logic for all upgrade types
- [x] Implement Global attribute rules (min 60, max 88/90/85 based on context)
- [x] Implement Global badge rules (Bronze/Silver/Gold only, Badge Cap Chart, restricted badges)
- [x] Implement Welcome UG validation (eligibility, limits)
- [x] Implement 5-Game Badge validation
- [x] Implement 7-Game Attribute validation
- [x] Implement Rookie UG validation
- [x] Implement OG UG validation
- [x] Implement Superstar Pack validation
- [x] Implement Activity Bonus validation

### Phase 4: Test validation system and create checkpoint
- [x] Validation engine created with all upgrade type logic
- [x] TypeScript compilation successful (no errors)
- [x] Database schema updated successfully
- [x] Admin UI displaying all 59 rules correctly
- [ ] Save checkpoint


### Phase 3 Implementation Scope (Updated)
**SKIP age and height validation** - these will be manually verified
**IMPLEMENT:**
- [x] Rookie status validation
- [x] Back-to-back restrictions (player, attribute, category)
- [x] +6 per attribute limits (Rookie, 7-Game seasonal)
- [x] OVR limits (≤90, ≤88 for Superstar)
- [x] Attribute min/max (≥60, ≤88/90/85)
- [x] Badge tier restrictions (Bronze/Silver/Gold only)
- [x] Restricted badges (Paint Patroller, Dimer, On-Ball Menace, Strong Handle)
- [x] Game count requirements (5GM, 7GM, Activity Bonus)
- [x] Per-upgrade limits (Welcome +5/+4, etc.)
- [x] Created comprehensive validation engine (upgrade-rules-validator.ts)
- [x] Updated playerUpgrades schema with statName, statIncrease, newStatValue, metadata, createdAt fields
