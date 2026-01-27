# NBA 2K26 Bot - Complete Deployment Guide

**Goal:** Deploy bot to DigitalOcean for 24/7 uptime with static webhook URL  
**Time Required:** 30-45 minutes  
**Cost:** $6/month  
**Difficulty:** Beginner-friendly

---

## Why Deploy to DigitalOcean?

| Feature | Manus Sandbox | DigitalOcean |
|---------|---------------|--------------|
| **Uptime** | 18-22 hours/day | 24/7 |
| **Webhook URL** | Changes on reset | Static (never changes) |
| **Auto-restart** | Manual after reset | Automatic |
| **Cost** | Free | $6/month |
| **Reliability** | Good for development | Production-ready |

**Bottom Line:** DigitalOcean solves the webhook URL problem permanently and gives you guaranteed 24/7 uptime.

---

## Prerequisites

Before starting, gather these items:

### 1. GitHub Account
- Sign up at [github.com](https://github.com) (free)
- You'll use this to host your bot code

### 2. DigitalOcean Account
- Sign up at [digitalocean.com](https://www.digitalocean.com)
- Add payment method (credit card)
- $6/month for basic droplet

### 3. Environment Variables
From your Manus project, export these values:

```bash
# Run in Manus terminal:
cd /home/ubuntu/nba2k26-database
cat .env
```

Copy all values - you'll need them later.

---

## Part 1: Push Code to GitHub (5 minutes)

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `nba2k26-bot`
3. **Visibility:** Private (recommended)
4. **DO NOT** initialize with README
5. Click **Create repository**

### Step 2: Push Code from Manus

In Manus terminal:

```bash
cd /home/ubuntu/nba2k26-database

# Add GitHub remote
git remote add github https://github.com/YOUR_USERNAME/nba2k26-bot.git

# Push code
git branch -M main
git push -u github main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Verify

- Go to your GitHub repository
- You should see all bot files
- Copy the repository URL for later

---

## Part 2: Create DigitalOcean Droplet (10 minutes)

### Step 1: Create Droplet

1. Log into [digitalocean.com](https://www.digitalocean.com)
2. Click **Create** → **Droplets**

### Step 2: Configure Droplet

**Choose an image:**
- Ubuntu 22.04 (LTS) x64

**Choose a plan:**
- Basic
- Regular
- $6/month - 1GB RAM, 1 vCPU, 25GB SSD

**Choose a datacenter region:**
- Select closest to your location
- Recommended: New York, San Francisco, or Toronto

**Authentication:**
- Choose **Password** (easier for beginners)
- Set a strong root password
- Save this password securely!

**Finalize details:**
- Hostname: `nba2k26-bot`
- Tags: (optional)

**Create Droplet:**
- Click **Create Droplet**
- Wait 2-3 minutes for it to boot

### Step 3: Get Droplet IP

- Copy your droplet's IP address (e.g., `164.90.123.456`)
- Save this - you'll need it multiple times

---

## Part 3: Deploy Bot to Droplet (15 minutes)

### Step 1: Connect to Droplet

**Option A: SSH (Mac/Linux)**
```bash
ssh root@YOUR_DROPLET_IP
# Enter password when prompted
```

**Option B: DigitalOcean Console (Any OS)**
1. Click on your droplet
2. Click **Console** tab
3. Click **Launch Droplet Console**
4. Login as `root` with your password

### Step 2: Clone Repository

```bash
# Create directory
mkdir -p /opt/nba2k26-bot
cd /opt/nba2k26-bot

# Clone your repository
git clone https://github.com/YOUR_USERNAME/nba2k26-bot.git .
```

Replace `YOUR_USERNAME` with your GitHub username.

If repository is private, you'll need to authenticate:
```bash
# Generate GitHub personal access token at:
# https://github.com/settings/tokens
# Then use it as password when prompted
```

### Step 3: Run Deployment Script

```bash
cd /opt/nba2k26-bot
bash deploy-to-digitalocean.sh
```

This script will:
- Install Node.js, pnpm, tsx, and PM2
- Install bot dependencies
- Create log directories
- Check for environment file

**The script will stop and ask you to create `.env` file.**

### Step 4: Create Environment File

```bash
nano /opt/nba2k26-bot/.env
```

Paste your environment variables from Manus (from Prerequisites step 3):

```env
DISCORD_BOT_TOKEN=your_token_here
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=your_name
VITE_APP_TITLE=NBA 2K26 Bot
VITE_APP_LOGO=logo_url
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
NODE_ENV=production
```

**Save and exit:**
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

### Step 5: Start Bot

```bash
# Run deployment script again
bash deploy-to-digitalocean.sh
```

This time it will:
- Start bot with PM2
- Configure auto-restart
- Setup auto-start on reboot
- Show bot status

### Step 6: Verify Bot is Running

```bash
pm2 status
```

Should show:
```
┌────┬──────────────┬─────────┬──────┬──────────┬─────────┬─────────┐
│ id │ name         │ mode    │ ↺    │ status   │ cpu     │ memory  │
├────┼──────────────┼─────────┼──────┼──────────┼─────────┼─────────┤
│ 0  │ nba2k26-bot  │ fork    │ 0    │ online   │ 0%      │ 85.0mb  │
└────┴──────────────┴─────────┴──────┴──────────┴─────────┴─────────┘
```

**Status should be `online`!**

### Step 7: Check Logs

```bash
pm2 logs nba2k26-bot --lines 50
```

Look for:
```
✅ Bot logged in as HOF 2K Manus Bot#0960
✅ HOFSN webhook server started
[HOFSN Server] Listening on port 3002
```

---

## Part 4: Configure Static Webhook URL (5 minutes)

### Step 1: Get Your Webhook URL

Your static webhook URL is:
```
http://YOUR_DROPLET_IP:3002/article
```

Example: `http://164.90.123.456:3002/article`

**This URL will NEVER change!**

### Step 2: Test Webhook

From your local machine (not the droplet):

```bash
curl -X POST http://YOUR_DROPLET_IP:3002/article \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Article","url":"https://example.com","imageUrl":"https://via.placeholder.com/600x400"}'
```

Should return:
```json
{"success":true,"message":"Article posted to Discord"}
```

Check your Discord HOFSN channel - you should see a test article!

### Step 3: Update HOFSN Configuration

1. Log into HOFSN admin panel
2. Navigate to webhook settings
3. Update webhook URL to: `http://YOUR_DROPLET_IP:3002/article`
4. Save configuration
5. Test by publishing an article in HOFSN

---

## Part 5: Configure Firewall (Optional but Recommended)

```bash
# Allow SSH
ufw allow OpenSSH

# Allow webhook port
ufw allow 3002/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Success Verification

### ✅ Bot Health Checks

Run these commands on your droplet:

```bash
# Check bot status
pm2 status
# Should show: online

# Check logs
pm2 logs nba2k26-bot --lines 20
# Should see no errors

# Test health endpoint
curl http://localhost:3002/health
# Should return: {"status":"ok","botReady":true}

# Test webhook
curl -X POST http://localhost:3002/article \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","url":"https://example.com","imageUrl":"https://via.placeholder.com/600x400"}'
# Should return: {"success":true}
```

### ✅ Discord Verification

- Bot shows as online in Discord
- Trade voting works
- FA bidding works
- HOFSN articles post automatically

---

## Useful Commands

### Bot Management
```bash
pm2 status                    # Check bot status
pm2 logs nba2k26-bot          # View live logs (Ctrl+C to exit)
pm2 restart nba2k26-bot       # Restart bot
pm2 stop nba2k26-bot          # Stop bot
pm2 delete nba2k26-bot        # Remove from PM2
pm2 monit                     # Resource monitoring
```

### Update Bot Code
```bash
cd /opt/nba2k26-bot
git pull origin main          # Pull latest code
pnpm install                  # Update dependencies
pm2 restart nba2k26-bot       # Restart with new code
```

### View Logs
```bash
# Live logs
pm2 logs nba2k26-bot

# Last 100 lines
pm2 logs nba2k26-bot --lines 100 --nostream

# Error logs only
tail -f /var/log/nba2k26-bot/error.log
```

---

## Monitoring Setup (Recommended)

### UptimeRobot Configuration

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free)
3. Click **Add New Monitor**
4. **Monitor Type:** HTTP(s)
5. **Friendly Name:** NBA 2K26 Bot
6. **URL:** `http://YOUR_DROPLET_IP:3001/health`
7. **Monitoring Interval:** 5 minutes
8. Click **Create Monitor**

You'll get email alerts if the bot goes down!

---

## Troubleshooting

### Bot won't start

```bash
# Check logs for errors
pm2 logs nba2k26-bot --lines 50

# Verify environment variables
cat /opt/nba2k26-bot/.env

# Check if Discord token is valid
# Check if database URL is correct

# Try restarting
pm2 restart nba2k26-bot
```

### Webhook not working

```bash
# Test locally on droplet
curl http://localhost:3002/health
# Should return: {"status":"ok","botReady":true}

# Check if port is open
netstat -tuln | grep 3002
# Should show: tcp6 ... :::3002 ... LISTEN

# Check firewall
ufw status
# Should show: 3002/tcp ALLOW
```

### Bot crashes repeatedly

```bash
# Check crash logs
pm2 logs nba2k26-bot --lines 100

# Common issues:
# - Invalid Discord token
# - Database connection failed
# - Missing environment variables
# - Out of memory (upgrade droplet)
```

### Can't connect to droplet

```bash
# Check if droplet is running in DigitalOcean dashboard
# Try console access instead of SSH
# Verify IP address is correct
# Check if firewall is blocking SSH (port 22)
```

---

## Cost Breakdown

| Item | Cost |
|------|------|
| **Droplet (1GB RAM)** | $6/month |
| **Bandwidth** | Included (1TB) |
| **Backups** | $1.20/month (optional) |
| **Total** | **$6-7/month** |

**Compare to alternatives:**
- Heroku: $7/month (hobby tier)
- Railway: $5/month + usage
- AWS EC2: $8-10/month
- Manus Sandbox: Free but unreliable

---

## Next Steps

### Immediate (First 24 hours)
- [ ] Monitor bot logs for errors
- [ ] Test all bot commands
- [ ] Verify HOFSN articles posting
- [ ] Set up UptimeRobot monitoring

### Short-term (First week)
- [ ] Configure automated backups
- [ ] Set up custom domain (optional)
- [ ] Enable SSL/HTTPS (optional)
- [ ] Document your setup

### Long-term
- [ ] Regular security updates: `apt update && apt upgrade`
- [ ] Monitor resource usage: `pm2 monit`
- [ ] Keep bot code updated: `git pull && pm2 restart`

---

## Support Resources

### DigitalOcean
- [Community Tutorials](https://www.digitalocean.com/community/tutorials)
- [Support Tickets](https://cloud.digitalocean.com/support/tickets)

### PM2
- [Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Common Issues](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)

### Bot Issues
- Check logs: `pm2 logs nba2k26-bot`
- Verify environment: `cat /opt/nba2k26-bot/.env`
- Test webhook: `curl http://localhost:3002/health`

---

## Congratulations! 🎉

Your bot is now running 24/7 on DigitalOcean with:

✅ Static webhook URL (never changes)  
✅ Automatic restart on crash  
✅ Auto-start on server reboot  
✅ Production-grade reliability  
✅ Full control over your infrastructure  

**Your webhook URL:** `http://YOUR_DROPLET_IP:3002/article`

Update this in HOFSN and you're done!

---

## Quick Reference Card

Save this for future reference:

```
Droplet IP: YOUR_DROPLET_IP
SSH: ssh root@YOUR_DROPLET_IP
Webhook URL: http://YOUR_DROPLET_IP:3002/article
Health Check: http://YOUR_DROPLET_IP:3001/health

Bot Status: pm2 status
View Logs: pm2 logs nba2k26-bot
Restart: pm2 restart nba2k26-bot
Update Code: cd /opt/nba2k26-bot && git pull && pm2 restart nba2k26-bot
```

---

**Need help?** Check the logs first: `pm2 logs nba2k26-bot --lines 100`
