# NBA 2K26 Player Database - TODO

## Data Management

- [x] Clear all data after post ID 1443874843090223275

## Activity Booster System

### Game Result Validation
- [ ] Create activity_conflicts database table to store flagged games
- [ ] Design conflict detection logic (same matchup, different outcomes)
- [ ] Implement validation in activity-booster-command.ts
- [ ] Add conflict flagging when processing games
- [ ] Post warnings to Discord when conflicts detected
- [ ] Create admin UI to review flagged conflicts

### Activity Booster Record Cumulative Fix
- [x] Fix activity booster to be incremental + cumulative (add new games to existing records, don't clear)
- [x] Fix command triggering multiple times (3-4 duplicate executions)
- [x] Fix duplicate message processing - bot processes same messages multiple times causing inflated records
- [x] Fix game counting accuracy - ensure correct cumulative records (Raptors should be 12-0 based on valid posts)
- [x] Fix Discord API message fetching direction (was fetching old messages instead of new ones)

### !ab-reset Admin Command
- [ ] Add !ab-reset command handler in discord-bot.ts
- [ ] Implement admin permission check (Admin role or owner ID)
- [ ] Add confirmation dialog with reaction collector
- [ ] Clear all three tables: activity_records, activity_head_to_head, activity_checkpoint
- [ ] Post success message after reset
- [ ] Add logging for audit trail


## Trade System

### Trade Approval Workflow
- [x] Fix "No trade record found" error after trade approval
- [ ] Fix trade approval bug - trades with 7+ yes votes showing "reversed" instead of "approved"
- [ ] Test trade approval workflow end-to-end
- [ ] Test with the stuck Cavs/Trailblazers trade
- [ ] Verify no duplicate messages are posted
- [x] Fix Discord bot trade recognition issue - some trades not being detected

### Trade Voting System
- [ ] Test !check-trade command with message ID 1445268293186490548
- [ ] Verify future trades auto-approve at 7 votes
- [x] Fix trade status update messages appearing incorrectly when reactions are added
- [x] Fix !check-trade command not returning results
- [x] Fix voting bug - trade with 7 yes and 4 no votes not auto-processing or showing approval message

### Trade Reversal System
- [x] Implement ⏪ emoji reaction handler for trade reversal (owner-only)
- [x] Reverse player roster assignments when trade is reversed
- [x] Update trade status to "reversed" in database
- [x] Log reversal action with timestamp and user


## Player Management

### Database Population
- [x] Fix schema mismatch causing "0 players" display issue


### Auto-Alias Learning System
- [x] Auto-save misspellings as aliases when fuzzy matcher finds correct player
- [x] Complete Sixers-Pacers trade with all 8 players correctly assigned

### Player Swap Tracking System (SZN 17)
- [ ] Create playerSwaps database table (player_id, swap_type, swap_date, old_player_name, new_player_name, notes)
- [ ] Create TRPC router for player swap operations (list, create, update, delete)
- [ ] Build admin UI page at /admin/player-swaps
- [ ] Add filtering by player name, swap type, date range
- [ ] Add search functionality for player names
- [ ] Import swap data from CSV file
- [ ] Add notes and flags functionality for swaps
- [ ] Test swap tracking page with real data

### Upgrade Compliance System
- [ ] Audit all existing upgrade-related database tables and identify purpose
- [ ] Audit all existing upgrade-related routes and pages
- [ ] Consolidate duplicate functionality into unified system
- [ ] Remove old/unused upgrade tables and functions


## Bot Management

### Bot Status Display
- [x] Fix Discord bot status showing offline in bot control page

### Bot Commands Display
- [ ] Consider removing or renaming Custom Commands page to reduce confusion

### Scheduled Bot Restarts
- [ ] Test scheduled restarts end-to-end

### Bot Health Alerts
- [ ] Test offline/error/recovery scenarios
- [ ] Verify alerts are sent to correct Discord channel

### Bot Instance Protection
- [x] Add safeguards to ensure only one Discord bot instance runs at a time

### Bot Control Critical Fixes (User Reported)
- [x] Fix bot not auto-restarting after crashes
- [x] Fix manual bot restart failing due to stale database lock
- [x] Improve lock acquisition logic to handle expired locks properly


## Archive (Completed Features)

### ✅ Fix Duplicate Player Entries
- All teams now have correct roster counts (14 players each)

### ✅ CSV Export System
- Admin CSV export page with customizable columns and filters

### ✅ Activity Booster Record Tracking
- !ab-records command implemented with standings and head-to-head logs
- Fixed HMR duplicate execution issues

### ✅ Help Command System
- !help command shows all bot commands with descriptions and examples

### ✅ Bot Control Features
- Self-service bot restart UI
- Bot activity logs viewer
- Scheduled restart configuration
- Health alert system

### ✅ Trade Processing
- Trade approval reaction handler
- Fixed trade processing hang issues (story generation non-blocking)
- Trade voting detection with !check-trade command

### ✅ FA Admin Consolidation
- Unified FA management dashboard
- Bid monitoring and winner determination
- Coin tracking and discrepancy fixes

### Bot Duplicate Posting Fix
- [x] Create database singleton lock table for bot instances
- [x] Implement singleton lock in bot startup
- [x] Remove all event listeners before destroying old client
- [x] Fix player name parsing to be case-insensitive in trade processing
- [x] Make ALL player lookups case-insensitive across entire codebase (trade-approval-handler, fa-window-close, upgrade-rules-validator, coins router, tradeLog router)
- [x] Fix remaining case sensitivity issues in player search (players router and any other remaining locations)

## FA Bid Monitoring

- [x] Change FA bid status alert frequency from hourly to every 6 hours

## Roster Card Display

- [x] Fix mobile roster card display - move overall and rookie badge to bottom banner
- [x] Update rookie badge to show simple gold "R" icon instead of full "Rookie" text
- [x] Fix player name text overflow in roster cards

## Team Channel Management

- [x] Grant admins full permissions to all team channels (read, write, edit message history, etc.)

## Trade Reversal Enhancement

- [x] Add !reverse-trade command for reversing trades by message ID (works for old messages)
- [x] Keep ⏪ reaction handler for new messages in cache
- [x] Verify confirmation message is posted after successful reversal

## Discord Bot Issues

- [x] Fix Discord bot not responding to commands (Cut ben saraf, Sign Pat Spencer bid 3)

## FA Window Winners Update

- [x] Research and gather most recent FA window winners data
- [x] Update database with latest FA signings and contract details
- [x] Create FA Winners page with filters and search
- [x] Add navigation to FA Winners from landing page
- [x] Verify all new player data is accurate
- [x] Test FA winners display on frontend

## Discord Bot FA Window Fix
- [x] Remove FA Winners page and route
- [x] Remove FA Winners navigation button from landing page
- [x] Drop faWindowSignings database table
- [x] Investigate Discord bot window-close summary logic
- [x] Fix bot to post window-close summary at end of FA windows
- [x] Manually trigger summary for most recent FA window

## Mobile Layout Improvements

- [x] Fix mobile player card layout - move ratings above names instead of on image
- [x] Reduce banner height on mobile
- [x] Simplify download options to only 4K PNG

## Mobile Layout Fix (Team Detail Page)

- [x] Remove team banner completely on mobile
- [x] Move rookie designation and rating above player name (not above picture) on mobile


## Roster Card Export Issues

- [x] Fix banner still visible in exported roster cards
- [x] Fix player names getting cut off in exported roster cards
- [x] Fix trade records not being saved to database during approval (causing "No trade record found" error when processing with ⚡)

## Trade Auto-Processing

- [x] Auto-process approved trades (7 👍 votes) without requiring ⚡ emoji reaction

## Discord Bot Startup Fix

- [x] Fix Discord bot startup failure (missing tsx dependency)
- [x] Ensure bot auto-restart functionality works correctly

## Trade Approval Critical Fixes (Dec 12, 2024)

- [x] Fix trade 1448866682893500436 not posting approval message despite 7-3 vote
- [x] Fix !check-trade command not returning results for valid trade IDs
- [x] Investigate why auto-approval at 7 votes isn't triggering message posts

- [ ] Fix automatic trade processing after approval - trade approved but players not moved to new teams (database connection timeout issue)
- [ ] Investigate why ⚡ emoji processing isn't working on approved trades (needs further debugging)

## FA Manual Bid Processing (Dec 13, 2024)

- [x] Fix ❗ emoji reaction not processing manual bids (root cause: bot crashing due to DB lock refresh failures)
- [x] Add better error logging for manual bid processing
- [x] Add error messages to Discord for debugging
- [ ] Verify user authorization check is working correctly
- [ ] Test manual bid recording with user 2kleague
- [x] Fix bid auto-confirmation not working after bid placement (root cause: bot crashing due to DB connection issues)
- [x] Fix manual confirmation command (!confirm-bid) not working (root cause: bot was offline/crashing)
- [x] Increase lock refresh failure tolerance from 3 to 10 to handle transient DB issues
- [x] Increase lock refresh failure tolerance from 10 to 30 to handle slow database connections
- [x] Increase lock refresh failure tolerance from 30 to 100 for maximum resilience
- [x] Add timeout handling (5s) for lock refresh queries to prevent hanging
- [x] Increase timeout from 5s to 10s for very slow database connections
- [x] Add better logging for lock refresh failures

## Discord Bot Manual Controls (Dec 13, 2024)

- [x] Fix manual bid controls not working (Cut, Sign, Bid buttons in Discord)

## Discord Trade Posting (Dec 13, 2024)

- [x] Fix Discord bot connection issue - "Post to Discord" feature shows "Discord bot is not connected"

## Discord Bot Crash Loop Fix (Dec 13, 2024)

- [x] Fix bot crash loop caused by lock refresh failures
- [x] Increase tolerance for transient lock refresh failures (don't exit on first 0 affected rows)
- [x] Improve lock refresh error handling to distinguish between transient and permanent failures
- [x] Add lock recreation logic when lock is missing from database
- [x] Handle race conditions in lock recreation (duplicate entry errors)
- [x] Add health check logging to track lock refresh status
- [x] Test bot stability under database latency conditions

## Discord Trade Posting Fix (Dec 13, 2024)

- [x] Debug and fix Discord bot posting error - "fetch failed" when posting trades (increased timeouts, improved error handling, made DB save non-blocking)

## Discord Bot Startup Fix (Dec 13, 2024 - Corepack Issue)

- [x] Fix Discord bot startup error - "Corepack is about to download https://registry.npmjs.org/pnpm/-/pnpm-10.25.0.tgz"

## Discord Bot Bid Recognition Bug (Dec 14, 2024)

- [x] Fix Discord bot bid recognition - bot failed to auto-recognize bid with format "Cut [Player]\nSign [Player]\nBid [Amount]"
- [x] Investigate why bot shows "No active bids at this time" for valid bid message
- [x] Test bid recognition with various message formats
- [x] Add helpful error message when users post bids in wrong channel

## Discord Bot Bid Processing Issues (Dec 14, 2024)

- [ ] Fix Discord bot not accepting bids (investigate why bid was not processed)
- [ ] Fix manual bid processing failure (❗ emoji reaction not working)
- [ ] Check if bot is properly connected and processing messages
- [ ] Verify bid recognition logic is working correctly
- [ ] Test end-to-end bid flow: recognition → confirmation → manual processing

## System Simplification (Dec 14, 2024)

### Remove Non-Essential Admin UI
- [x] Remove Bot Activity Dashboard page and route
- [x] Remove Bot Activity Logs page and route
- [x] Remove Scheduled Restarts page and route
- [x] Remove Badge Additions Tracking page and route
- [x] Remove Upgrade Log Dashboard page and route
- [x] Remove Validation Rules page and route
- [x] Remove Upgrade Compliance page and route
- [x] Remove Player Upgrade Progress page and route
- [x] Remove Upgrade Requests page and route
- [x] Remove Upgrade Management page and route
- [x] Remove Custom Commands page and route
- [x] Remove Welcome & Goodbye page and route
- [x] Remove Reaction Roles pages and routes
- [x] Remove Analytics page and route
- [x] Remove Server Logs page and route
- [x] Remove Player Swaps page and route
- [x] Remove Cap Compliance page and route
- [x] Remove Bulk Transactions page and route

### Simplify Discord Bot
- [ ] Remove activity booster system from bot
- [ ] Remove cap violation alerts from bot (keep salary cap auto-update posting)
- [ ] Remove health alerts system from bot
- [ ] Remove scheduled restarts from bot
- [ ] Remove welcome/goodbye messages from bot
- [ ] Remove custom commands system from bot
- [ ] Remove reaction roles from bot
- [ ] Simplify bot lock mechanism (keep basic stability lock)

### Clean Up Player Cards
- [x] Remove "Upgrades" button from player detail cards

### Database Cleanup
- [ ] Drop bot_logs table
- [ ] Drop scheduled_restarts table
- [ ] Drop health_alerts table
- [ ] Drop activity_records table
- [ ] Drop activity_head_to_head table
- [ ] Drop activity_checkpoint table
- [ ] Drop activity_conflicts table
- [ ] Drop player_swaps table
- [ ] Drop all upgrade-related tables

### API Cleanup
- [ ] Remove botActivity router
- [ ] Remove botLogs router
- [ ] Remove scheduledRestarts router
- [ ] Remove healthAlerts router
- [ ] Remove activityBooster router
- [ ] Remove upgrades router
- [ ] Remove playerSwaps router
- [ ] Remove capCompliance router

### Final Testing
- [ ] Test trade voting and approval
- [ ] Test trade auto-processing
- [ ] Test FA bidding process
- [ ] Create checkpoint after cleanup

## Discord Bot Trade Processing Bugs (Dec 14, 2024)

- [x] Fix trade 1449569426373349408 (Hawks/Rockets) - approved 7-0 but showing "No trade record found" error when processing
- [x] Fix trade auto-processing still failing - trades approved (7-0) but not being processed automatically (trade ID: 1449580331429662842)

- [x] Fix trade auto-processing not working - trades with 7+ yes votes are approved but not automatically processed (players not moved to new teams)
- [x] Investigate why handleApprovedTradeProcessing is not being called after trade approval
- [x] Test with stuck trades: 1449555431881048136, 1449555517377613844, 1449555550357557272
- [x] Verify bot is online and listening to reaction events
- [x] Check if trade-voting.ts processVoteResult is calling handleApprovedTradeProcessing correctly
- [x] Fix trade parser to handle multiple embed formats (PlayerNameOVR (salary), Player Name OVR (salary), Player Name (OVR) salary, Player Name OVR OVR (salary))
- [x] Fix team name parsing to avoid capturing "badges\nRaptors" as team name
- [x] Manually process all three stuck trades (Kings/Raptors: 4 players, Rockets/Pacers: 2 players, Jazz/Knicks: 4 players)

## Player Name Parsing Issues (Dec 14, 2024)

- [x] Fix fuzzy matching for player names with variations (Angelo Russell → D'Angelo Russell, Mohammed Bamba → Mohamed Bamba)
- [x] Improve alias system to handle Jr./Jr suffix variations (Derrick Jones Jr. → Derrick Jones Jr, Kelly Oubre Jr. → Kelly Oubre Jr)
- [ ] Add better handling for single letter names (R → proper player identification)
- [ ] Prevent duplicate "Could not find these players" warnings for the same trade
- [x] Process Kings-Raptors trade (Ben Sheppard, Kelly Olynyk → Raptors; Kyle Lowry, Day'Ron Sharpe → Kings)
- [x] Process Rockets-Pacers trade (Cam Thomas, Rasheer Fleming → Pacers; D'Angelo Russell, Mohammed Bamba → Rockets)
- [x] Process Jazz-Knicks trade (Lauri Markkanen, Scottie Barnes, Kelly Oubre Jr. → Knicks; Kawhi Leonard, Derrick Jones Jr., Kris Dunn → Jazz)

## Discord Bot Bid Processing Issues (Dec 14, 2024 - Part 2)

- [x] Fix Diawara bid not processing after manual activation with ❗ emoji (Duncan Robinson bid processed successfully, but Diawara bid stuck)
- [x] Fix reaction deduplication cache blocking retries after failures
- [x] Move cache addition to after successful processing for both ❗ and ⚡ handlers

## Trade Processing Fixes (Dec 15, 2024)

- [x] Fix player name parsing in trade processing to handle all player formats correctly
- [x] Skip placeholder entries ("--") in trade processing
- [x] Use fuzzy matching for player lookups in trade approval handler
- [x] Write and pass tests for fuzzy matching and placeholder handling
- [ ] Restart Discord bot to apply fixes
- [ ] Test trade processing with real Discord trade data (message ID: 1449814470850383884)

## Roster Auto-Update System (Dec 15, 2024)

- [x] Create scheduled task for daily roster cap status updates (check rosters, update overcap roles, post to Discord channel 1280019275679137865)
- [x] Verify auto-update runs daily and posts both part 1 and part 2 messages
- [x] Test overcap role assignment/removal based on roster totals

## Discord Bot Bid Window Scheduling (Dec 15, 2024)

- [x] Fix Discord bot not closing bid windows at 11:50 AM/PM EST daily
- [x] Fix bot not posting winning bids after window close
- [x] Fix bot not processing winning bids automatically
- [x] Investigate scheduling logic for bid window closure
- [x] Test bid window closure and winner determination flow

## FA Bid Auto-Processing (Dec 15, 2024)

- [x] Auto-process winning bids immediately after posting bid close message in free agent add/drop channel

## Discord Bot Trade Posting Fix (Dec 16, 2024)

- [x] Fix Discord bot "fetch failed" error when posting trades from web UI (now uses Discord API directly instead of bot HTTP endpoint)
- [x] Fix Discord bot "fetch failed" error still occurring when posting trades (requires publishing - sandbox code is already fixed)
