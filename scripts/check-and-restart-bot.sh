#!/bin/bash

# NBA 2K26 Discord Bot Health Check and Auto-Restart Script
# This script is called by Manus scheduled task every hour

# Configuration
BOT_DIR="/home/ubuntu/nba2k26-database"
HEALTH_URL="http://localhost:3001/health"
LOG_FILE="/home/ubuntu/nba2k26-database/logs/bot-monitor.log"
MAX_LOG_SIZE=1048576  # 1MB
NOTIFY_SCRIPT="$BOT_DIR/scripts/discord-notify.sh"
CHANNEL_ID="1444709506499088467"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Rotate log if too large
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
    fi
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

notify_discord() {
    local title="$1"
    local message="$2"
    local color="${3:-3447003}"
    local emoji="${4:-📢}"
    
    if [ -x "$NOTIFY_SCRIPT" ]; then
        "$NOTIFY_SCRIPT" "$title" "$message" "$color" "$emoji"
    fi
}

log "=========================================="
log "=== Bot Health Check Started ==="
log "=========================================="

# Check if bot process is running
BOT_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)

if [ -z "$BOT_PID" ]; then
    log "❌ Bot process not found - starting bot..."
    notify_discord "Bot Offline" "Bot process not found. Starting bot now..." "16711680" "⚠️"
    
    cd "$BOT_DIR"
    
    # Kill any zombie processes first
    pkill -9 -f "tsx.*bot" 2>/dev/null
    sleep 2
    
    # Start the bot
    nohup npx tsx bot/index.ts >> "$LOG_FILE" 2>&1 &
    sleep 8
    
    # Verify it started
    NEW_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)
    if [ -n "$NEW_PID" ]; then
        log "✅ Bot started successfully (PID: $NEW_PID)"
        notify_discord "Bot Restarted" "Bot has been successfully restarted (PID: $NEW_PID)" "65280" "✅"
    else
        log "❌ Failed to start bot"
        notify_discord "Bot Start Failed" "Failed to start the bot. Check logs for details." "16711680" "❌"
        exit 1
    fi
else
    log "✅ Bot process running (PID: $BOT_PID)"
    
    # Check health endpoint
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" --max-time 10 2>/dev/null)
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        # Get detailed health info
        HEALTH_DATA=$(curl -s "$HEALTH_URL" --max-time 10 2>/dev/null)
        log "✅ Health check passed (HTTP $HEALTH_RESPONSE)"
        log "   Health data: $HEALTH_DATA"
    else
        log "⚠️ Health check failed (HTTP $HEALTH_RESPONSE) - restarting bot..."
        notify_discord "Bot Unhealthy" "Health check failed (HTTP $HEALTH_RESPONSE). Restarting bot..." "16776960" "🔄"
        
        # Kill existing process
        pkill -9 -f "tsx.*bot" 2>/dev/null
        sleep 3
        
        # Start fresh
        cd "$BOT_DIR"
        nohup npx tsx bot/index.ts >> "$LOG_FILE" 2>&1 &
        sleep 8
        
        NEW_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)
        if [ -n "$NEW_PID" ]; then
            log "✅ Bot restarted successfully (PID: $NEW_PID)"
            notify_discord "Bot Recovered" "Bot has been recovered and is running again (PID: $NEW_PID)" "65280" "✅"
        else
            log "❌ Failed to restart bot"
            notify_discord "Bot Recovery Failed" "Failed to restart the bot after health check failure. Check logs for details." "16711680" "❌"
            exit 1
        fi
    fi
fi

log "=== Bot Health Check Complete ==="
log ""
