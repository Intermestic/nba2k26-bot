# System Simplification Plan

## Goal
Strip down to core features only: Trade voting/processing and FA bidding

## Features to KEEP
1. Trade voting (👍/👎 reactions)
2. Trade approval/rejection messages
3. Auto-processing approved trades (moving players between teams)
4. FA bidding process monitoring
5. FA window close summaries
6. Basic roster display

## Features to REMOVE

### Admin UI Pages
- [ ] Bot Activity Dashboard
- [ ] Bot Activity Logs
- [ ] Scheduled Restarts
- [ ] Badge Additions Tracking
- [ ] Upgrade Log Dashboard
- [ ] Validation Rules
- [ ] Upgrade Compliance
- [ ] Player Upgrade Progress
- [ ] Upgrade Requests
- [ ] Upgrade Management
- [ ] Custom Commands
- [ ] Welcome & Goodbye
- [ ] Reaction Roles (both duplicate entries)
- [ ] Analytics
- [ ] Server Logs
- [ ] Upgrade Log (from bot management)
- [ ] Player Swaps
- [ ] Cap Compliance
- [ ] Bulk Transactions

### Bot Features
- [ ] Activity Booster system
- [ ] Team channel management
- [ ] Team role management
- [ ] Bot instance lock mechanism (simplify)
- [ ] Cap violation alerts
- [ ] Overcap role management
- [ ] Health alerts
- [ ] Scheduled restarts
- [ ] Welcome/goodbye messages
- [ ] Custom commands system
- [ ] Reaction roles

### Player Card Features
- [ ] "Upgrades" button/link

### Database Tables (to drop)
- [ ] bot_logs
- [ ] scheduled_restarts
- [ ] health_alerts
- [ ] activity_records
- [ ] activity_head_to_head
- [ ] activity_checkpoint
- [ ] activity_conflicts
- [ ] player_swaps
- [ ] All upgrade-related tables (badge_additions, upgrade_logs, upgrade_requests, etc.)
- [ ] bot_instance_lock (simplify or remove)

### Routes/APIs
- [ ] botActivity router
- [ ] botLogs router
- [ ] scheduledRestarts router
- [ ] healthAlerts router
- [ ] activityBooster router
- [ ] upgrades router
- [ ] playerSwaps router
- [ ] capCompliance router

## Implementation Order
1. Remove admin UI pages and navigation
2. Remove bot features from discord-bot.ts
3. Remove database tables
4. Remove API routes
5. Clean up imports and dependencies
6. Test core features
7. Create checkpoint
