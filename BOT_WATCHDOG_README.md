# Discord Bot Watchdog System

## Overview

The bot watchdog system ensures the Discord bot stays online 24/7 by automatically monitoring and restarting it when needed.

## Features

- **Automatic Crash Recovery**: Detects when the bot process dies and restarts it immediately
- **Scheduled Daily Restarts**: Performs a clean restart at 3:00 AM EST every day
- **Independent Operation**: Runs separately from the web server for maximum reliability
- **Comprehensive Logging**: All watchdog activity is logged to `logs/watchdog.log`

## How It Works

### Watchdog Script
Location: `/home/ubuntu/nba2k26-database/scripts/bot-watchdog.sh`

The watchdog script:
1. Checks every 60 seconds if the bot is running
2. If the bot crashes, it automatically restarts it
3. At 3:00 AM EST daily, it performs a scheduled restart
4. Logs all actions to `logs/watchdog.log`

### Database Connection Improvements
- Added retry logic with exponential backoff for database operations
- Prevents bot crashes from temporary database connection issues
- Automatically retries failed operations up to 3 times

## Monitoring

### Check Bot Status
```bash
# Check if bot is running
ps aux | grep bot-standalone | grep -v grep

# Check bot logs
tail -f /home/ubuntu/nba2k26-database/logs/bot.log

# Check watchdog logs
tail -f /home/ubuntu/nba2k26-database/logs/watchdog.log

# Check error logs
tail -f /home/ubuntu/nba2k26-database/logs/bot-error.log
```

### Check Watchdog Status
```bash
# Check if watchdog is running
ps aux | grep bot-watchdog | grep -v grep
```

## Manual Control

### Start Watchdog
```bash
cd /home/ubuntu/nba2k26-database
nohup ./scripts/bot-watchdog.sh > /dev/null 2>&1 &
```

### Stop Watchdog
```bash
# Kill watchdog process
pkill -f bot-watchdog

# Kill bot process
pkill -f bot-standalone
```

### Restart Bot Manually
```bash
# Stop bot
pkill -f bot-standalone

# Start bot
cd /home/ubuntu/nba2k26-database
pnpm run start:bot
```

## Log Files

All logs are stored in `/home/ubuntu/nba2k26-database/logs/`:

- **bot.log**: Normal bot activity and events
- **bot-error.log**: Error messages and stack traces
- **watchdog.log**: Watchdog monitoring and restart activity

## Scheduled Restart Time

The bot automatically restarts at **3:00 AM EST** every day. This:
- Clears memory leaks
- Applies any pending updates
- Ensures fresh database connections
- Only happens once per day (prevents multiple restarts)

## Troubleshooting

### Bot Not Starting
1. Check error logs: `tail -50 /home/ubuntu/nba2k26-database/logs/bot-error.log`
2. Verify DISCORD_BOT_TOKEN is set in environment
3. Check database connection: `echo $DATABASE_URL`

### Watchdog Not Working
1. Check if watchdog is running: `ps aux | grep bot-watchdog`
2. Check watchdog logs: `tail -50 /home/ubuntu/nba2k26-database/logs/watchdog.log`
3. Restart watchdog manually (see Manual Control section)

### Database Connection Errors
The bot now has retry logic for database operations. If you see `ECONNRESET` errors:
- They should automatically retry up to 3 times
- Check if database is accessible
- Verify DATABASE_URL is correct

## Architecture

```
┌─────────────────────┐
│  bot-watchdog.sh    │
│  (Monitor Process)  │
└──────────┬──────────┘
           │
           │ Monitors every 60s
           │ Restarts at 3 AM
           │
           ▼
┌─────────────────────┐
│  bot-standalone.ts  │
│  (Discord Bot)      │
└──────────┬──────────┘
           │
           │ Connects to
           │
           ▼
┌─────────────────────┐
│  MySQL Database     │
│  (with retry logic) │
└─────────────────────┘
```

## Notes

- The watchdog is designed to survive sandbox hibernation
- All times are in EST (America/New_York timezone)
- The bot will automatically recover from most crashes
- Manual intervention is rarely needed
