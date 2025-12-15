# Discord Bot Simplification Plan

## Core Features to KEEP:
- Trade voting and processing
- FA bidding and processing  
- Team channel/role management
- Auto update and posting of updated team salary cap
- FA window close summaries
- FA status updates
- Basic bot lock mechanism

## Features to REMOVE:

### In ready event handler:
- Overcap roles initialization (lines 1280-1288)
- Cap violation monitoring (lines 1298-1304)
- Scheduled messages initialization (lines 1323-1330)

### Event handlers to remove:
- Member join/leave handlers (welcome/goodbye messages)
- Custom command handlers
- Reaction role handlers

### Commands to remove:
- !ab-records (activity booster)
- Any custom commands
- Health alert commands

### Imports/modules to remove:
- activity-booster-command
- custom-command-handler
- reaction-role-handler
- welcome-goodbye-handler
- health-alert related code
- bot-activity logging
- scheduled-restarts

### Admin UI already removed:
- Bot Activity Dashboard
- Bot Activity Logs
- Scheduled Restarts
- Analytics
- Server Logs
- Custom Commands
- Welcome & Goodbye
- Reaction Roles
- All upgrade tracking pages
- Cap Compliance page
- Bulk Transactions page
- Player Swaps page
- Badge Additions Tracking
