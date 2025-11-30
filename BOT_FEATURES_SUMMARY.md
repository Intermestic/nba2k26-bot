# Bot Management Features - Implementation Summary

## Overview
This document summarizes the implementation status of three new bot management features requested by the user.

## 1. Bot Startup Fix ✅ COMPLETE

### Issue
Bot Control page showed "Failed to start bot: Failed to start bot. Bot process failed to start" error.

### Solution Implemented
- Modified `server/routers/botControl.ts` to redirect bot output to log files instead of ignoring stdio
- Created `logs/bot.log` and `logs/bot-error.log` for capturing bot output
- Increased startup wait time from 2s to 3s to allow proper initialization
- Added error log reading to provide detailed failure messages

### Result
Bot now starts successfully through the UI and shows proper status information (Online, PID, Uptime).

---

## 2. Bot Activity Logs ✅ MOSTLY COMPLETE

### What's Implemented

#### Database Schema
- Created `bot_logs` table with fields:
  - `level` (info, warn, error, debug)
  - `eventType` (command, error, discord_event, etc.)
  - `message`, `details`, `errorStack`
  - User/channel/guild context fields
  - `commandName` for command tracking
  - Timestamp

#### Backend (TRPC Router)
- File: `server/routers/botLogs.ts`
- Endpoints:
  - `getLogs` - Paginated log retrieval with filters
  - `getEventTypes` - Get unique event types for filter dropdown
  - `getStats` - Get log statistics (24h counts by level)
  - `deleteOldLogs` - Clean up old logs

#### Logging System
- File: `server/bot-logger.ts`
- Helper functions:
  - `logBotActivity()` - Generic logging
  - `logCommand()` - Log command execution
  - `logError()` - Log errors with stack traces
  - `logDiscordEvent()` - Log Discord events
  - `logWarning()` - Log warnings

#### Integration
- Added logging calls to `server/discord-bot.ts`:
  - Bot ready event
  - `!ab-records` command
  - `!sync-team-roles` command
- Registered router in `server/routers.ts`

#### Admin UI
- File: `client/src/pages/admin/BotLogs.tsx`
- Route: `/admin/bot-logs`
- Features:
  - Statistics cards (Total Logs, Errors 24h, Warnings 24h, Info 24h)
  - Filters: Level, Event Type, Search
  - Paginated log display with color-coded badges
  - Expandable details and stack traces
  - Delete old logs button
  - Added to Admin Dashboard navigation

### What Needs Testing
- Bot needs to be fully restarted (not just via UI) to load the new logging code
- Once restarted, logs should appear in the UI
- Additional commands can be instrumented with logging as needed

### Usage
1. Navigate to Admin Dashboard
2. Click "Bot Activity Logs" card
3. View logs with filters
4. Use search to find specific events

---

## 3. Scheduled Bot Restarts ⚠️ BACKEND COMPLETE, UI PENDING

### What's Implemented

#### Database Schema
- Created `scheduled_restarts` table:
  - `enabled`, `cronExpression`, `timezone`
  - `lastExecuted`, `nextExecution`
  - Timestamps
- Created `restart_history` table:
  - `restartType` (manual, scheduled, automatic)
  - `triggeredBy`, `success`, `errorMessage`
  - `uptime`, `createdAt`

#### Backend (TRPC Router)
- File: `server/routers/scheduledRestarts.ts`
- Features:
  - Cron-based scheduling using `node-cron`
  - Automatic bot restart execution
  - Restart history tracking
  - Timezone support
  - Human-readable cron expression parsing
- Endpoints:
  - `getSchedule` - Get current schedule configuration
  - `updateSchedule` - Update schedule (cron expression, timezone, enabled)
  - `getHistory` - Get restart history
  - `testRestart` - Manual test restart trigger
- Registered router in `server/routers.ts`

#### Restart Logic
- Graceful shutdown (SIGTERM) with fallback to force kill (SIGKILL)
- Proper process spawning with log file redirection
- Verification that bot started successfully
- Error handling and logging to database

### What Needs to be Built

#### Admin UI Page
Create `client/src/pages/admin/ScheduledRestarts.tsx` with:
1. **Current Schedule Card**
   - Display: Enabled/Disabled status
   - Display: Cron expression in human-readable format
   - Display: Next execution time
   - Display: Last execution time

2. **Schedule Configuration Form**
   - Enable/Disable toggle
   - Time picker (hour and minute)
   - Timezone selector (default: America/New_York)
   - Save button
   - Note: For simplicity, use daily restart format (0 HH * * *)

3. **Restart History Table**
   - Columns: Date/Time, Type (manual/scheduled), Status (success/failed), Error Message
   - Pagination
   - Last 20 restarts

4. **Test Restart Button**
   - Manual trigger for testing
   - Confirmation dialog
   - Success/error toast notification

#### Route Registration
- Add route in `client/src/App.tsx`: `/admin/scheduled-restarts`
- Add navigation card in `client/src/pages/AdminDashboard.tsx`

### Usage (Once UI is Built)
1. Navigate to Admin Dashboard
2. Click "Scheduled Restarts" card
3. Configure daily restart time
4. Enable schedule
5. View restart history

---

## 4. Bot Health Alerts ❌ NOT STARTED

### What's Implemented

#### Database Schema Only
- Created `health_alerts` table:
  - `enabled`, `alertChannelId`
  - `offlineAlertEnabled`, `errorAlertEnabled`
  - `errorThreshold`, `checkIntervalSeconds`
  - `lastHealthCheck`, timestamps
- Created `alert_history` table:
  - `alertType` (offline, error, recovery)
  - `message`, `details`, `discordMessageId`
  - `resolved`, `resolvedAt`, `createdAt`

### What Needs to be Built

#### Backend Components

1. **Health Monitor Service** (`server/bot-health-monitor.ts`)
   - Cron job to check bot status every N seconds
   - Check if bot process is running
   - Query bot_logs for recent errors
   - Track consecutive failures
   - Trigger alerts based on thresholds

2. **Alert Service** (`server/bot-alert-service.ts`)
   - Send Discord messages to alert channel
   - Log alerts to alert_history table
   - Handle alert resolution (bot comes back online)
   - Prevent duplicate alerts

3. **TRPC Router** (`server/routers/healthAlerts.ts`)
   - `getConfig` - Get alert configuration
   - `updateConfig` - Update alert settings
   - `getAlertHistory` - Get recent alerts
   - `testAlert` - Send test alert
   - `resolveAlert` - Mark alert as resolved

4. **Integration**
   - Register router in `server/routers.ts`
   - Start health monitor on server startup
   - Integrate with bot_logs for error tracking

#### Admin UI Page

Create `client/src/pages/admin/HealthAlerts.tsx` with:

1. **Alert Configuration Card**
   - Enable/Disable master toggle
   - Alert channel ID input (Discord channel)
   - Offline alert toggle
   - Error alert toggle
   - Error threshold input (number of errors before alert)
   - Check interval input (seconds)
   - Save button

2. **Alert Status Card**
   - Current bot status (Online/Offline)
   - Last health check time
   - Recent error count
   - Active alerts count

3. **Alert History Table**
   - Columns: Date/Time, Type, Message, Status (active/resolved)
   - Resolve button for active alerts
   - Pagination

4. **Test Alert Button**
   - Send test alert to configured channel
   - Verify configuration

#### Route Registration
- Add route in `client/src/App.tsx`: `/admin/health-alerts`
- Add navigation card in `client/src/pages/AdminDashboard.tsx`

### Implementation Steps
1. Create health monitor service with cron job
2. Create alert service for Discord messaging
3. Create TRPC router with endpoints
4. Build admin UI page
5. Test offline detection
6. Test error threshold alerts
7. Test alert resolution

---

## Files Created/Modified

### New Files
- `server/routers/botLogs.ts` - Bot logs TRPC router
- `server/bot-logger.ts` - Logging utility functions
- `client/src/pages/admin/BotLogs.tsx` - Bot logs UI
- `server/routers/scheduledRestarts.ts` - Scheduled restarts TRPC router
- `BOT_FEATURES_SUMMARY.md` - This file

### Modified Files
- `server/routers/botControl.ts` - Fixed bot startup with logging
- `server/discord-bot.ts` - Added logging integration
- `server/routers.ts` - Registered new routers
- `client/src/App.tsx` - Added bot logs route
- `client/src/pages/AdminDashboard.tsx` - Added bot logs navigation
- `drizzle/schema.ts` - Added new database tables
- `todo.md` - Updated task status

### Database Tables Created
- `bot_logs` - Activity log entries
- `scheduled_restarts` - Restart schedule configuration
- `restart_history` - Restart execution history
- `health_alerts` - Alert configuration
- `alert_history` - Alert event history

---

## Next Steps

### Priority 1: Complete Scheduled Restarts UI
1. Create `client/src/pages/admin/ScheduledRestarts.tsx`
2. Add route and navigation
3. Test end-to-end functionality

### Priority 2: Implement Health Alerts
1. Create health monitor service
2. Create alert service
3. Create TRPC router
4. Build admin UI
5. Test all alert scenarios

### Priority 3: Enhance Bot Logs
1. Restart bot to activate logging
2. Add logging to more commands
3. Add log export functionality
4. Add log filtering by date range

---

## Testing Checklist

### Bot Startup Fix
- [x] Bot starts successfully via UI
- [x] Status shows Online with PID and uptime
- [x] Error logs are captured and displayed on failure

### Bot Activity Logs
- [ ] Restart bot to load logging code
- [ ] Verify logs appear in UI
- [ ] Test all filters (level, event type, search)
- [ ] Test pagination
- [ ] Test delete old logs

### Scheduled Restarts
- [ ] Build UI page
- [ ] Configure daily restart time
- [ ] Enable schedule
- [ ] Wait for scheduled restart to execute
- [ ] Verify bot restarts automatically
- [ ] Check restart history

### Health Alerts
- [ ] Implement all backend components
- [ ] Build UI page
- [ ] Configure alert channel
- [ ] Test offline detection (stop bot manually)
- [ ] Test error threshold alerts
- [ ] Test alert resolution
- [ ] Verify Discord notifications

---

## Notes

- All database tables are created via direct SQL (not Drizzle migrations)
- The bot runs in a standalone process separate from the web server
- Logging requires bot restart to take effect
- Scheduled restarts use node-cron for reliability
- Health monitoring should run in the web server process, not the bot process
- Consider adding email alerts in addition to Discord notifications
- Consider adding Slack/webhook integration for alerts
