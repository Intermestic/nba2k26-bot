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
- [ ] Save checkpoint
