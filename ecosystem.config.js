/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures how PM2 manages the NBA 2K26 Discord Bot on DigitalOcean.
 * 
 * Features:
 * - Auto-restart on crash (max 10 restarts)
 * - Memory limit (500MB)
 * - Graceful shutdown (5s timeout)
 * - Structured logging
 * - Production environment
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart nba2k26-bot
 *   pm2 logs nba2k26-bot
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'nba2k26-bot',
      
      // Entry point (built JavaScript file)
      script: './dist/bot/index.js',
      
      // Run single instance (not clustered)
      instances: 1,
      exec_mode: 'fork',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      
      // Auto-restart settings
      autorestart: true,
      max_restarts: 10,           // Max restart attempts
      min_uptime: '10s',          // Minimum uptime before counting as restart
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      
      // Graceful shutdown
      kill_timeout: 5000,         // Wait 5s before force kill
      listen_timeout: 3000,       // Wait 3s for app to listen
      shutdown_with_message: true, // Send shutdown message to app
      
      // Logging
      error_file: '/var/log/nba2k26-bot/error.log',
      out_file: '/var/log/nba2k26-bot/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Watch mode (optional - restart on file changes in development)
      // watch: ['dist'],
      // ignore_watch: ['node_modules', 'logs'],
      
      // Cron restart (optional - restart daily at 2 AM)
      // cron_restart: '0 2 * * *',
    }
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_DROPLET_IP',
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/nba2k26-bot.git',
      path: '/opt/nba2k26-bot',
      'post-deploy': 'npm install && npm run build && pm2 restart ecosystem.config.js --env production'
    }
  }
};
