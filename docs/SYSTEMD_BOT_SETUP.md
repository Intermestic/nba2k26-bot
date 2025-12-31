# Discord Bot Systemd Setup Guide

This guide explains how to set up the Discord bot to run as a systemd service for reliable auto-restart and uptime.

## Why Systemd?

Systemd provides:
- **Automatic restart on crash** - Bot restarts within 10 seconds of any failure
- **Hung process detection** - Watchdog kills and restarts bot if it stops responding for 60 seconds
- **Boot persistence** - Bot starts automatically when server reboots
- **Crash loop protection** - Stops restart attempts after 5 failures in 5 minutes to prevent infinite loops
- **Centralized logging** - All logs go to journald for easy viewing

## Quick Setup

Run the setup script with sudo:

```bash
cd /home/ubuntu/nba2k26-database
sudo bash scripts/setup-systemd-bot.sh
```

This will:
1. Stop any existing bot processes
2. Install the systemd service file
3. Enable the service to start on boot
4. Start the bot

## Manual Setup

If you prefer manual setup:

```bash
# Copy service file
sudo cp scripts/nba2k26-discord-bot.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable nba2k26-discord-bot

# Start the service
sudo systemctl start nba2k26-discord-bot
```

## Common Commands

### Check Status
```bash
sudo systemctl status nba2k26-discord-bot
```

### View Logs (live)
```bash
sudo journalctl -u nba2k26-discord-bot -f
```

### View Recent Logs
```bash
sudo journalctl -u nba2k26-discord-bot -n 100
```

### Restart Bot
```bash
sudo systemctl restart nba2k26-discord-bot
```

### Stop Bot
```bash
sudo systemctl stop nba2k26-discord-bot
```

### Start Bot
```bash
sudo systemctl start nba2k26-discord-bot
```

### Disable Auto-Start on Boot
```bash
sudo systemctl disable nba2k26-discord-bot
```

## Configuration

The service file is located at `/etc/systemd/system/nba2k26-discord-bot.service`.

### Key Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `Restart` | `always` | Restart on any exit (crash, error, etc.) |
| `RestartSec` | `10` | Wait 10 seconds before restart |
| `WatchdogSec` | `60` | Kill if no heartbeat for 60 seconds |
| `StartLimitBurst` | `5` | Max 5 restarts... |
| `StartLimitIntervalSec` | `300` | ...within 5 minutes |

### Modifying Settings

After editing the service file:

```bash
sudo systemctl daemon-reload
sudo systemctl restart nba2k26-discord-bot
```

## Watchdog Integration

The bot sends heartbeat signals to systemd every 30 seconds (half of the 60-second watchdog timeout). If the bot hangs or becomes unresponsive, systemd will:

1. Wait 60 seconds for a heartbeat
2. Kill the hung process
3. Wait 10 seconds
4. Start a fresh instance

This catches issues like:
- Infinite loops
- Deadlocks
- Memory leaks causing slowdown
- Discord API connection hangs

## Troubleshooting

### Bot Won't Start

Check the logs:
```bash
sudo journalctl -u nba2k26-discord-bot -n 50
```

Common issues:
- Missing `DISCORD_BOT_TOKEN` in `.env`
- Port 3001 already in use
- Database connection issues

### Bot Keeps Restarting

If you see rapid restarts, check for:
```bash
# View restart history
sudo systemctl show nba2k26-discord-bot --property=NRestarts
```

If `NRestarts` is high, there's likely a code bug causing crashes. Check logs for errors.

### Reset Restart Counter

If the bot hit the restart limit (5 in 5 minutes):
```bash
sudo systemctl reset-failed nba2k26-discord-bot
sudo systemctl start nba2k26-discord-bot
```

### Check if Systemd is Managing the Bot

```bash
systemctl is-active nba2k26-discord-bot
# Returns: active, inactive, or failed
```

## Web UI Integration

The bot control panel in the web UI automatically detects if systemd is available:

- **Systemd mode**: Start/Stop/Restart use `systemctl` commands
- **Manual mode**: Falls back to direct process management (no auto-restart)

The status display shows which mode is active.

## Removing Systemd Management

To go back to manual bot management:

```bash
sudo systemctl stop nba2k26-discord-bot
sudo systemctl disable nba2k26-discord-bot
sudo rm /etc/systemd/system/nba2k26-discord-bot.service
sudo systemctl daemon-reload
```

Then use the web UI or `pnpm start:bot` to run manually.
