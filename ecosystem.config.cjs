/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures PM2 to manage both the web server and Discord bot
 * as separate processes with automatic restart on crash.
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 logs
 *   pm2 status
 *   pm2 restart all
 *   pm2 stop all
 */

module.exports = {
  apps: [
    {
      name: 'nba2k26-web',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: 'logs/web-error.log',
      out_file: 'logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'nba2k26-bot',
      script: 'dist/bot-standalone.js',
      env: {
        NODE_ENV: 'production',
        BOT_HTTP_PORT: '3001'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: 'logs/bot-error.log',
      out_file: 'logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};
