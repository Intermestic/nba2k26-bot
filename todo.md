# NBA 2K26 Player Database - TODO

## COMPLETED: Manual Summary Regeneration ✅
- [x] Added !regenerate-summary command
- [x] Command ready to use: !regenerate-summary 2025-11-15-AM

## CURRENT TASK: Enhance Status Messages with Drop Info

### Goal
Update hourly FA status messages to show which player each bidder is planning to drop

### Current Format
```
Bruce Brown (75 OVR)
├─ $5 - TeamName (bidder)
└─ $3 - OtherTeam (bidder)
```

### New Format
```
Bruce Brown (75 OVR)
├─ $5 - TeamName (bidder) - cutting: Player X
└─ $3 - OtherTeam (bidder) - cutting: Player Y
```

### Phase 1: Update Status Message
- [x] Find status message generation code
- [x] Query dropPlayer from faBids for each bid (already in getActiveBids)
- [x] Update message format to include "cutting: PlayerName"
- [x] Handle cases where dropPlayer is null

### Phase 2: Test & Checkpoint
- [x] Code compiled successfully (no TypeScript errors)
- [x] Status message format updated to show cutting info
- [ ] Save checkpoint
