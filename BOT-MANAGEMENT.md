# Discord Bot Management Guide

The Discord bot is now managed by **PM2** (Process Manager 2) for automatic restarts and 24/7 uptime.

## Quick Commands

### Check Bot Status
```bash
pm2 status
```

### View Bot Logs (Live)
```bash
pm2 logs nba2k26-bot
```

### View Last 100 Lines of Logs
```bash
pm2 logs nba2k26-bot --lines 100 --nostream
```

### Restart Bot
```bash
pm2 restart nba2k26-bot
```

### Stop Bot
```bash
pm2 stop nba2k26-bot
```

### Start Bot
```bash
pm2 start nba2k26-bot
```

### Restart Bot After Code Changes
```bash
cd /home/ubuntu/nba2k26-database
pnpm run build
pm2 restart nba2k26-bot
```

## Features

✅ **Auto-restart on crash**: If the bot crashes, PM2 will automatically restart it within 4 seconds

✅ **Memory monitoring**: Bot will restart if it uses more than 512MB of memory

✅ **Startup on reboot**: Bot will automatically start when the server reboots

✅ **Centralized logging**: All logs are saved to `logs/bot-out.log` and `logs/bot-error.log`

✅ **Single instance**: PM2 ensures only one bot instance runs at a time (fixes lock conflicts)

## Troubleshooting

### Bot Not Responding?
1. Check status: `pm2 status`
2. Check logs: `pm2 logs nba2k26-bot --lines 50`
3. Restart: `pm2 restart nba2k26-bot`

### After Making Code Changes
Always rebuild and restart:
```bash
cd /home/ubuntu/nba2k26-database
pnpm run build
pm2 restart nba2k26-bot
```

### View PM2 Dashboard
```bash
pm2 monit
```

## Configuration

Bot configuration is in `ecosystem.config.cjs`:
- Auto-restart: enabled
- Max memory: 512MB
- Restart delay: 5 seconds
- Max restarts: 10 (in 1 minute)

## Manual Trade Check Command

If a trade with 7+ votes didn't process automatically, use this Discord command in the trade channel:
```
!check-trade <messageId>
```

Example:
```
!check-trade 1452783686054580348
```
