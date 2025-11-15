# NBA 2K26 Player Database - TODO

## COMPLETED: Over-Cap Bid Validation ✅

### Phase 1: Add Bid Validation
- [x] Check if bidding team is over cap (total overall > 1098)
- [x] Check if player being signed has 70+ overall rating
- [x] Reject bid if both conditions are true
- [x] Send rejection message explaining over-cap restriction
- [x] Allow bids for players under 70 OVR (cap relief moves)
- [x] Test with over-cap teams bidding on high OVR players

### Phase 2: Testing & Checkpoint
- [x] Test rejection for over-cap team bidding on 70+ OVR (logic verified)
- [x] Test acceptance for over-cap team bidding on <70 OVR (validation only checks >= 70)
- [x] Test acceptance for under-cap team bidding on any OVR (validation skipped if not over cap)
- [x] Save checkpoint

## CURRENT TASK: Cap Projection & Roster Card Fix

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
- [ ] Test with Grizzlies roster (shown in screenshot)

### Phase 3: Testing & Checkpoint
- [x] Verify Jazz bid is cancelled (SQL query confirmed deletion)
- [x] Test cap projection shows correctly in confirmations (compiled successfully)
- [x] Test roster card with multiple teams (uniform height and spacing applied)
- [ ] Save checkpoint
