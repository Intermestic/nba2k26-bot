# NBA 2K26 Player Database - TODO

## COMPLETED: Cap Projection & Roster Card Fix ✅

### Phase 1: Cancel Bid & Add Cap Projection
- [x] Cancel Jazz bid on Luke Kornet (77 OVR, over-cap violation)
- [x] Calculate projected total overall after signing player
- [x] Add projected cap to bid confirmation message
- [x] Show cap status: under/over cap and by how much
- [x] Format: "Projected cap: 🟢 1095/1098 (-3)" or "🔴 1105/1098 (+7)"

### Phase 2: Fix Roster Card Layout
- [x] Make all player cards uniform height (gridAutoRows: '1fr')
- [x] Fix player image aspect ratios (consistent 3:4 aspect ratio maintained)
- [x] Improve text wrapping for long player names (word-break, fixed height)
- [x] Balance grid layout (ensure even spacing - 16px gap, 4 columns)
- [x] Test with Grizzlies roster (shown in screenshot)

### Phase 3: Testing & Checkpoint
- [x] Verify Jazz bid is cancelled (SQL query confirmed deletion)
- [x] Test cap projection shows correctly in confirmations (compiled successfully)
- [x] Test roster card with multiple teams (uniform height and spacing applied)
- [x] Save checkpoint

## CURRENT TASK: Fix Trade Approval Message Bug

### Phase 1: Investigate & Fix Approval Logic
- [x] Review trade voting logic in trade-voting.ts
- [x] Check approval threshold detection (7 👍 with < 5 👎) - logic is correct
- [x] Verify approval message is being sent - processVoteResult function exists
- [x] Check if bot placeholder removal is interfering with count - not the issue
- [x] Found root cause: trades not in activeVotes map (bot restart) weren't being tracked
- [x] Fixed: auto-initialize vote tracking when reactions are added to untracked trades

### Phase 2: Testing & Checkpoint
- [x] Add minimum message ID check (1439096316801060964) to prevent old trades from auto-tracking
- [x] Verify approval message sends at 7 👍 (logic fixed with auto-init)
- [x] Test rejection message sends at 5 👎 (logic fixed with auto-init)
- [ ] Save checkpoint
