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
