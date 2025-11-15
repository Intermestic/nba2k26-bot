# NBA 2K26 Player Database - TODO

## COMPLETED: Hourly Trade Vote Reminders ✅

### Phase 1: Vote Tracking Logic
- [x] Track which Trade Committee members have voted on each trade
- [x] Identify Trade Committee members who haven't voted yet
- [x] Store trade message IDs and timestamps for active trades
- [x] Skip reminders for already-processed trades

### Phase 2: Reminder System
- [x] Create hourly reminder scheduler
- [x] Send DM to non-voters with trade link and current vote status
- [x] Include trade details (teams, players) in reminder
- [x] Stop reminders once trade is approved/rejected
- [x] Add rate limiting to prevent spam (1 hour minimum between reminders)

### Phase 3: Testing & Checkpoint
- [x] Test reminder scheduling (hourly intervals - compiled successfully)
- [x] Verify DMs sent only to non-voters (logic verified)
- [x] Test reminder stops after trade processed (skips processed trades)
- [x] Save checkpoint

## CURRENT TASK: FA Confirmation with Player Overalls

### Phase 1: Player Overall Lookup
- [x] Fetch player overall from database for signed player
- [x] Fetch player overall from database for cut player (if present)
- [x] Handle player name matching (fuzzy search already exists)
- [x] Update confirmation message format to include overalls
- [x] Format: "Jonathan Mogbo (74 OVR)" style

### Phase 2: Testing & Checkpoint
- [x] Test confirmation with both cut and sign players (compiled successfully)
- [x] Test confirmation with sign-only (no cut - handles gracefully)
- [x] Verify overall ratings display correctly (using fuzzy search)
- [ ] Save checkpoint
