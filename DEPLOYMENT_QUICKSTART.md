# DigitalOcean Deployment - Quick Start

**TL;DR version of the full deployment guide. Follow these steps in order.**

## Prerequisites
- GitHub account
- DigitalOcean account ($6/month)
- SSH access to your Droplet
- Discord bot token and environment variables

---

## Phase 1: DigitalOcean Setup (15 minutes)

### 1. Create Droplet
- Go to [digitalocean.com](https://digitalocean.com)
- Create → Droplet
- **Image:** Ubuntu 22.04 LTS
- **Size:** Basic ($6/month)
- **Region:** Closest to you
- **Auth:** SSH key (recommended)
- Create

### 2. SSH Into Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs git
npm install -g pm2
```

### 4. Create Bot Directory
```bash
mkdir -p /opt/nba2k26-bot
mkdir -p /var/log/nba2k26-bot
cd /opt/nba2k26-bot
```

---

## Phase 2: GitHub Setup (10 minutes)

### 5. Create GitHub Repository
- Go to [github.com/new](https://github.com/new)
- **Name:** `nba2k26-bot`
- **Visibility:** Private
- Create

### 6. Push Code to GitHub (from Manus)
```bash
cd /home/ubuntu/nba2k26-database
git remote add github https://github.com/YOUR_USERNAME/nba2k26-bot.git
git branch -M main
git push -u github main
```

### 7. Set Up SSH on Droplet
```bash
# On Droplet
ssh-keygen -t ed25519 -C "nba2k26-bot" -f /root/.ssh/github_key -N ""
cat /root/.ssh/github_key.pub
```

Copy the key output and add to GitHub:
- Go to [github.com/settings/keys](https://github.com/settings/keys)
- New SSH key
- Paste the key
- Save

### 8. Configure SSH on Droplet
```bash
cat >> /root/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile /root/.ssh/github_key
EOF

chmod 600 /root/.ssh/config

# Test
ssh -T git@github.com
```

---

## Phase 3: Deploy Bot (10 minutes)

### 9. Clone Repository on Droplet
```bash
cd /opt/nba2k26-bot
git clone git@github.com:YOUR_USERNAME/nba2k26-bot.git .
```

### 10. Create .env File
```bash
cat > /opt/nba2k26-bot/.env << 'EOF'
DISCORD_BOT_TOKEN=your_bot_token
DATABASE_URL=mysql://user:password@localhost:3306/nba2k26
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
EOF
```

**Replace all `your_*` values with actual values from your Manus project.**

### 11. Install & Build
```bash
cd /opt/nba2k26-bot
npm install
npm run build
```

### 12. Start Bot with PM2
```bash
pm2 start ecosystem.config.js
pm2 status
pm2 logs nba2k26-bot
```

### 13. Enable Auto-Start on Reboot
```bash
pm2 startup
# Copy and run the command it outputs
pm2 save
```

---

## Phase 4: Verify Deployment (5 minutes)

### 14. Check Bot Status
```bash
# Should show "online"
pm2 status

# Should return JSON
curl http://localhost:3001/health

# Should show bot logs
pm2 logs nba2k26-bot --lines 20
```

### 15. Test in Discord
- Run `/health` command in Discord
- Bot should respond with status embed

---

## Phase 5: Future Updates (2 minutes)

### To Deploy Updates:

**From Manus:**
```bash
cd /home/ubuntu/nba2k26-database
git add .
git commit -m "Update: your changes"
git push github main
```

**On Droplet:**
```bash
cd /opt/nba2k26-bot
./deploy.sh
```

Or manually:
```bash
cd /opt/nba2k26-bot
git pull origin main
npm install
npm run build
pm2 restart nba2k26-bot
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot not starting | `pm2 logs nba2k26-bot` to see errors |
| Permission denied (publickey) | Run `ssh-add /root/.ssh/github_key` |
| Health endpoint not responding | Wait 10s and try again, or check logs |
| Out of memory | Bot will auto-restart, check logs |
| Database connection error | Verify DATABASE_URL in .env |

---

## Cost

| Item | Price |
|------|-------|
| DigitalOcean Droplet | $6/month |
| **Total** | **$6/month** |

---

## Next Steps

1. ✅ Follow steps 1-15 above
2. ✅ Verify bot is running: `pm2 status`
3. ✅ Test in Discord: `/health`
4. ✅ Set up monitoring (optional): See [MONITORING_SETUP.md](./MONITORING_SETUP.md)
5. ✅ Keep Manus for development, Droplet for production

**Your bot is now running 24/7!** 🎉

---

## Full Documentation

For detailed information, see:
- [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) - Complete setup guide
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub configuration
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Monitoring & alerts
- [ecosystem.config.js](./ecosystem.config.js) - PM2 configuration
- [deploy.sh](./deploy.sh) - Deployment script

---

## Support

**Bot not working?**
1. SSH into Droplet: `ssh root@YOUR_DROPLET_IP`
2. Check logs: `pm2 logs nba2k26-bot`
3. Check status: `pm2 status`
4. Restart: `pm2 restart nba2k26-bot`

**Need help?**
- Check [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) troubleshooting section
- View full logs: `tail -100 /var/log/nba2k26-bot/error.log`
- SSH into Droplet and debug manually
