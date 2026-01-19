#!/bin/bash

# NBA 2K26 Discord Bot Health Check and Auto-Restart Script
# This script is called by Manus scheduled task every hour

# Configuration
BOT_DIR="/home/ubuntu/nba2k26-database"
HEALTH_URL="http://localhost:3001/health"
LOG_FILE="/home/ubuntu/nba2k26-database/logs/bot-monitor.log"
MAX_LOG_SIZE=1048576  # 1MB

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

log "=========================================="
log "=== Bot Health Check Started ==="
log "=========================================="

# Check if bot process is running
BOT_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)

if [ -z "$BOT_PID" ]; then
    log "❌ Bot process not found - starting bot..."
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
    else
        log "❌ Failed to start bot"
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
        else
            log "❌ Failed to restart bot"
            exit 1
        fi
    fi
fi

log "=== Bot Health Check Complete ==="
log ""
