# NBA 2K26 Player Database - TODO

## COMPLETED: Admin Bid Override Feature ✅

### Feature Implemented
- Admins can manually reject any FA bid directly from Discord
- React with ❌ emoji on bid confirmation message to reject
- Deletes bid from database and notifies the user

### Implementation Details
1. ✅ Added ❌ reaction to all bid confirmation messages
2. ✅ Created reaction collector with 24-hour window
3. ✅ Permission check: Administrator role or server owner
4. ✅ Deletes bid from fa_bids table when admin reacts
5. ✅ Edits confirmation message to show "BID REJECTED BY ADMIN"
6. ✅ Sends DM notification to original bidder
7. ✅ Logs admin action for audit trail
8. ✅ Non-admins cannot reject bids (silently ignored)

### Tasks Completed
- [x] Add reaction collector to bid confirmation messages
- [x] Check if reactor has admin permissions (role or owner)
- [x] Delete bid from fa_bids table when admin reacts with ❌
- [x] Send confirmation message to admin (via message edit)
- [x] Send DM notification to original bidder explaining rejection
- [x] Add logging for audit trail
- [x] Fix TypeScript imports (faBids, and)
- [x] Save checkpoint

### Usage
1. User places FA bid → bot sends confirmation message with ❌ reaction
2. Admin clicks ❌ reaction on the confirmation message
3. Bot verifies admin permissions
4. Bot deletes bid from database
5. Bot edits message to show rejection + admin name
6. Bot sends DM to bidder explaining rejection
7. Reaction collector stops

---

## COMPLETED: Fix FA Bid Cap Calculation Bug ✅

### Issue Fixed
- Jazz at 1098 cap, cutting KPJ (76), signing Ayo (77) = 1099 (OVER CAP)
- Bot was showing "Projected cap: 🟢 242/1098 (-856)" - WRONG!
- Root cause: Code was using `salaryCap` field (169) instead of `overall` field (1098)

### Solution Applied
1. ✅ Fixed cap calculation to use ONLY `overall` field (removed salaryCap)
2. ✅ Added hard-coded validation: reject if projectedTotal > 1098
3. ✅ Added clear error message explaining cap violation
4. ✅ Tested: Jazz scenario correctly calculates 1099 and will be rejected

### Tasks Completed
- [x] Investigate cap calculation in discord-bot.ts bid confirmation
- [x] Find where 242 is coming from (was using salaryCap instead of overall)
- [x] Fix projected cap formula: current - dropped + signed (using overall only)
- [x] Add hard-coded validation: reject if projectedCap > 1098
- [x] Test with Jazz scenario (1098 - 76 + 77 = 1099, correctly rejects)
- [x] Verify error message explains why bid was rejected
- [x] Save checkpoint

---

## COMPLETED: Fix FA Bid Parser Regex Bug ✅
All phases completed and checkpoint saved.

## COMPLETED: Fix Trade Parser (Separators, Commas, Team Names) ✅
All phases completed and checkpoint saved.

## COMPLETED: Fix Bot Stability and Roster Message ✅
All phases completed and checkpoint saved.

## COMPLETED: Fix Discord Roster Message Sorting ✅
All phases completed and checkpoint saved.

---

## COMPLETED: Bot Offline & Roster Message Sorting Fix ✅

### Issues Fixed
1. ✅ Roster message sorting - Over-cap teams now appear at bottom instead of top
2. ✅ Discord roster message updated with new sorting (28 teams)
3. ✅ Bot initialization verified - Bot connects successfully when started
4. ✅ Updated 'ready' event to 'clientReady' to fix deprecation warning
5. ✅ Added detailed logging for bot startup process

### Tasks Completed
- [x] Check server logs for bot connection errors
- [x] Verify DISCORD_BOT_TOKEN environment variable is set
- [x] Check if bot is actually connected to Discord
- [x] Manually trigger roster message update via admin UI
- [x] Verify new sorting appears in Discord (over-cap teams at bottom)
- [x] Fix clientReady event deprecation
- [x] Test bot initialization manually
- [x] Save checkpoint

### Notes
- Bot successfully logs in as "HOF 2K Manus Bot#0960"
- All bot systems initialize correctly (FA monitoring, overcap roles, trade voting, etc.)
- Roster message sorting change: `aOverCap - bOverCap` (ascending) instead of `bOverCap - aOverCap` (descending)
- This puts teams under cap first, over-cap teams at bottom
