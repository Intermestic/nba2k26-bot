# Health Check Script Documentation

## Overview

`health_check.py` is a comprehensive Python script that verifies your Discord bot is **truly responsive**, not just returning HTTP 200. It goes beyond basic pings to validate:

- ✅ Health endpoint response structure
- ✅ Bot status (healthy/degraded/unhealthy)
- ✅ Error count thresholds
- ✅ Response time performance
- ✅ Web server availability

## Features

### Deep Health Validation

Unlike simple HTTP pings (like UptimeRobot), this script:

1. **Parses JSON response** - Validates the health endpoint returns proper data
2. **Checks bot status** - Ensures status is "healthy" or "degraded"
3. **Counts errors** - Alerts if error count exceeds threshold (5)
4. **Measures response time** - Warns if responses are slow (>5 seconds)
5. **Tests web server** - Verifies the full stack is operational

### Color-Coded Output

```
✓ HEALTHY   - Green (all checks passed)
⚠ DEGRADED  - Yellow (bot running but issues detected)
✗ UNHEALTHY - Red (bot offline or critical issues)
```

### Exit Codes

The script returns standard exit codes for automation:

| Exit Code | Status | Meaning |
|-----------|--------|---------|
| 0 | Success | Bot is healthy, all checks passed |
| 1 | Warning | Bot is degraded (web server down) |
| 2 | Error | Bot is unhealthy or offline |

## Usage

### Manual Execution

Run the script anytime to check bot health:

```bash
cd /home/ubuntu/nba2k26-database
python3 scripts/health_check.py
```

**Example Output:**
```
============================================================
NBA 2K26 Bot Health Check
Timestamp: 2026-01-26 10:06:39
============================================================

Checking bot health endpoint...

🏥 Health Endpoint
  Status: ✓ HEALTHY
  Uptime: 20m 53s
  Errors: 0
  Response Time: 4.42ms
  Message: Bot is healthy and responsive

Checking web server...

🌐 Web Server
  Status: ✓ ONLINE
  Response Time: 10.01ms

============================================================
✓ OVERALL STATUS: HEALTHY
  All checks passed
============================================================
```

### Automated Monitoring (Cron)

Schedule the script to run every 5 minutes and log results:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * cd /home/ubuntu/nba2k26-database && python3 scripts/health_check.py >> /home/ubuntu/health_check.log 2>&1
```

### Alert on Failure

Send email alerts when the bot is unhealthy:

```bash
#!/bin/bash
# save as: /home/ubuntu/check_and_alert.sh

cd /home/ubuntu/nba2k26-database
python3 scripts/health_check.py

if [ $? -ne 0 ]; then
    echo "NBA 2K26 Bot is unhealthy!" | mail -s "Bot Alert" your-email@example.com
fi
```

Then schedule it:
```bash
*/5 * * * * /home/ubuntu/check_and_alert.sh
```

## Configuration

Edit the script to customize thresholds:

```python
# Configuration (lines 17-21)
HEALTH_URL = "http://localhost:3001/health"
WEB_SERVER_URL = "http://localhost:3000"
TIMEOUT_SECONDS = 10
MAX_ERRORS_ALLOWED = 5
MIN_UPTIME_SECONDS = 60  # Currently disabled
```

### Adjustable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `HEALTH_URL` | `http://localhost:3001/health` | Bot health endpoint |
| `WEB_SERVER_URL` | `http://localhost:3000` | Main web server |
| `TIMEOUT_SECONDS` | 10 | Request timeout |
| `MAX_ERRORS_ALLOWED` | 5 | Error threshold before alerting |

## Integration with UptimeRobot

While UptimeRobot keeps the bot alive, this script provides **deeper validation**:

| Tool | Purpose | Frequency |
|------|---------|-----------|
| **UptimeRobot** | Keep sandbox awake | Every 5 min |
| **health_check.py** | Validate bot health | Every 5-15 min |
| **Internal Keep-Alive** | Self-ping | Every 5 min |

**Recommended Setup:**
1. UptimeRobot pings to keep bot alive
2. Run `health_check.py` via cron every 15 minutes
3. Log results for trend analysis
4. Alert on failures

## Troubleshooting

### "Connection refused - bot may be offline"

**Cause**: Bot is not running or health endpoint is down

**Solution**:
```bash
# Check if bot is running
ps aux | grep "bot/index.ts"

# Restart bot
cd /home/ubuntu/nba2k26-database
pkill -f "bot/index.ts"
nohup npx tsx bot/index.ts > bot.log 2>&1 &
```

### "Invalid JSON response"

**Cause**: Health endpoint is returning HTML or error page

**Solution**:
```bash
# Check health endpoint directly
curl http://localhost:3001/health

# Check bot logs
tail -50 /home/ubuntu/nba2k26-database/bot.log
```

### "Too many errors"

**Cause**: Bot has accumulated errors (database issues, Discord API errors, etc.)

**Solution**:
```bash
# Check bot logs for errors
tail -100 /home/ubuntu/nba2k26-database/bot.log | grep ERROR

# Restart bot to clear error count
pkill -f "bot/index.ts"
cd /home/ubuntu/nba2k26-database
nohup npx tsx bot/index.ts > bot.log 2>&1 &
```

## Advanced Usage

### Check from External Server

Run the script from another machine to test external accessibility:

```bash
# Modify HEALTH_URL to use public URL
HEALTH_URL="https://3000-ixlsa9j5rgdcmce27n8bj-f39263c0.us2.manus.computer/api/health"

python3 health_check.py
```

### JSON Output Mode

For programmatic parsing, redirect to JSON:

```python
# Add to main() function
import json

# After evaluation, print JSON instead
result_json = {
    "timestamp": datetime.now().isoformat(),
    "healthy": is_healthy,
    "health_endpoint": health_result,
    "web_server": web_result,
    "reason": reason
}
print(json.dumps(result_json, indent=2))
```

### Slack/Discord Notifications

Integrate with webhooks for instant alerts:

```python
import requests

def send_alert(message):
    webhook_url = "YOUR_WEBHOOK_URL"
    requests.post(webhook_url, json={"text": message})

# In main(), after evaluation:
if not is_healthy:
    send_alert(f"🚨 Bot Unhealthy: {reason}")
```

## Comparison: health_check.py vs UptimeRobot

| Feature | health_check.py | UptimeRobot |
|---------|----------------|-------------|
| **Validates JSON structure** | ✅ Yes | ❌ No (just HTTP 200) |
| **Checks error counts** | ✅ Yes | ❌ No |
| **Measures response time** | ✅ Yes | ✅ Yes |
| **Tests web server** | ✅ Yes | ❌ No (single endpoint) |
| **External wake-up** | ❌ No | ✅ Yes |
| **Email alerts** | ⚙️ Manual setup | ✅ Built-in |
| **Public status page** | ❌ No | ✅ Yes |

**Best Practice**: Use **both together**
- UptimeRobot keeps the bot alive
- health_check.py validates it's truly healthy

## Related Documentation

- [KEEP_ALIVE_SYSTEM.md](../KEEP_ALIVE_SYSTEM.md) - Internal keep-alive service
- [BOT_DEPLOYMENT_GUIDE.md](../BOT_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [MONITORING_SETUP.md](../MONITORING_SETUP.md) - Advanced monitoring

## Dependencies

The script requires Python 3.7+ and the `requests` library:

```bash
pip3 install requests
```

Or use the system Python (already has requests in most environments).
