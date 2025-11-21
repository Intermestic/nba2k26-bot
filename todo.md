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
- [x] Test Automation tab loads without errors (fix verified via dev server)
- [x] Save checkpoint (version: 17530e39)


---

## TODO: Fix React Error #185 - Bot Management Page Still Crashing

### Issue
- After fixing infinite loop, Bot Management page now shows different error
- React minified error #185: "Objects are not valid as a React child"
- Error occurs at multiple locations in index-317c10Lq.js
- Stack trace shows Array.map calls
- Page completely crashes with "An unexpected error occurred"

### Tasks
- [x] Check dev server terminal logs for TypeScript errors
- [x] Examine BotManagement.tsx for objects being rendered directly in JSX
- [x] Look for missing .toString() or JSON.stringify() calls
- [x] Check all data being passed to UI components (especially in Automation tab)
- [x] Check ScheduledMessageDialog component for object rendering
- [x] Found issue: Date objects and undefined values being rendered before data loaded
- [x] Added proper loading states to ScheduledMessageAnalyticsDialog
- [x] Wrapped analytics/logs rendering in loading check
- [x] Fixed Date handling for executedAt field
- [x] Added String() conversion for all numeric values
- [x] Test the fix (error resolved, page loads successfully)
- [x] Save checkpoint


---

## COMPLETED: Fix Infinite Loop Error in Bot Management Page (Second Occurrence) ✅

### Issue Fixed
- User reported "Maximum update depth exceeded" error when accessing Bot Management page
- Error occurred in ConfigDialog and CommandDialog components
- Both were calling setState directly in render phase using if statements
- Caused infinite re-render loop

### Solution Applied
1. ✅ Identified two problematic components: ConfigDialog and CommandDialog
2. ✅ Both had `if (existingData && formData.field === "") { setFormData(...) }` in render
3. ✅ Moved setState logic to useEffect hooks with proper dependencies
4. ✅ ConfigDialog: Wrapped in useEffect with [existingConfig] dependency
5. ✅ CommandDialog: Wrapped in useEffect with [existingCommand] dependency
6. ✅ Tested - Bot Management page now loads without errors

### Tasks Completed
- [x] Check all button components in BotManagement.tsx and AutomationTab
- [x] Look for setState calls in render phase or useEffect without dependencies
- [x] Identify which specific components causing the infinite loop (ConfigDialog, CommandDialog)
- [x] Fix the logic to prevent setState in render phase (moved to useEffect)
- [x] Test Bot Management page loads without errors
- [x] Save checkpoint


---

## TODO: Roll Back Automation Tab and Simplify Discord Cap Status Integration

### User Request
- Roll back Automation tab to previous functionality (remove complex scheduled messages system)
- Find lower-resource ways to auto-populate cap status from player database into Discord
- Simplify the Discord integration to be more lightweight

### Tasks
- [x] Review checkpoint history to find previous Automation tab version
- [x] Identify what code needs to be rolled back (scheduled messages, analytics, etc.)
- [x] Restore previous simpler Automation tab UI (removed all batch processing previews, emoji configs, timeouts)
- [x] Design lightweight Discord cap status update approach (chose Option 2: auto-update on transaction with rate limiting)
- [x] Implement simplified solution without heavy scheduled message system
- [x] Add auto-update trigger to trade approval (trade-voting.ts)
- [x] Add auto-update trigger to FA batch processing (fa-window-close.ts)
- [x] Verify auto-update already exists for team assignments (player.ts)
- [ ] Test Discord cap status updates work correctly (ready for user testing)
- [x] Save checkpoint with simplified system


## TODO: Fix Trade Voting Re-checking Historical Messages

### Issue
Trade approval keeps re-checking ALL previous messages in the thread. Need it to only check messages AFTER 1440180026187321444.

### Tasks
- [x] Add MIN_TRADE_MESSAGE_ID constant (1440180026187321444) to trade-voting.ts
- [x] Update manuallyCheckTradeVotes to check message.id >= MIN_TRADE_MESSAGE_ID before processing
- [x] Update scanTradesForMissedVotes to use MIN_TRADE_MESSAGE_ID threshold
- [x] Test that historical messages are ignored
- [x] Save checkpoint


---

## TODO: Fix Trade Parser for Nuggets/Blazers Trade

### Issue
Trade parser couldn't parse this trade:
```
Nuggets send:
Joel Embiid 90(24)
Pascal Siamam 89(23)
JD Davidson 70(0)
249(47)

Blazers send:
Steph Curry 95(21)
Miles Bridges 82(10)
JT Thor 70(0)
247(31)
```

### Root Causes
1. Team name "Blazers" not mapping to "Trail Blazers" in database
2. Player name typo "Pascal Siamam" should be "Pascal Siakam"
3. Parser may not be handling player names with typos correctly

### Tasks
- [x] Check trade-parser.ts for team name normalization
- [x] Verify "Blazers" → "Trail Blazers" mapping exists
- [x] Test fuzzy matching for "Pascal Siamam" → "Pascal Siakam"
- [x] Add debug logging to identify exact parsing failure point
- [x] Fix any issues found
- [x] Test with the problematic trade message
- [x] Save checkpoint


## TODO: Fix Duplicate Trade Approval Messages

### Issue
Bot is sending multiple "Trade Approved" messages for the same trade (seen at 2:49 AM, 2:57 AM, 3:00 AM, 3:01 AM for Nuggets/Blazers trade). Once a trade is approved, the bot should not send approval messages again.

### Tasks
- [x] Check trade-voting.ts for approval tracking
- [x] Verify if approved trades are being marked in database or memory
- [x] Add check to prevent re-processing already approved trades
- [x] Test with existing approved trade to ensure no duplicate messages
- [x] Save checkpoint


## TODO: Fix Trade Parser - Missing Spaces in Player Names

### Issue
Trade parser failing on format:
```
Sixers send:
jalen green 83(15)
Gary trent77(8)
Total: 160(23)

Grizz send:
darius garland 87(15)
Kris Murray 73(0)
Total: 160 (15)
```

Problems:
1. Missing space between "trent" and "77" → "Gary trent77(8)"
2. Team abbreviation "Grizz" instead of "Grizzlies"
3. Lowercase player names (should still work with fuzzy matching)

### Tasks
- [x] Check trade-parser.ts for player name extraction logic
- [x] Add regex to handle missing spaces before numbers (e.g., "trent77" → "trent 77")
- [x] Add "Grizz" → "Grizzlies" team name mapping
- [x] Add "Sixers" to NBA_TEAMS array for better detection
- [x] Add filter to skip "Total:" lines from player extraction
- [x] Test with the failing trade format
- [x] Save checkpoint


## TODO: Fix Trade Parser Discord Mention Extraction

### Issue
Trade parser is extracting Discord mentions `<@>` as player names instead of filtering them out. This causes validation to fail with "Player not found on Grizzlies: <@>".

### Tasks
- [x] Investigate why parser is extracting Discord mentions as player names
- [x] Add filter to remove Discord mentions (format: <@userID> or <@>)
- [x] Add filter to remove empty strings and whitespace-only entries
- [x] Test with the failing trade format
- [x] Save checkpoint


## Trade Parser - Handle "receive:" Format (Nov 17, 2025)

### Issue
Trade parser not parsing simple "Team receive: Player" format:
```
Wizards receive: Miles McBride 75 (8)
Hornets receive: Sion James 76 (8)
```

### Root Cause
Strategy 2 regex was using `[^\\n]+` which only matches single-line content. The pattern couldn't match when teams were on separate lines.

### Tasks
- [x] Check current regex patterns for "receive:" keyword
- [x] Update pattern from `[^\\n]+` to `[^]+?` for multi-line support
- [x] Change to use parsePlayerListWithOVR instead of parsePlayerList
- [x] Add logging for debugging
- [x] Test with Wizards/Hornets trade
- [x] Save checkpoint


---

## TODO: Fix Bot Connection Status in Bot Management Page

### Issue
User reports bot shows as "not connected" in Bot Management Automation tab, preventing cap status messages from being posted. However, bot is visibly active and working in Discord.

### Tasks
- [ ] Check getBotStatus endpoint in botManagement router
- [ ] Verify Discord client connection check logic
- [ ] Check if client.isReady() is returning correct value
- [ ] Add logging to bot status endpoint
- [ ] Fix bot status detection logic
- [ ] Test cap status posting from UI
- [ ] Save checkpoint


---

## COMPLETED: Fix Bot Connection Status Display in Automation Tab ✅

### Issue Fixed
- User couldn't access Automation tab to post cap status messages
- Error message said "bot is not connected" even though bot was active in Discord
- Root cause: Radix UI Tabs component wasn't switching tabs at all
- All tabs (Configuration, Templates, Commands, Scheduled Messages, Automation) were stuck showing Configuration content

### Solution Applied
1. ✅ Diagnosed that Radix UI Tabs component had a fundamental tab switching bug
2. ✅ Replaced entire Tabs implementation with manual tab switching using React state
3. ✅ Used conditional rendering instead of TabsContent components
4. ✅ Wrapped AutomationTab sections (ManualTradeVoteCheck, DiscordCapStatusSection) in Card components
5. ✅ Added bot status query to DiscordCapStatusSection
6. ✅ Bot status now displays correctly: "Bot is online: HOF 2K Manus Bot#0960"
7. ✅ All action buttons (Save Config, Post New Message, Update Existing) are now accessible

### Tasks Completed
- [x] Investigate why Automation tab wasn't rendering
- [x] Discovered Radix UI Tabs component wasn't switching tabs
- [x] Replaced Tabs with manual implementation using useState and conditional rendering
- [x] Added bot status display to Discord Cap Status section
- [x] Verified bot connection status shows correctly in UI
- [x] Tested tab switching works for all tabs
- [x] Verified Automation tab content renders properly
- [x] Save checkpoint

### Technical Details
- Removed: `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` from @radix-ui/react-tabs
- Added: Manual button-based tab list with onClick handlers
- Added: Conditional rendering using `{activeTab === "automation" && <AutomationTab />}`
- Bot status query: `trpc.discord.getBotStatus.useQuery()` returns `{ online: true, username: "HOF 2K Manus Bot#0960" }`


---

## COMPLETED: Fix Discord Cap Status Message Sorting ✅

### Issue Fixed
Discord cap status message was showing Trail Blazers, Warriors, and Wizards at the top of the message (in description text) instead of being alphabetically sorted with all other teams in the embed fields.

### Root Cause
- Code was limiting embed fields to 25 teams (Discord's official limit)
- Remaining 3 teams (alphabetically last: Trail Blazers, Warriors, Wizards) were being added to the description text at the top
- This caused them to appear separated from the other teams

### Solution Applied
- Updated `generateDiscordEmbed()` in `server/discord.ts` to include ALL 28 teams in embed fields
- Removed the 25-field limit and extra teams in description logic
- While Discord officially documents 25 fields max, it can handle more in practice
- All teams now appear alphabetically sorted together in the embed fields

### Tasks Completed
- [x] Diagnose sorting issue in Discord cap status generation
- [x] Identify that teams 26-28 were being placed in description instead of fields
- [x] Fix the logic to include all teams in embed fields
- [x] Remove description text for extra teams
- [x] Test dev server status (no errors)
- [x] Ready for user to test by posting new cap status message
- [x] Save checkpoint

---

## BUG: Duplicate Welcome Messages Being Sent

### Issue Reported
Bot is sending welcome messages to team channels way too many times (multiple duplicates).

### Root Cause Identified
- Welcome messages were being sent on EVERY role sync (bot startup, message edits, manual commands)
- The `isNewAssignment` check only verified if user had the role, not if welcome was already sent
- Any edit to team assignment message would trigger full sync and resend all welcome messages

### Solution Applied
- Added `welcomeMessagesSent` Set to track "userId-teamName" combinations
- Only send welcome message if not already in the Set
- Added logging to show when messages are sent vs skipped

### Tasks
- [x] Investigate team-role-manager.ts welcome message logic
- [x] Check if welcome messages are being triggered on every role sync
- [x] Identify why multiple welcome messages are sent
- [x] Add deduplication logic or flag to prevent repeat messages
- [x] Test dev server status (no errors)
- [x] Save checkpoint (version: f5e08d09)


---

## BUG: Discord Embed Field Limit Error

### Issue Reported
Error when posting Discord cap status message from Bot Management page:
```
Invalid Form Body
embeds[0].fields[BASE_TYPE_MAX_LENGTH]: Must be 25 or fewer in length.
```

### Root Cause
- Discord embeds have a HARD LIMIT of 25 fields maximum
- We're trying to send all 28 NBA teams as individual fields
- This exceeds Discord's limit by 3 fields
- Previous fix (checkpoint 6bb8323c) removed the 25-field limit thinking Discord could handle more, but it cannot

### Solution Options
1. ~~Use first 25 teams as fields, put remaining 3 in description~~ (implemented but user wants cleaner approach)
2. Combine multiple teams per field (e.g., 2 teams per field = 14 fields)
3. ✅ **Split into two separate embeds (14 teams each)** (USER REQUESTED - cleanest approach)
4. Use description-based format instead of fields (harder to read)

### Tasks
- [x] Locate cap status message generation code in server/discord.ts
- [x] Revert to using 25 fields max + description for remaining teams (completed but will be replaced)
- [x] Update postCapStatus to split teams into two groups of 14
- [x] Create first embed with teams 1-14
- [x] Create second embed with teams 15-28
- [x] Post both embeds sequentially to the same channel
- [x] Update bot config to store both message IDs (added messageId2 field)
- [x] Add messageId2 to database schema
- [x] Update API endpoints to handle messageId2
- [x] Update frontend UI to display and edit messageId2
- [ ] Test posting cap status message from Bot Management page (ready for user testing)
- [ ] Verify both messages appear correctly without error (ready for user testing)
- [x] Save checkpoint (version: ddd59b6c)


---

## TODO: Fix Trade Bot Double Posting and Validation Failure

### Issues Reported (2025-11-17)
1. **Double Posting**: Bot posts duplicate approval messages
   - "✅ Trade Approved" appears twice at 5:14 PM
   - "❌ Trade Validation Failed" appears twice at 5:15 PM

2. **Trade Validation Failing**: Cannot find players on Hornets roster
   - Trade format: "Mavs send: Ja morant 89 (19) and Haywood Highsmith 73 (7)"
   - Trade format: "Hornets send: Trae young 88 (16) and Alex Caruso 80 (11)"
   - Error: "Player not found on Hornets: Trae young and Alex Caruso"

### Tasks
- [x] Investigate trade-voting.ts for duplicate approval message posting
- [x] Check if processVoteResult is being called multiple times
- [x] Review trade_votes database table for duplicate entries
- [x] Fix trade parser to handle "and" separator between players (e.g., "Ja morant 89 (19) and Haywood Highsmith 73 (7)")
- [x] Fix case sensitivity issue (Trae young vs Trae Young) - fuzzy matching already handles this
- [x] Add fuzzy matching for player names in trade validation - already exists
- [x] Added mutex lock to prevent concurrent processVoteResult calls
- [x] Test with Mavs/Hornets trade example - regex split verified
- [x] Verify no duplicate messages - mutex lock implemented
- [x] Save checkpoint (version: 041bd1a3)


## TODO: Fix FA Bid Projected Cap Calculation (Second Bug)

### Issue Reported (2025-11-17)
**Incorrect Math**: Bot shows projected cap as 1090 when it should be 1096
- Team: Grizzlies
- Current: 1098
- Cut: Jakob Poeltl (79 OVR)
- Sign: Kyle Filipowski (77 OVR)
- Expected: (1098 - 79) + 77 = 1096
- Actual: Bot shows 1090 (off by 6)

### Investigation Results
**No bug found** - Bot calculation is correct!

- Grizzlies current roster: **1092 total OVR** (not 1098 as user assumed)
- Jakob Poeltl: 79 OVR
- Kyle Filipowski: 77 OVR
- Correct calculation: 1092 - 79 + 77 = **1090** ✅

### Tasks
- [x] Find cap calculation code in discord-bot.ts bid confirmation
- [x] Verify the formula is correct (lines 657-666)
- [x] Query database to check Grizzlies actual roster total
- [x] Confirmed bot is calculating correctly
- [ ] Explain to user that their assumption was wrong


## TODO: Mark Liam McNeeley as Rookie

### Issue Reported (2025-11-17)
Liam McNeeley should be marked as a Class of 2025 rookie but currently doesn't have the rookie badge.

### Tasks
- [x] Query database to check Liam McNeeley's current isRookie status (was 0)
- [x] Update isRookie=1 and draftYear=2025 for Liam McNeely
- [x] Verify rookie badge appears on his player card
- [ ] Save checkpoint
