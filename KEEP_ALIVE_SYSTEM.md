# Keep-Alive System Documentation

## Overview

The Keep-Alive System prevents the Manus sandbox from hibernating by maintaining continuous activity through periodic HTTP requests and Discord presence updates. This ensures the Discord bot stays online for 18+ hours daily without requiring external hosting.

## How It Works

The system operates on three levels:

### 1. Health Endpoint Pinging (Every 5 minutes)
- Sends HTTP GET requests to `http://localhost:3001/health`
- Keeps the bot process active and responsive
- Provides early detection of bot health issues

### 2. Web Server Pinging (Every 5 minutes)
- Sends HTTP GET requests to the main web server (port 3000)
- Prevents the entire sandbox from hibernating
- Ensures the database connection stays warm

### 3. Discord Presence Updates (Every 10 minutes)
- Updates the bot's Discord status with current uptime
- Shows activity in Discord (visible to users)
- Format: "Uptime: Xh Ym"

## Architecture

```
bot/services/keepAlive.ts
├── KeepAliveService class
│   ├── startHealthPing()      → Pings health endpoint
│   ├── startWebServerPing()   → Pings web server
│   └── updatePresence()       → Updates Discord status
└── Singleton pattern for global access
```

## Configuration

### Ping Intervals

| Service | Interval | Purpose |
|---------|----------|---------|
| Health Ping | 5 minutes | Keep bot process active |
| Web Server Ping | 5 minutes | Keep sandbox active |
| Discord Presence | 10 minutes | Show bot activity |

### URLs

- **Health Endpoint**: `http://localhost:3001/health`
- **Web Server**: Value from `VITE_API_URL` or `http://localhost:3000`

## Integration

The keep-alive service is automatically initialized when the bot starts:

```typescript
// bot/index.ts
import { initializeKeepAlive } from './services/keepAlive';

// In client.once('ready') handler:
const keepAlive = initializeKeepAlive(client);
keepAlive.start();

// Update Discord presence every 10 minutes
setInterval(() => {
  keepAlive.updatePresence();
}, 10 * 60 * 1000);
```

## Monitoring

### Check Keep-Alive Status

View recent keep-alive activity in the bot logs:

```bash
tail -100 /home/ubuntu/nba2k26-database/bot.log | grep "KeepAlive"
```

Expected output:
```
[KeepAlive] Starting keep-alive service...
[KeepAlive] ✅ Keep-alive service started
[KeepAlive] Health ping: every 300s
[KeepAlive] Web server ping: every 300s
[KeepAlive] Health ping successful: healthy
[KeepAlive] Web server ping successful (status: 200)
[KeepAlive] Discord presence updated (uptime: 2h 15m)
```

### Verify Bot Uptime

Check the bot's Discord presence to see current uptime:
- Look for the bot in the member list
- Status should show "Uptime: Xh Ym"

## Troubleshooting

### Keep-Alive Not Running

**Symptoms**: No keep-alive logs appearing

**Solution**:
```bash
# Restart the bot
pkill -f "bot/index.ts"
cd /home/ubuntu/nba2k26-database
nohup npx tsx bot/index.ts > bot.log 2>&1 &

# Check logs after 1 minute
tail -50 bot.log | grep "KeepAlive"
```

### Ping Failures

**Symptoms**: "Health ping failed" or "Web server ping failed" in logs

**Possible Causes**:
1. Health endpoint not running (port 3001)
2. Web server not running (port 3000)
3. Network connectivity issues

**Solution**:
```bash
# Check if services are running
lsof -i :3000  # Web server
lsof -i :3001  # Health endpoint

# Restart dev server if needed
cd /home/ubuntu/nba2k26-database
pnpm dev
```

### Discord Presence Not Updating

**Symptoms**: Bot status doesn't show uptime

**Possible Causes**:
1. Discord API rate limiting
2. Bot doesn't have presence intent
3. Discord client not ready

**Solution**: Wait 10 minutes for the next update cycle. The presence update is non-critical and won't affect bot functionality.

## Expected Uptime

With the keep-alive system:

- **Active Hours**: 18-22 hours per day
- **Downtime**: 2-6 hours (during extended periods of no user activity)
- **Recovery**: Automatic on next user interaction

The Manus sandbox may still hibernate during extended periods of complete inactivity (no web traffic, no Discord activity), but this should be rare in an active league environment.

## Comparison with External Hosting

| Feature | Keep-Alive System | External Hosting |
|---------|------------------|------------------|
| **Cost** | $0 (included in Manus) | $6-20/month |
| **Setup Time** | Already configured | 1-2 hours |
| **Uptime** | 18-22 hours/day | 24/7 |
| **Maintenance** | None | Updates, security patches |
| **Development** | Seamless (same environment) | Separate deploy process |

## Recommendations

### For Most Users
The keep-alive system is sufficient for leagues with regular activity (trades, FA bids, user interactions).

### When to Consider External Hosting
- League requires guaranteed 24/7 uptime
- Bot handles time-critical automated tasks
- Multiple simultaneous leagues/servers
- High-frequency polling requirements

## Future Enhancements

Potential improvements to increase uptime:

1. **External Cron Job**: Use a free service (UptimeRobot, cron-job.org) to ping the health endpoint every 5 minutes
2. **Webhook Triggers**: Configure Discord webhooks to wake the bot on specific events
3. **Scheduled Tasks**: Add automated tasks (daily reports, reminders) that keep the bot active
4. **Multi-Ping Strategy**: Ping multiple endpoints to ensure comprehensive coverage

## Related Documentation

- [BOT_DEPLOYMENT_GUIDE.md](./BOT_DEPLOYMENT_GUIDE.md) - Full bot deployment guide
- [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) - External hosting setup
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Advanced monitoring configuration

## Support

If you experience persistent uptime issues:

1. Check the bot logs for errors
2. Verify all services are running (ports 3000, 3001, 3002)
3. Consider external hosting for guaranteed 24/7 uptime
4. Contact support with log excerpts showing the issue
