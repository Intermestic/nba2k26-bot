#!/bin/bash

# Setup script for NBA 2K26 Discord Bot systemd service
# Run with: sudo bash scripts/setup-systemd-bot.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="nba2k26-discord-bot"
SERVICE_FILE="$SCRIPT_DIR/$SERVICE_NAME.service"

echo "========================================"
echo "NBA 2K26 Discord Bot - Systemd Setup"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root (use sudo)"
    exit 1
fi

# Check if service file exists
if [ ! -f "$SERVICE_FILE" ]; then
    echo "ERROR: Service file not found at $SERVICE_FILE"
    exit 1
fi

# Stop existing service if running
echo "[1/6] Stopping existing service (if running)..."
systemctl stop $SERVICE_NAME 2>/dev/null || true
systemctl disable $SERVICE_NAME 2>/dev/null || true

# Kill any existing bot processes
echo "[2/6] Cleaning up existing bot processes..."
pkill -f "bot-standalone" 2>/dev/null || true
sleep 2

# Copy service file
echo "[3/6] Installing systemd service file..."
cp "$SERVICE_FILE" /etc/systemd/system/$SERVICE_NAME.service

# Create logs directory
echo "[4/6] Creating logs directory..."
mkdir -p "$PROJECT_DIR/logs"
chown ubuntu:ubuntu "$PROJECT_DIR/logs"

# Reload systemd
echo "[5/6] Reloading systemd daemon..."
systemctl daemon-reload

# Enable and start service
echo "[6/6] Enabling and starting service..."
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Wait for startup
sleep 5

# Check status
echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Service Status:"
systemctl status $SERVICE_NAME --no-pager || true
echo ""
echo "Useful commands:"
echo "  Check status:    sudo systemctl status $SERVICE_NAME"
echo "  View logs:       sudo journalctl -u $SERVICE_NAME -f"
echo "  Restart bot:     sudo systemctl restart $SERVICE_NAME"
echo "  Stop bot:        sudo systemctl stop $SERVICE_NAME"
echo "  Start bot:       sudo systemctl start $SERVICE_NAME"
echo ""
echo "The bot will automatically restart on:"
echo "  - Process crash"
echo "  - System reboot"
echo "  - Hung process (no response for 60 seconds)"
echo ""
