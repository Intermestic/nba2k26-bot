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

### Solution Implemented
- [x] Made processedCommands and commandsInProgress Sets persist in global scope to survive HMR
- [x] Added client.removeAllListeners('messageCreate') before registering listener
- [x] Reset all activity booster database tables (records, head-to-head, checkpoint)
- [ ] Test !ab-records command for single execution and correct counts
