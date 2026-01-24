# Monitoring & Logging Setup

This guide explains how to monitor your bot on DigitalOcean and set up alerts.

## Table of Contents
1. [PM2 Monitoring](#pm2-monitoring)
2. [Log Management](#log-management)
3. [Alert Setup](#alert-setup)
4. [Health Checks](#health-checks)

---

## PM2 Monitoring

### View Bot Status

```bash
# Show process status
pm2 status

# Real-time monitoring dashboard
pm2 monit

# Show process details
pm2 describe nba2k26-bot

# Show all logs
pm2 logs nba2k26-bot

# Show last 100 lines
pm2 logs nba2k26-bot --lines 100

# Follow logs in real-time
pm2 logs nba2k26-bot --follow
```

### PM2 Plus (Free Tier)

Get a web dashboard for monitoring:

```bash
# Create free PM2 Plus account
pm2 plus

# Follow the link and create account
# Connect your Droplet
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# Verify connection
pm2 info nba2k26-bot
```

**Features:**
- Web dashboard
- Email alerts on crashes
- Performance metrics
- Log aggregation
- Restart history

---

## Log Management

### Log Locations

```bash
# Error logs
/var/log/nba2k26-bot/error.log

# Output logs
/var/log/nba2k26-bot/out.log

# PM2 logs
~/.pm2/logs/nba2k26-bot-*.log
```

### View Logs

```bash
# Last 50 lines of error log
tail -50 /var/log/nba2k26-bot/error.log

# Last 50 lines of output log
tail -50 /var/log/nba2k26-bot/out.log

# Follow error log in real-time
tail -f /var/log/nba2k26-bot/error.log

# Search for specific error
grep "ERROR" /var/log/nba2k26-bot/error.log

# Count errors
grep -c "ERROR" /var/log/nba2k26-bot/error.log

# Show errors from last hour
grep "ERROR" /var/log/nba2k26-bot/error.log | tail -100
```

### Rotate Logs (Prevent Disk Full)

Create `/etc/logrotate.d/nba2k26-bot`:

```bash
cat > /etc/logrotate.d/nba2k26-bot << 'EOF'
/var/log/nba2k26-bot/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0755 root root
    sharedscripts
    postrotate
        pm2 restart nba2k26-bot > /dev/null 2>&1 || true
    endscript
}
EOF
```

Test rotation:
```bash
logrotate -f /etc/logrotate.d/nba2k26-bot
```

---

## Alert Setup

### Email Alerts on Crash (PM2 Plus)

```bash
# Set up PM2 Plus (see above)
pm2 plus

# Go to pm2.io dashboard
# Settings → Notifications → Email
# Enable email alerts
```

### Discord Alerts (Using Built-in Health Check)

Your bot already has a `/health` command and hourly health reporting. To get Discord alerts:

1. **Manual check:** Run `/health` command in Discord
2. **Automatic reports:** Bot sends hourly health report to admin channel
3. **Custom alerts:** Modify `bot/services/healthReporter.ts` to send alerts on errors

### System-Level Alerts (Uptime Robot)

For external monitoring:

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free tier available)
3. Add monitor:
   - **Monitor Type:** HTTP(s)
   - **URL:** `http://YOUR_DROPLET_IP:3001/health`
   - **Check interval:** 5 minutes
   - **Alert contacts:** Email, Discord, Slack
4. Get alerts if bot goes down

---

## Health Checks

### Manual Health Check

```bash
# Check bot HTTP health endpoint
curl http://localhost:3001/health

# Should return JSON:
# {
#   "status": "healthy",
#   "uptime": 3600,
#   "discord": { "connected": true },
#   "database": { "connected": true },
#   "errors": []
# }
```

### Discord Health Command

In any Discord channel:
```
/health
```

Bot responds with embed showing:
- Status (healthy/degraded/offline)
- Uptime
- Discord connection
- Database connection
- Recent errors

### Automated Health Reporting

Bot sends hourly health report to admin channel automatically. Check:
```bash
# View health reporter logs
pm2 logs nba2k26-bot | grep -i health
```

---

## Troubleshooting

### Bot Crashed - Check Logs

```bash
# View crash details
tail -100 /var/log/nba2k26-bot/error.log

# Restart bot
pm2 restart nba2k26-bot

# Monitor restart
pm2 logs nba2k26-bot
```

### High Memory Usage

```bash
# Check memory
free -h

# Check bot memory
ps aux | grep "bot/index.js"

# Restart bot (will free memory)
pm2 restart nba2k26-bot

# Increase memory limit in ecosystem.config.js
# max_memory_restart: '1G'
```

### Disk Full

```bash
# Check disk usage
df -h

# Clean old logs
rm /var/log/nba2k26-bot/*.log.*

# Or use logrotate
logrotate -f /etc/logrotate.d/nba2k26-bot
```

### Database Connection Lost

```bash
# Check database
mysql -h localhost -u user -p -e "SELECT 1"

# Check DATABASE_URL
cat /opt/nba2k26-bot/.env | grep DATABASE_URL

# Restart bot
pm2 restart nba2k26-bot

# Check logs
pm2 logs nba2k26-bot | grep -i database
```

---

## Monitoring Checklist

- [ ] PM2 status shows bot is running
- [ ] No errors in `/var/log/nba2k26-bot/error.log`
- [ ] Health endpoint responds: `curl http://localhost:3001/health`
- [ ] Discord `/health` command works
- [ ] Hourly health reports appear in admin channel
- [ ] PM2 Plus connected (optional)
- [ ] Uptime Robot monitoring active (optional)
- [ ] Log rotation configured

---

## Quick Commands

| Task | Command |
|------|---------|
| Check status | `pm2 status` |
| View logs | `pm2 logs nba2k26-bot` |
| Restart bot | `pm2 restart nba2k26-bot` |
| Stop bot | `pm2 stop nba2k26-bot` |
| Start bot | `pm2 start ecosystem.config.js` |
| Health check | `curl http://localhost:3001/health` |
| Disk usage | `df -h` |
| Memory usage | `free -h` |
| Error logs | `tail -f /var/log/nba2k26-bot/error.log` |

---

**Next:** Follow [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) for complete setup.
