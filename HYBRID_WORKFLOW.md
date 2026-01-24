# Hybrid Development & Deployment Workflow

This document explains how to work with both Manus (development) and DigitalOcean (production) simultaneously.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Development                         │
│                   (Manus Environment)                        │
│                                                              │
│  - Edit code in Manus IDE                                   │
│  - Test locally with npm run dev                            │
│  - Commit to Git                                            │
│  - Push to GitHub                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ git push github main
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                  (Code Storage & Sync)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ git pull origin main
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DigitalOcean Production Server                  │
│                  (24/7 Bot Running)                          │
│                                                              │
│  - Bot runs continuously with PM2                           │
│  - Auto-restarts on crash                                   │
│  - Logs stored in /var/log/nba2k26-bot/                     │
│  - Health monitoring active                                 │
│  - Discord alerts on issues                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Daily Workflow

### 1. Development (In Manus)

```bash
# Make changes to bot code
cd /home/ubuntu/nba2k26-database

# Test locally (optional)
npm run dev

# Commit changes
git add .
git commit -m "Feature: [description of changes]"

# Push to GitHub
git push github main
```

### 2. Deployment (On DigitalOcean Droplet)

```bash
# SSH into your Droplet
ssh root@YOUR_DROPLET_IP

# Deploy with one command
cd /opt/nba2k26-bot
./deploy.sh

# Or manually:
git pull origin main
npm install
npm run build
pm2 restart nba2k26-bot
```

### 3. Verify Deployment

```bash
# Check status
pm2 status

# View logs
pm2 logs nba2k26-bot --lines 50

# Test health
curl http://localhost:3001/health

# Test in Discord
/health
```

---

## File Structure

### Manus Project (`/home/ubuntu/nba2k26-database/`)
```
├── bot/                          # Bot source code
│   ├── index.ts                 # Entry point
│   ├── commands/                # Discord commands
│   ├── handlers/                # Event handlers
│   ├── services/                # Business logic
│   └── config.ts                # Configuration
├── client/                       # Web dashboard (optional)
├── server/                       # API server (optional)
├── drizzle/                      # Database schema
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── ecosystem.config.js           # PM2 config (copy to Droplet)
├── deploy.sh                     # Deployment script (copy to Droplet)
├── DIGITALOCEAN_DEPLOYMENT.md   # Setup guide
├── GITHUB_SETUP.md              # GitHub guide
├── MONITORING_SETUP.md          # Monitoring guide
└── DEPLOYMENT_QUICKSTART.md     # Quick start guide
```

### DigitalOcean Droplet (`/opt/nba2k26-bot/`)
```
├── dist/                         # Compiled JavaScript
│   └── bot/index.js             # Compiled bot entry point
├── node_modules/                # Installed dependencies
├── .env                         # Environment variables (NOT in git)
├── ecosystem.config.js          # PM2 configuration
├── deploy.sh                    # Deployment script
├── package.json                 # Same as Manus
└── [all other project files]
```

---

## Environment Variables

### Manus (.env in project root)
```
DISCORD_BOT_TOKEN=your_token
DATABASE_URL=mysql://...
JWT_SECRET=...
[other vars]
```

### DigitalOcean (/opt/nba2k26-bot/.env)
**Same as Manus** - Copy from Manus or set manually

**Important:** Never commit `.env` to GitHub. It's in `.gitignore`.

---

## Git Workflow

### Branch Strategy (Optional but Recommended)

```bash
# Main branch = production
# develop branch = staging
# feature/* branches = development

# Create feature branch
git checkout -b feature/new-command

# Make changes and commit
git add .
git commit -m "Add new command"

# Push to GitHub
git push github feature/new-command

# Create pull request on GitHub
# After review, merge to main

# Deploy to production
./deploy.sh
```

---

## Deployment Scenarios

### Scenario 1: Small Bug Fix

```bash
# In Manus
cd /home/ubuntu/nba2k26-database
git add .
git commit -m "Fix: database connection issue"
git push github main

# On Droplet
cd /opt/nba2k26-bot
./deploy.sh
```

### Scenario 2: Major Feature

```bash
# In Manus
git checkout -b feature/new-trading-system
# ... make changes ...
git push github feature/new-trading-system

# Create PR on GitHub, review, merge to main

# On Droplet
cd /opt/nba2k26-bot
./deploy.sh
```

### Scenario 3: Emergency Rollback

```bash
# On Droplet
cd /opt/nba2k26-bot

# See commit history
git log --oneline

# Revert to previous version
git revert HEAD
npm run build
pm2 restart nba2k26-bot

# Or reset to specific commit
git reset --hard abc123def456
npm run build
pm2 restart nba2k26-bot
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# SSH into Droplet
ssh root@YOUR_DROPLET_IP

# Check bot status
pm2 status

# Check recent errors
tail -50 /var/log/nba2k26-bot/error.log

# Check disk usage
df -h

# Check memory
free -h
```

### Weekly Tasks

```bash
# Review logs for patterns
grep ERROR /var/log/nba2k26-bot/error.log | wc -l

# Check for updates
apt update && apt upgrade -y

# Backup database
mysqldump -u user -p nba2k26 > /root/backup-$(date +%Y%m%d).sql

# Backup bot directory
tar -czf /root/bot-backup-$(date +%Y%m%d).tar.gz /opt/nba2k26-bot
```

### Monthly Tasks

```bash
# Review and archive old logs
logrotate -f /etc/logrotate.d/nba2k26-bot

# Check DigitalOcean billing
# Go to digitalocean.com/account/billing

# Update dependencies
npm outdated
npm update
git commit -m "Update dependencies"
git push github main
./deploy.sh
```

---

## Troubleshooting

### Bot Offline on Droplet

```bash
# SSH into Droplet
ssh root@YOUR_DROPLET_IP

# Check status
pm2 status

# If offline, check logs
pm2 logs nba2k26-bot

# Restart
pm2 restart nba2k26-bot

# Check again
pm2 status
```

### Deployment Failed

```bash
# Check what went wrong
pm2 logs nba2k26-bot --lines 100

# Common issues:
# 1. Database connection error - check DATABASE_URL in .env
# 2. Missing dependencies - run npm install
# 3. Build error - check TypeScript errors in npm run build
# 4. Port in use - check lsof -i :3001

# Rollback to previous version
git reset --hard HEAD~1
npm run build
pm2 restart nba2k26-bot
```

### Memory Issues

```bash
# Check memory usage
free -h

# Check bot memory
ps aux | grep "bot/index.js"

# Restart bot (frees memory)
pm2 restart nba2k26-bot

# If recurring, increase memory limit in ecosystem.config.js
# max_memory_restart: '1G'
```

---

## Best Practices

### Code Changes
- ✅ Always test locally first in Manus
- ✅ Commit with clear messages
- ✅ Push to GitHub before deploying
- ✅ Review changes before deployment

### Deployment
- ✅ Deploy during off-peak hours if possible
- ✅ Check logs after deployment
- ✅ Have rollback plan ready
- ✅ Test in Discord after deployment

### Monitoring
- ✅ Check logs regularly
- ✅ Set up alerts (PM2 Plus, Uptime Robot)
- ✅ Monitor disk/memory usage
- ✅ Backup database weekly

### Security
- ✅ Never commit `.env` to GitHub
- ✅ Use SSH keys for GitHub access
- ✅ Keep Droplet updated
- ✅ Use strong passwords
- ✅ Enable firewall on Droplet

---

## Quick Reference

| Task | Command |
|------|---------|
| **Development** | |
| Make changes | Edit files in Manus |
| Test locally | `npm run dev` |
| Commit | `git commit -m "message"` |
| Push to GitHub | `git push github main` |
| **Deployment** | |
| SSH to Droplet | `ssh root@YOUR_DROPLET_IP` |
| Deploy | `cd /opt/nba2k26-bot && ./deploy.sh` |
| Check status | `pm2 status` |
| View logs | `pm2 logs nba2k26-bot` |
| Restart | `pm2 restart nba2k26-bot` |
| **Monitoring** | |
| Health check | `curl http://localhost:3001/health` |
| Discord command | `/health` |
| Error logs | `tail -f /var/log/nba2k26-bot/error.log` |
| Disk usage | `df -h` |
| Memory usage | `free -h` |

---

## Support Resources

- [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) - Quick start guide
- [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) - Full setup guide
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub configuration
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Monitoring & alerts
- [ecosystem.config.js](./ecosystem.config.js) - PM2 configuration
- [deploy.sh](./deploy.sh) - Deployment script

---

## Summary

Your hybrid workflow:
1. **Develop** in Manus with full IDE support
2. **Push** code to GitHub
3. **Deploy** to DigitalOcean with one command
4. **Monitor** bot health in Discord and via logs
5. **Iterate** - repeat daily

**Result:** 24/7 bot running on production, easy development in Manus, simple deployments. 🚀
