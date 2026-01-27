# DigitalOcean Deployment Checklist

**Estimated Time:** 30-45 minutes  
**Cost:** $6/month (Basic Droplet)  
**Result:** 24/7 bot uptime with static webhook URL

---

## Pre-Deployment Checklist

### ✅ Information to Gather

Before starting deployment, collect these values:

- [ ] **Discord Bot Token** (from Discord Developer Portal)
- [ ] **Database Connection String** (MySQL/TiDB from Manus or external)
- [ ] **GitHub Account** (for code repository)
- [ ] **DigitalOcean Account** (create at digitalocean.com)
- [ ] **Domain Name** (optional, for custom webhook URL)

### ✅ Manus Project Information

Export these from your Manus project environment variables:

```bash
# Run this in Manus terminal to see all env vars:
cd /home/ubuntu/nba2k26-database
cat .env
```

Copy these values:
- [ ] `DISCORD_BOT_TOKEN`
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `VITE_APP_ID`
- [ ] `OWNER_OPEN_ID`
- [ ] `OWNER_NAME`
- [ ] `BUILT_IN_FORGE_API_KEY`
- [ ] `VITE_FRONTEND_FORGE_API_KEY`

---

## Phase 1: GitHub Setup (5 minutes)

### Push Code to GitHub

- [ ] Create new GitHub repository: `nba2k26-bot`
- [ ] Make repository private (recommended)
- [ ] Push code from Manus:

```bash
cd /home/ubuntu/nba2k26-database
git remote add github https://github.com/YOUR_USERNAME/nba2k26-bot.git
git branch -M main
git push -u github main
```

- [ ] Verify code is on GitHub
- [ ] Note repository URL for later

---

## Phase 2: DigitalOcean Setup (10 minutes)

### Create Droplet

- [ ] Go to [digitalocean.com](https://www.digitalocean.com)
- [ ] Sign up / Log in
- [ ] Click **Create** → **Droplets**
- [ ] **Image:** Ubuntu 22.04 (LTS)
- [ ] **Plan:** Basic - $6/month (1GB RAM, 1 vCPU, 25GB SSD)
- [ ] **Region:** Choose closest to your location
- [ ] **Authentication:** SSH key (recommended) or password
- [ ] **Hostname:** `nba2k26-bot`
- [ ] Click **Create Droplet**
- [ ] Wait 2-3 minutes for droplet to boot
- [ ] **Copy Droplet IP Address** (e.g., `164.90.xxx.xxx`)

---

## Phase 3: Server Configuration (10 minutes)

### Connect to Droplet

- [ ] SSH into droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

### Install Dependencies

- [ ] Update system:
```bash
apt update && apt upgrade -y
```

- [ ] Install Node.js 22:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs
node --version  # Should show v22.x.x
```

- [ ] Install PM2:
```bash
npm install -g pm2
pm2 --version
```

- [ ] Install Git:
```bash
apt install -y git
```

- [ ] Install pnpm:
```bash
npm install -g pnpm
```

- [ ] Install tsx globally:
```bash
pnpm add -g tsx
```

---

## Phase 4: Bot Deployment (10 minutes)

### Clone and Setup

- [ ] Create bot directory:
```bash
mkdir -p /opt/nba2k26-bot
cd /opt/nba2k26-bot
```

- [ ] Clone repository:
```bash
git clone https://github.com/YOUR_USERNAME/nba2k26-bot.git .
```

- [ ] Install dependencies:
```bash
pnpm install
```

### Configure Environment

- [ ] Create `.env` file:
```bash
nano /opt/nba2k26-bot/.env
```

- [ ] Paste environment variables (from Phase 1):
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

- [ ] Save and exit (Ctrl+X, Y, Enter)

---

## Phase 5: Start Bot (5 minutes)

### Launch with PM2

- [ ] Create log directory:
```bash
mkdir -p /var/log/nba2k26-bot
chmod 755 /var/log/nba2k26-bot
```

- [ ] Start bot:
```bash
cd /opt/nba2k26-bot
pm2 start bot/index.ts --name nba2k26-bot --interpreter npx --interpreter-args tsx
```

- [ ] Check status:
```bash
pm2 status
# Should show: online
```

- [ ] View logs:
```bash
pm2 logs nba2k26-bot --lines 50
# Should see: "Bot logged in as..."
```

- [ ] Save PM2 configuration:
```bash
pm2 save
```

- [ ] Enable auto-start on reboot:
```bash
pm2 startup
# Copy and run the command it outputs
pm2 save
```

---

## Phase 6: Configure Webhook URL (5 minutes)

### Get Static Webhook URL

Your bot's webhook URL is now:
```
http://YOUR_DROPLET_IP:3002/article
```

Example: `http://164.90.123.456:3002/article`

### Update HOFSN Configuration

- [ ] Log into HOFSN admin panel
- [ ] Navigate to webhook settings
- [ ] Update webhook URL to: `http://YOUR_DROPLET_IP:3002/article`
- [ ] Save configuration

### Test Webhook

- [ ] Test from your local machine:
```bash
curl -X POST http://YOUR_DROPLET_IP:3002/article \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Article","url":"https://example.com","imageUrl":"https://via.placeholder.com/600x400"}'
```

- [ ] Should return: `{"success":true,"message":"Article posted to Discord"}`
- [ ] Check Discord for test article in HOFSN channel

---

## Phase 7: Firewall Setup (Optional but Recommended)

### Configure UFW Firewall

- [ ] Enable firewall:
```bash
ufw allow OpenSSH
ufw allow 3002/tcp
ufw enable
ufw status
```

---

## Post-Deployment Verification

### ✅ Bot Health Checks

- [ ] Bot shows as online in Discord
- [ ] PM2 status shows `online`
- [ ] Logs show no errors
- [ ] Webhook test successful
- [ ] Trade voting works
- [ ] FA bidding works
- [ ] HOFSN articles posting correctly

### ✅ Monitoring Setup

- [ ] Set up UptimeRobot to ping: `http://YOUR_DROPLET_IP:3001/health`
- [ ] Configure email alerts for downtime
- [ ] Bookmark PM2 commands for future use

---

## Useful Commands Reference

### Bot Management
```bash
pm2 status                    # Check bot status
pm2 logs nba2k26-bot          # View live logs
pm2 restart nba2k26-bot       # Restart bot
pm2 stop nba2k26-bot          # Stop bot
pm2 delete nba2k26-bot        # Remove from PM2
pm2 monit                     # Resource monitoring
```

### Updates
```bash
cd /opt/nba2k26-bot
git pull origin main          # Pull latest code
pnpm install                  # Update dependencies
pm2 restart nba2k26-bot       # Restart with new code
```

### Logs
```bash
pm2 logs nba2k26-bot --lines 100    # Last 100 lines
tail -f /var/log/nba2k26-bot/out.log  # Live output
tail -f /var/log/nba2k26-bot/error.log # Live errors
```

---

## Troubleshooting

### Bot won't start
```bash
pm2 logs nba2k26-bot --lines 50  # Check error logs
cd /opt/nba2k26-bot
cat .env  # Verify environment variables
```

### Webhook not working
```bash
# Test locally on droplet
curl http://localhost:3002/health
# Should return: {"status":"ok","botReady":true}

# Check if port is open
netstat -tuln | grep 3002
```

### Bot crashes repeatedly
```bash
pm2 logs nba2k26-bot --lines 100  # Check crash reason
pm2 restart nba2k26-bot           # Try restart
```

---

## Success Criteria

✅ Bot online 24/7  
✅ Webhook URL static (never changes)  
✅ Auto-restart on crash  
✅ Auto-start on server reboot  
✅ HOFSN articles posting automatically  
✅ All bot commands working  
✅ Monitoring alerts configured  

**Congratulations! Your bot is now production-ready! 🎉**

---

## Next Steps

1. **Monitor for 24 hours** - Ensure stability
2. **Set up backups** - Regular database backups
3. **Document your droplet IP** - Save for future reference
4. **Configure domain** (optional) - Point custom domain to droplet
5. **Set up SSL** (optional) - Use Let's Encrypt for HTTPS webhook

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs nba2k26-bot`
2. Verify environment variables: `cat /opt/nba2k26-bot/.env`
3. Test webhook: `curl http://YOUR_DROPLET_IP:3002/health`
4. Restart bot: `pm2 restart nba2k26-bot`

For DigitalOcean support: https://www.digitalocean.com/community/
