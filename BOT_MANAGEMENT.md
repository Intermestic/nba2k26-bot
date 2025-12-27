# Discord Bot Management Guide

## Overview

The Discord bot is now managed by PM2 (Process Manager 2) to ensure:
- **Single instance enforcement** - Only one bot runs at a time
- **Automatic restart on crashes** - Bot recovers automatically from errors
- **Persistent operation** - Bot stays online reliably
- **Easy management** - Simple commands to control the bot

## Quick Commands

All bot management is done through npm scripts:

```bash
# Start the bot (kills any existing instances first)
pnpm bot:start

# Stop the bot
pnpm bot:stop

# Restart the bot cleanly
pnpm bot:restart

# Check bot status
pnpm bot:status

# View live bot logs
pnpm bot:logs
```

## How It Works

### Process Management
- **PM2** manages the bot as a background process
- Automatically restarts on crashes (up to 10 times with 5s delay)
- Monitors memory usage (restarts if exceeds 512MB)
- Logs all output to `logs/bot-out.log` and `logs/bot-error.log`

### Instance Lock System
- Database-based singleton lock prevents multiple instances
- Lock expires after 60 seconds and is refreshed every 30 seconds
- If lock is lost, bot automatically exits and PM2 restarts it
- Handles database connection issues gracefully

### Error Recovery
- Catches uncaught exceptions and unhandled promise rejections
- Attempts graceful restart (up to 5 crashes in 5 minutes)
- If too many crashes, exits permanently to prevent infinite loops
- PM2 will restart the process after exit

## Monitoring

### Check Status
```bash
pnpm bot:status
```
Shows:
- Running bot processes
- PM2 status (uptime, restarts, memory usage)

### View Logs
```bash
# Live logs (Ctrl+C to exit)
pnpm bot:logs

# Last 50 lines
pnpm pm2 logs nba2k26-bot --lines 50 --nostream

# Error logs only
pnpm pm2 logs nba2k26-bot --err --nostream
```

### PM2 Dashboard
```bash
pnpm pm2 monit
```
Shows real-time CPU, memory, and log output.

## Troubleshooting

### Bot is offline
1. Check status: `pnpm bot:status`
2. View recent logs: `pnpm pm2 logs nba2k26-bot --lines 100 --nostream`
3. Restart: `pnpm bot:restart`

### Multiple instances running
The management script automatically kills all instances before starting:
```bash
pnpm bot:restart
```

### Bot keeps crashing
1. Check error logs: `pnpm pm2 logs nba2k26-bot --err --nostream`
2. Common issues:
   - Database connection problems (check DATABASE_URL)
   - Discord token invalid (check DISCORD_BOT_TOKEN)
   - Lock refresh failures (database timeout/connectivity)

### Clear PM2 logs
```bash
pnpm pm2 flush
```

### Reset PM2 completely
```bash
pnpm pm2 delete all
pnpm pm2 kill
pnpm bot:start
```

## Production Deployment

For production servers, PM2 can be configured to start on system boot:

```bash
# Save current PM2 process list
pnpm pm2 save

# Generate startup script (run as root)
pnpm pm2 startup

# Follow the instructions printed by the command
```

## Configuration

Bot configuration is in `ecosystem.config.cjs`:
- `instances: 1` - Only one bot instance
- `autorestart: true` - Auto-restart on crash
- `max_memory_restart: '512M'` - Restart if memory exceeds 512MB
- `max_restarts: 10` - Max restart attempts
- `restart_delay: 5000` - Wait 5s between restarts

## Files

- `server/bot-standalone.ts` - Bot entry point
- `server/discord-bot.ts` - Main bot logic with lock system
- `scripts/manage-bot.sh` - Management script
- `ecosystem.config.cjs` - PM2 configuration
- `logs/bot-out.log` - Standard output logs
- `logs/bot-error.log` - Error logs

## Architecture

```
PM2 Process Manager
  ↓
bot-standalone.ts (crash handler)
  ↓
discord-bot.ts (singleton lock + Discord.js client)
  ↓
Event handlers (trades, FA, commands, etc.)
```

The bot uses a **database singleton lock** to ensure only one instance processes Discord events at a time, preventing duplicate message processing and transaction conflicts.
