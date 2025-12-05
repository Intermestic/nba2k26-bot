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
- [ ] Test trade approval workflow end-to-end
- [ ] Test with the stuck Cavs/Trailblazers trade
- [ ] Verify no duplicate messages are posted

### Trade Voting System
- [ ] Test !check-trade command with message ID 1445268293186490548
- [ ] Verify future trades auto-approve at 7 votes


## Player Management

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

### Bot Commands Display
- [ ] Consider removing or renaming Custom Commands page to reduce confusion

### Scheduled Bot Restarts
- [ ] Test scheduled restarts end-to-end

### Bot Health Alerts
- [ ] Test offline/error/recovery scenarios
- [ ] Verify alerts are sent to correct Discord channel


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
