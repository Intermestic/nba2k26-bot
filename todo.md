# NBA 2K26 Player Database - TODO

## NEW: OneDrive to ChatGPT Photo Automation

### Goal
Create admin automation that downloads photos from OneDrive, uploads to ChatGPT in batches, deletes from OneDrive, and sends CSV to Discord.

### Requirements
- OneDrive folder: https://1drv.ms/f/c/7bb3497e23b33ef5/IgAXnKsjp-DTTYwKIwpB_I38Abckl4P1O9smarZsX6GgMOM?e=VQP2lk
- ChatGPT chat: https://chatgpt.com/share/6928df92-e4bc-8012-83e2-ac21515058ca
- Batch size: Maximum 10 photos per upload
- Delete photos from OneDrive after successful upload
- Send CSV of extracted data to Discord channel: 1443741234106470493

### Tasks
- [x] Test OneDrive link access and understand folder structure
- [x] Create admin UI page with "Process OneDrive Photos" button
- [x] Build OneDrive photo download script
- [x] Implement ChatGPT login with browser automation
- [x] Create batch upload logic (10 photos max per batch)
- [x] Add OneDrive file deletion after upload
- [x] Extract data from ChatGPT responses
- [x] Generate CSV file
- [x] Send CSV to Discord channel via bot
- [x] Add progress tracking and error handling
- [x] Test complete workflow end-to-end

## Fix Puppeteer Browser Launch Error

### Tasks
- [x] Install missing system dependencies (libglib-2.0.so.0)
- [x] Configure Puppeteer with proper launch arguments
- [x] Test browser automation
- [x] Verify OneDrive processor works end-to-end

## Fix Chromium Binary Path

### Issue
- executablePath was set to /usr/bin/chromium-browser (shell script wrapper)
- Actual binary is at /usr/lib/chromium-browser/chromium-browser

### Tasks
- [x] Update executablePath to /usr/lib/chromium-browser/chromium-browser
- [x] Test browser launch with correct path
- [x] Verify OneDrive processor works end-to-end

## Browser Launch Error Investigation (Web UI)

User reports browser still fails when triggered from web UI with error:
"Browser was not found at the configured executablePath (/usr/lib/chromium-browser/chromium-browser)"

### Investigation Tasks
- [x] Check if error happens during server startup or only when triggered - Only when triggered
- [x] Verify the actual error message from the server logs - "Browser was not found at the configured executablePath"
- [x] Test if Puppeteer can launch browser in the server process context - Works in standalone tests
- [x] Check if there are permission issues or missing dependencies - Browser is accessible and executable
- [x] Verify the code path from web UI button click to browser launch - API call hangs during browser launch

### Fix Strategy
- [x] Switch from `puppeteer` to `puppeteer-core` to avoid browser download issues
- [x] Remove regular `puppeteer` package to prevent conflicts
- [ ] Test with puppeteer-core through web UI

## Switch to Playwright

Puppeteer-core still fails with the same error even though standalone tests work. Switching to Playwright which has better system browser support.

### Tasks
- [x] Install Playwright
- [x] Rewrite OneDrive processor to use Playwright API
- [x] Fix Playwright API compatibility (networkidle2 → networkidle, waitForNavigation → waitForLoadState)
- [x] Add comprehensive logging throughout the function
- [x] Test browser launch with Playwright
- [x] Verify complete workflow works through web UI - SUCCESS!

## Fix Photo Detection Issue

Browser launches successfully but finds 0 photos when there are 41 photos in the OneDrive folder.

### Tasks
- [ ] Check server logs to see what's happening during photo detection
- [ ] Verify OneDrive folder URL and selectors are correct
- [ ] Add more detailed logging to downloadPhotosFromOneDrive function
- [ ] Test photo detection and download

## Remove OneDrive Photo Processor Feature

Feature is not working reliably and wasting time/money. Removing completely.

### Tasks
- [x] Delete server/services/onedrive-processor.ts
- [x] Delete server/routes/onedrive.ts
- [x] Delete client/src/pages/admin/OneDriveProcessor.tsx
- [x] Remove OneDrive route from App.tsx
- [x] Remove OneDrive router from server index
- [x] Remove OneDrive navigation card from admin dashboard
- [x] Remove playwright dependency (only used for OneDrive)

## Create Admin CSV Export Page

Move CSV export functionality from main page to admin area with customizable column selection.

### Tasks
- [x] Create admin CSV export page UI with checkboxes for column selection
- [x] Add column options: Full Name, First Initial Last Name, Team, Overall, Photo URL, Aliases, Rookie Status, etc.
- [x] Add filter options: All Players, Rookies Only, By Team
- [x] Build backend TRPC endpoint for customizable CSV generation
- [x] Remove CSV/JSON download buttons from main page header
- [x] Add CSV Export to admin dashboard navigation
- [x] Test all column combinations and filters

## Activity Booster Record Tracking System

Build Discord bot feature to track team W/L records from activity booster posts.

### Requirements Gathering
- [x] Clarify post format (how users post results)
- [x] Determine team identification method (role vs message content)
- [x] Define result parsing logic (W/L, score, text)
- [x] Design standings message format

### Implementation
- [x] Create activity booster message parser
- [x] Build record calculation logic
- [x] Implement !activity-records command
- [x] Add message scanning from channel start
- [x] Create standings message generator
- [x] Create head-to-head matchup log generator
- [x] Send head-to-head log to channel 1443741234106470493
- [x] Build checkpoint system (track last standings post)
- [x] Implement incremental update logic
- [x] Add database table for activity records
- [x] Test with real channel messages
- [x] Add error handling for malformed posts

## Fix Activity Booster Command Bugs

### Issues
1. !ab-records command executes twice, causing double posting
2. Game counts are doubled (20 games shown for 10 actual Raptors games)

### Root Cause
- No command deduplication mechanism
- Same command message triggers handler twice
- Database records get counted twice before checkpoint is saved

### Tasks
- [x] Add command deduplication tracking (Set with TTL) - FAILED, still double posting
- [x] Reset activity records database to clear double-counted data
- [x] Reset activity checkpoint to allow fresh scan
- [x] Investigate why deduplication is not working (race condition in async check)
- [x] Implement proper async locking mechanism with commandsInProgress Set - FAILED
- [ ] Test !ab-records command for single execution and correct counts

## CRITICAL: !ab-records Command Executing 5+ Times

### Observed Behavior
- Single !ab-records command triggered 5 "Scanning..." messages
- Posted 5 different standings with escalating counts:
  * First: Raptors 25-0 (50.5 games)
  * Second: Raptors 26-0 (56 games)
  * Third: Raptors 40-0 (85.5 games)
  * Fourth: Raptors 45-0 (96 games)
  * Fifth: Raptors 26-0 (57 games)
- 5 "Processed 20 new games" completion messages

### Root Cause Analysis
- [x] Check if commandsInProgress Set is being cleared too early - No, timing was correct
- [x] Verify message.id is stable across all executions - Yes, stable
- [x] Check if Discord is sending duplicate messageCreate events - No, single event
- [x] Investigate if hot reload is causing multiple listener registrations - **YES, THIS WAS THE ISSUE**
- [x] Add comprehensive logging to track execution flow

### Root Cause Identified
Hot Module Reloading (HMR) was registering multiple messageCreate listeners without removing old ones. Each code save added a new listener, resulting in 5+ concurrent executions of the same command. Additionally, the commandsInProgress Set was recreated on each reload, so old listeners couldn't see new locks.

### Solution Implemented (Attempt 1 - FAILED)
- [x] Made processedCommands and commandsInProgress Sets persist in global scope to survive HMR
- [x] Added client.removeAllListeners('messageCreate') before registering listener
- [x] Reset all activity booster database tables (records, head-to-head, checkpoint)
- [x] Still had 4x execution - removeAllListeners didn't work

### Solution Implemented (Attempt 2 - TESTING)
- [x] Added global flag to prevent startDiscordBot from running multiple times on HMR
- [x] Added instance ID tracking to identify which bot instance handles commands
- [x] Destroy old client before creating new one in startDiscordBot
- [x] Added primary message deduplication at messageCreate handler start (processedMessages Set)
- [x] Made processedMessages Set persist in global scope
- [x] Cleared all database records for fresh test (activity_records, activity_head_to_head, activity_checkpoint)
- [ ] Test !ab-records command for single execution and correct counts (waiting for user)


## Activity Booster Enhancements

### Game Result Validation System
- [ ] Create activity_conflicts database table to store flagged games
- [ ] Design conflict detection logic (same matchup, different outcomes)
- [ ] Implement validation in activity-booster-command.ts
- [ ] Add conflict flagging when processing games
- [ ] Post warnings to Discord when conflicts detected
- [ ] Create admin UI to review flagged conflicts

### !ab-reset Admin Command
- [ ] Add !ab-reset command handler in discord-bot.ts
- [ ] Implement admin permission check (Admin role or owner ID)
- [ ] Add confirmation dialog with reaction collector
- [ ] Clear all three tables: activity_records, activity_head_to_head, activity_checkpoint
- [ ] Post success message after reset
- [ ] Add logging for audit trail


## URGENT: !ab-records Still Executing 4+ Times

### Latest Observation (12:46 AM)
- 4 "Scanning..." messages
- 2 error messages with different standings (29.5 games vs 40.5 games)
- 2 success messages "Processed 20 new games"
- HMR listener cleanup not working as expected

### Investigation Tasks
- [x] Check if removeAllListeners is actually being called
- [x] Verify global Sets are persisting across HMR reloads
- [x] Add unique instance ID to track how many bot instances exist
- [x] Check if Discord client is being recreated multiple times
- [x] Prevent HMR from calling startDiscordBot multiple times
- [x] Add primary message deduplication at messageCreate handler start
- [ ] Test if fix works (waiting for user confirmation)


## CRITICAL: !ab-records Still Has Two Major Bugs

### Issue 1: Still Quadruple Posting (12:53 AM Test)
- 4 "Scanning..." messages
- 4 different standings posted with varying counts
- 3 "Processed 20 new games" success messages
- All deduplication attempts failed (global Sets, removeAllListeners, global flag, processedMessages)

### Issue 2: Incorrect Game Counts
Expected output:
- Raptors: 9-0
- Rockets: 3-1
- Nuggets: 2-0
- etc. (total ~20 games)

Actual output:
- Raptors: 34-0
- Rockets: 10-4
- Nuggets: 7-0
- etc. (total ~72 games)

Counts are 3-4x higher than they should be.

### Root Cause Theories
1. **Quadruple posting**: HMR is still creating multiple bot instances despite global flag
2. **Incorrect counts**: Parser may be counting each message multiple times, or including messages before cutoff

### Tasks
- [x] Implement execution lock mechanism to prevent duplicate command processing
- [x] Test quadruple posting fix - RESOLVED! Only one message now
- [ ] Debug parser to understand why counts are still slightly off (Raptors 10-0 vs 9-0, Spurs 0-2 vs 0-3)
- [ ] Add detailed logging to see which messages are being parsed
- [ ] Verify cross-team posts are handled correctly (e.g., Pistons user posting Raptors win)
- [ ] Test with corrected parser logic


## Fix Bot Management Commands Display

### Issues
1. Bot Management > Commands tab only shows 2 commands (!sync-team-roles, !sync-team-channels)
2. Missing many hardcoded Discord commands: !ab-records, !badge, !update bid, !regenerate-summary, /updatecap, !updateovercap
3. Custom Commands page is redundant and confusing (shows 0 commands, separate feature)

### Tasks
- [x] Identify all hardcoded Discord commands from discord-bot.ts
- [x] Add missing commands to bot_commands table with proper metadata (description, category, permissions)
- [x] Update Bot Management UI to show all hardcoded commands
- [x] Clarify difference between Bot Management Commands (hardcoded) and Custom Commands (user-created)
- [ ] Consider removing or renaming Custom Commands page to reduce confusion (kept as-is with clarified description)


## Help Command System

### Goal
Implement !help command that lists all available Discord bot commands with descriptions and usage examples

### Tasks
- [x] Create help command handler in discord-bot.ts
- [x] Fetch all bot commands from bot_commands table
- [x] Format commands into Discord embed with categories
- [x] Add usage examples for each command
- [x] Test !help command in Discord
- [x] Add !help command to bot_commands table


## Command Usage Examples

### Goal
Add usage examples to bot_commands table and display them in !help command

### Tasks
- [x] Add example column to bot_commands table schema
- [x] Update database migration
- [x] Populate example data for all 10 commands
- [x] Update !help command to display examples
- [x] Test !help command shows examples correctly
