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
