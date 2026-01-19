#!/bin/bash

# NBA 2K26 Discord Bot Health Check and Auto-Restart Script
# Enhanced to detect degraded health, memory issues, and error thresholds
# This script is called by Manus scheduled task every hour

# Configuration
BOT_DIR="/home/ubuntu/nba2k26-database"
HEALTH_URL="http://localhost:3001/health"
LOG_FILE="/home/ubuntu/nba2k26-database/logs/bot-monitor.log"
MAX_LOG_SIZE=1048576  # 1MB
NOTIFY_SCRIPT="$BOT_DIR/scripts/discord-notify.sh"
CHANNEL_ID="1444709506499088467"

# Health thresholds
MAX_ERROR_COUNT=10          # Restart if more than 10 errors
MAX_MEMORY_PERCENT=80       # Restart if memory usage exceeds 80%
HEALTH_TIMEOUT=10           # Health check timeout in seconds

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

check_memory_usage() {
    local pid="$1"
    if [ -z "$pid" ]; then
        return 1
    fi
    
    # Get memory usage percentage for the process
    local mem_percent=$(ps aux | grep -E "^[^ ]+ +$pid " | awk '{print $3}' | cut -d. -f1)
    echo "$mem_percent"
}

check_health_status() {
    local response=$(curl -s "$HEALTH_URL" --max-time "$HEALTH_TIMEOUT" 2>/dev/null)
    
    if [ -z "$response" ]; then
        echo "error"
        return 1
    fi
    
    # Extract status field
    local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "$status"
    return 0
}

get_error_count() {
    local response=$(curl -s "$HEALTH_URL" --max-time "$HEALTH_TIMEOUT" 2>/dev/null)
    
    if [ -z "$response" ]; then
        return 0
    fi
    
    # Count errors in the response
    local error_count=$(echo "$response" | grep -o '"errors":\[' | wc -l)
    if [ "$error_count" -gt 0 ]; then
        # More accurate count: count error strings
        error_count=$(echo "$response" | grep -o '"Uncaught exception' | wc -l)
    fi
    
    echo "$error_count"
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
    
    # Start the bot with garbage collection enabled
    nohup node --expose-gc bot/index.ts >> "$LOG_FILE" 2>&1 &
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
    
    # Check memory usage
    MEM_PERCENT=$(check_memory_usage "$BOT_PID")
    log "   Memory usage: ${MEM_PERCENT}%"
    
    if [ "$MEM_PERCENT" -gt "$MAX_MEMORY_PERCENT" ]; then
        log "⚠️ Memory usage exceeds threshold (${MEM_PERCENT}% > ${MAX_MEMORY_PERCENT}%) - restarting bot..."
        notify_discord "High Memory Usage" "Bot memory usage is ${MEM_PERCENT}% (threshold: ${MAX_MEMORY_PERCENT}%). Restarting bot..." "16776960" "💾"
        
        pkill -9 -f "tsx.*bot" 2>/dev/null
        sleep 3
        
        cd "$BOT_DIR"
        nohup node --expose-gc bot/index.ts >> "$LOG_FILE" 2>&1 &
        sleep 8
        
        NEW_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)
        if [ -n "$NEW_PID" ]; then
            log "✅ Bot restarted due to high memory usage (PID: $NEW_PID)"
            notify_discord "Bot Recovered" "Bot has been restarted due to high memory usage" "65280" "✅"
        else
            log "❌ Failed to restart bot"
            notify_discord "Bot Recovery Failed" "Failed to restart the bot after high memory detection." "16711680" "❌"
            exit 1
        fi
        exit 0
    fi
    
    # Check health endpoint
    HEALTH_STATUS=$(check_health_status)
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" --max-time "$HEALTH_TIMEOUT" 2>/dev/null)
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        log "✅ Health check passed (HTTP $HEALTH_RESPONSE, Status: $HEALTH_STATUS)"
        
        # Check error count
        ERROR_COUNT=$(get_error_count)
        log "   Errors detected: $ERROR_COUNT"
        
        if [ "$ERROR_COUNT" -gt "$MAX_ERROR_COUNT" ]; then
            log "⚠️ Error count exceeds threshold ($ERROR_COUNT > $MAX_ERROR_COUNT) - restarting bot..."
            notify_discord "Too Many Errors" "Bot has accumulated $ERROR_COUNT errors (threshold: $MAX_ERROR_COUNT). Restarting..." "16776960" "🔄"
            
            pkill -9 -f "tsx.*bot" 2>/dev/null
            sleep 3
            
            cd "$BOT_DIR"
            nohup node --expose-gc bot/index.ts >> "$LOG_FILE" 2>&1 &
            sleep 8
            
            NEW_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)
            if [ -n "$NEW_PID" ]; then
                log "✅ Bot restarted due to high error count (PID: $NEW_PID)"
                notify_discord "Bot Recovered" "Bot has been restarted due to high error count" "65280" "✅"
            else
                log "❌ Failed to restart bot"
                notify_discord "Bot Recovery Failed" "Failed to restart the bot after high error detection." "16711680" "❌"
                exit 1
            fi
        fi
    elif [ "$HEALTH_STATUS" = "degraded" ]; then
        log "⚠️ Bot health is degraded (HTTP $HEALTH_RESPONSE) - restarting bot..."
        notify_discord "Bot Degraded" "Bot health status is degraded. Restarting bot..." "16776960" "🔄"
        
        pkill -9 -f "tsx.*bot" 2>/dev/null
        sleep 3
        
        cd "$BOT_DIR"
        nohup node --expose-gc bot/index.ts >> "$LOG_FILE" 2>&1 &
        sleep 8
        
        NEW_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)
        if [ -n "$NEW_PID" ]; then
            log "✅ Bot restarted due to degraded health (PID: $NEW_PID)"
            notify_discord "Bot Recovered" "Bot has been recovered and is running again (PID: $NEW_PID)" "65280" "✅"
        else
            log "❌ Failed to restart bot"
            notify_discord "Bot Recovery Failed" "Failed to restart the bot after degraded health detection." "16711680" "❌"
            exit 1
        fi
    else
        log "❌ Health check failed (HTTP $HEALTH_RESPONSE, Status: $HEALTH_STATUS) - restarting bot..."
        notify_discord "Bot Unhealthy" "Health check failed (HTTP $HEALTH_RESPONSE). Restarting bot..." "16711680" "❌"
        
        pkill -9 -f "tsx.*bot" 2>/dev/null
        sleep 3
        
        cd "$BOT_DIR"
        nohup node --expose-gc bot/index.ts >> "$LOG_FILE" 2>&1 &
        sleep 8
        
        NEW_PID=$(pgrep -f "tsx.*bot/index.ts" | head -1)
        if [ -n "$NEW_PID" ]; then
            log "✅ Bot restarted successfully (PID: $NEW_PID)"
            notify_discord "Bot Recovered" "Bot has been recovered and is running again (PID: $NEW_PID)" "65280" "✅"
        else
            log "❌ Failed to restart bot"
            notify_discord "Bot Recovery Failed" "Failed to restart the bot after health check failure." "16711680" "❌"
            exit 1
        fi
    fi
fi

log "=== Bot Health Check Complete ==="
log ""
