# Discord Bot Startup System - Simplified Architecture

## Overview

This document describes the new simplified Discord bot startup mechanism that replaces the complex database-based locking system with a straightforward file-based approach.

## Architecture

### Components

1. **bot-lock-manager.ts** - File-based lock manager
   - Simple lock file (`bot.lock`) to prevent multiple instances
   - 30-second lock timeout (stale locks are automatically cleared)
   - Minimal dependencies

2. **start-bot.mjs** - Bot startup script
   - Clears stale locks
   - Starts the bot process
   - Handles graceful shutdown
   - Manages lock file cleanup

3. **bot-health-monitor-v3.mjs** - Health monitoring
   - Checks bot status every 30 seconds
   - Monitors heartbeat (status file age)
   - Automatically restarts if bot goes offline
   - Simple, reliable restart logic

## How It Works

### Startup Flow

```
1. start-bot.mjs runs
   ↓
2. Checks for stale lock file (>2 min old)
   ↓
3. Clears old status file
   ↓
4. Spawns bot process (server/_core/index.ts)
   ↓
5. Bot acquires file-based lock
   ↓
6. Bot starts Discord connection
   ↓
7. Bot writes status file with `online: true`
   ↓
8. Health monitor detects bot is online
```

### Health Monitoring Flow

```
Every 30 seconds:
1. Check if status file exists
2. Check if status file is fresh (<2 min old)
3. Check if status.online === true
4. If any check fails, increment failure counter
5. After 3 consecutive failures, restart bot
```

### Lock Management

**File:** `bot.lock`

```json
{
  "instanceId": "abc123def",
  "pid": 12345,
  "acquiredAt": 1704067200000
}
```

- Lock is considered valid if age < 30 seconds
- Stale locks are automatically removed
- Only one bot instance can hold the lock

## Usage

### Starting the Bot

```bash
# Option 1: Direct startup
node start-bot.mjs

# Option 2: With PM2 (recommended for production)
pm2 start start-bot.mjs --name "discord-bot"

# Option 3: With health monitoring
node bot-health-monitor-v3.mjs &
node start-bot.mjs
```

### Health Monitoring

```bash
# Start health monitor (runs in background)
node bot-health-monitor-v3.mjs &

# Check bot status
cat bot-status.json

# View health monitor logs
tail -f /tmp/bot-health-monitor.log
```

### Stopping the Bot

```bash
# Graceful shutdown
kill -SIGTERM $(pgrep -f "start-bot.mjs")

# Force kill if needed
kill -9 $(pgrep -f "start-bot.mjs")
```

## Status File

**File:** `bot-status.json`

Updated every 30 seconds by the bot with:

```json
{
  "online": true,
  "username": "HOF 2K Manus Bot#0960",
  "userId": "1438996368587882672",
  "lastHeartbeat": "2025-12-31T12:46:50.445Z",
  "uptime": 269269,
  "ping": 317
}
```

The health monitor uses:
- **File existence** - Indicates bot has started
- **File age** - Heartbeat check (must be <2 min old)
- **online field** - Actual online status

## Troubleshooting

### Bot Won't Start

1. **Check lock file:**
   ```bash
   cat bot.lock
   ```
   If old, manually remove:
   ```bash
   rm bot.lock
   ```

2. **Check environment variables:**
   ```bash
   echo $DISCORD_BOT_TOKEN
   ```

3. **Check logs:**
   ```bash
   tail -f /tmp/bot.log
   ```

### Bot Keeps Restarting

1. **Check status file:**
   ```bash
   cat bot-status.json
   ```

2. **Check health monitor logs:**
   ```bash
   tail -f /tmp/bot-health-monitor.log
   ```

3. **Verify Discord connection:**
   - Check Discord token is valid
   - Check bot has required permissions in Discord server
   - Check network connectivity

### Multiple Instances Running

1. **Find all bot processes:**
   ```bash
   ps aux | grep -E "start-bot|discord-bot"
   ```

2. **Kill all instances:**
   ```bash
   killall node  # WARNING: kills all Node processes
   ```

3. **Clear lock file:**
   ```bash
   rm bot.lock
   ```

4. **Restart fresh:**
   ```bash
   node start-bot.mjs
   ```

## Key Improvements Over Previous System

| Feature | Old System | New System |
|---------|-----------|-----------|
| Lock Type | Database (complex) | File-based (simple) |
| Lock Timeout | 60s with refresh | 30s auto-clear |
| Lock Refresh | Every 30s (DB query) | Not needed (file-based) |
| Failure Tolerance | 200 attempts | 3 attempts |
| Restart Logic | Complex with backoff | Simple threshold |
| Dependencies | Database connection | File system only |
| Debugging | Hard to trace | Easy to read logs |
| Recovery Time | 2-5 minutes | 30-90 seconds |

## Configuration

Edit these constants in the respective files to adjust behavior:

**start-bot.mjs:**
- No configuration needed

**bot-health-monitor-v3.mjs:**
```javascript
const CHECK_INTERVAL = 30000;      // Check every 30 seconds
const HEARTBEAT_TIMEOUT = 120000;  // 2 minutes without update
const RESTART_COOLDOWN = 60000;    // 60 seconds between restarts
```

**bot-lock-manager.ts:**
```typescript
const LOCK_TIMEOUT = 30000; // 30 seconds - stale lock threshold
```

## Monitoring in Production

### Recommended Setup

1. **Start health monitor:**
   ```bash
   node bot-health-monitor-v3.mjs > /var/log/bot-health.log 2>&1 &
   ```

2. **Start bot:**
   ```bash
   node start-bot.mjs > /var/log/bot.log 2>&1 &
   ```

3. **Monitor status:**
   ```bash
   watch -n 5 'cat bot-status.json | jq .'
   ```

### Alerts

Monitor these files for issues:
- `bot-status.json` - Check `online` field and file age
- `bot.lock` - Should exist and be <30s old
- `/tmp/bot.log` - Check for errors
- `/tmp/bot-health-monitor.log` - Check restart history

## Future Improvements

- [ ] Persistent restart history
- [ ] Metrics/analytics integration
- [ ] Slack/Discord alerts on restart
- [ ] Automatic log rotation
- [ ] Performance metrics collection
- [ ] Graceful shutdown with message to Discord
