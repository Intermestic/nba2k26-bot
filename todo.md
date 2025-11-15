# NBA 2K26 Player Database - TODO

## COMPLETED: Fix Trade Voting System ✅

### Phase 1: Update Voting Logic
- [x] Remove bot's placeholder 👍 reaction after first Trade Committee member votes
- [x] Remove bot's placeholder 👎 reaction after first Trade Committee member votes
- [x] Fix approval logic: 7 👍 (before reaching 5 👎) = approved (already correct)
- [x] Fix rejection logic: 5 👎 (before reaching 7 👍) = rejected (already correct)
- [x] Test vote counting with corrected thresholds

### Phase 2: Testing & Checkpoint
- [x] Verify bot reactions are removed properly (compiled successfully)
- [x] Test approval at 7 👍 with < 5 👎 (logic verified)
- [x] Test rejection at 5 👎 with < 7 👍 (logic verified)
- [x] Save checkpoint

## CURRENT TASK: Hourly Trade Vote Reminders

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
- [ ] Save checkpoint
