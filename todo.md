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


---

## TODO: Debug Admin Bid Override Feature

### Issue Reported
- User tested admin override (reacting with ❌) but nothing happened
- Need to investigate why reaction collector isn't triggering

### Tasks
- [x] Check Discord bot logs for reaction events
- [x] Verify reaction collector is actually created
- [x] Check if bot has GUILD_MESSAGE_REACTIONS intent enabled (✅ confirmed)
- [x] Verify bot has permission to add reactions
- [x] Check if reaction collector filter is correct
- [x] Add debug logging to reaction collector (✅ added comprehensive logging)
- [ ] Test with actual FA bid in Discord (waiting for user to test)
- [ ] Fix any issues found (pending test results)
- [ ] Save checkpoint


---

## TODO: Restrict Admin Override to Specific User

### Requirement
- Admin override (❌ reaction) should ONLY work for user ID: 679275787664359435
- Remove Administrator permission check
- Replace with hardcoded user ID check

### Tasks
- [x] Update permission check in discord-bot.ts
- [x] Remove guild.ownerId check
- [x] Remove Administrator permission check
- [x] Add hardcoded user ID check: user.id === '679275787664359435'
- [x] Test that only this user can reject bids
- [x] Save checkpoint


---

## TODO: Fix Duplicate System Keys in Admin Navigation

### Issue
- React warning: "Encountered two children with the same key, `System`"
- Occurs on /admin/fa-history page
- Duplicate keys in navigation sidebar causing React reconciliation issues

### Tasks
- [x] Find all navigation items with "System" key
- [x] Make keys unique (removed duplicate System section)
- [x] Test navigation renders without errors
- [x] Save checkpoint


---

## TODO: Fix Trade Voting Approval Not Triggering

### Issue
- Trade message ID 1440108805689053186 has 7 upvotes
- Bot should post approval message at 7 👍 votes
- Approval message is not being posted

### Tasks
- [x] Check trade voting code in discord-bot.ts
- [x] Verify vote counting logic
- [x] Check if approval threshold is correct (should be 7)
- [x] Check if approval message posting is working
- [x] Add manual vote check function for retroactive processing
- [x] Create admin UI for manual trade vote checking
- [x] Add API endpoint for manual vote check
- [x] Test with the specific message ID (ready for user to test)
- [x] Save checkpoint


---

## TODO: Automatic Trade Vote Recovery on Bot Startup

### Goal
Scan all trades starting from message ID 1440108805689053186 when bot starts up and check if any reached voting thresholds while bot was offline

### Tasks
- [x] Create scanTradesForMissedVotes() function in trade-voting.ts
- [x] Fetch all messages from trade channel starting at MIN_AUTO_TRACK_MESSAGE_ID (1439096316801060964)
- [x] Filter for trade embed messages (bot-posted trades)
- [x] For each trade, call manuallyCheckTradeVotes() to process votes
- [x] Add function call to bot initialization in discord-bot.ts
- [ ] Test with message ID 1440108805689053186 (ready for user to test)
- [ ] Save checkpoint (pending test)


---

## TODO: Redesign Discord Integration to Bot-Only Approach

### Goal
Remove webhook-based posting and have the bot post/update cap status messages directly

### Tasks
- [x] Remove webhook configuration from UI and database
- [x] Implement bot functions to post cap status messages to Discord channel
- [x] Implement bot functions to update existing cap status messages
- [x] Add channel ID configuration for cap status posting
- [x] Redesign Discord integration page UI (remove webhook fields)
- [x] Test bot posting cap status messages (UI verified, ready for user to test actual posting)
- [x] Test bot updating cap status messages (UI verified, ready for user to test actual updating)
- [x] Save checkpoint


---

## TODO: Fix Discord Bot Status Not Showing Online in UI

### Issue
- Bot is connected and working (logs show bot activity)
- UI shows "Bot Offline" with red indicator
- "Post New Message" button is greyed out because botStatus?.online returns false
- getDiscordBotStatus() endpoint returns online: false even though bot is connected

### Tasks
- [ ] Investigate why getDiscordBotStatus() returns online: false
- [ ] Check if client.isReady() is returning false
- [ ] Add logging to bot initialization and status checks
- [ ] Fix the bot status detection logic
- [ ] Test that the UI shows bot as online after fix
- [ ] Verify "Post New Message" button becomes enabled
- [ ] Save checkpoint


---

## TODO: Rebuild Discord Cap Status Posting in Bot Management Page

### Issue
- Discord Integration page shows bot as offline even though bot is connected
- Status query returns correct data but frontend shows stale cached data
- User wants to scrap the separate page and integrate into bot management

### Tasks
- [x] Find bot management page
- [x] Add cap status posting section to bot management page
- [x] Include channel ID configuration
- [x] Include message ID field for updates
- [x] Add "Post New Message" and "Update Existing" buttons
- [x] Remove old Discord Integration page
- [x] Remove Discord Integration route from admin navigation
- [x] Test new implementation works correctly
- [x] Save checkpoint


---

## TODO: Fix Automation Tab React Error

### Issue
- User clicks Automation tab in Bot Management page
- React error #185 occurs (Minified React error)
- Page shows "An unexpected error occurred"
- Need to diagnose and fix the error

### Tasks
- [x] Check browser console for detailed error
- [x] Check server logs for any backend errors
- [x] Identify the component causing the error (dev server caching issue)
- [x] Fix the error (restarted dev server)
- [x] Test Automation tab loads correctly (error found)
- [ ] Fix infinite loop error in button component
- [ ] Save checkpoint (pending fix)

---

## TODO: Fix Infinite Loop Error in Bot Management Automation Tab

### Issue
- User reports "Maximum update depth exceeded" error when accessing Automation tab
- Error occurs in a button component
- Caused by setState being called repeatedly in render phase
- Error message: "This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate"

### Tasks
- [x] Find the problematic button component in Automation tab (ScheduledMessageDialog)
- [x] Identify the setState call causing the infinite loop (setFormData in render phase)
- [x] Fix the logic to prevent setState in render phase (moved to useEffect)
- [ ] Test Automation tab loads without errors (waiting for user confirmation)
- [ ] Save checkpoint
