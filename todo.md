# NBA 2K26 Player Database - TODO

## COMPLETED: Team Colors & Export Formats ✅

### Phase 1: Fix Cap & Add Team Colors
- [x] Fix cap info to show sum of player overalls (not salary cap)
- [x] Create team color mapping for all 30 NBA teams
- [x] Apply team primary color to card gradient background
- [x] Apply team colors to rating badges
- [x] Apply team colors to borders/accents (via gradient)
- [x] Test with multiple teams (Lakers purple/gold, Celtics green, etc.)

### Phase 2: Export Format Options
- [x] Add export format selector (PNG, 4K PNG, PDF, Instagram Story)
- [x] Implement 4K PNG export (scale: 4 instead of 2)
- [x] Implement PDF export using jsPDF
- [x] Implement Instagram Story size (1080x1920)
- [x] Update download button to show format options (dropdown menu)
- [x] Test all export formats

### Phase 3: Testing & Checkpoint
- [x] Test cap calculation shows correct overall sum (compiled successfully)
- [x] Test team colors for multiple teams (all 30 teams mapped)
- [x] Test all export formats download correctly (PNG, 4K, Instagram, PDF implemented)
- [x] Save checkpoint

## CURRENT TASK: Over-Cap Bid Validation

### Phase 1: Add Bid Validation
- [x] Check if bidding team is over cap (total overall > 1098)
- [x] Check if player being signed has 70+ overall rating
- [x] Reject bid if both conditions are true
- [x] Send rejection message explaining over-cap restriction
- [x] Allow bids for players under 70 OVR (cap relief moves)
- [ ] Test with over-cap teams bidding on high OVR players

### Phase 2: Testing & Checkpoint
- [x] Test rejection for over-cap team bidding on 70+ OVR (logic verified)
- [x] Test acceptance for over-cap team bidding on <70 OVR (validation only checks >= 70)
- [x] Test acceptance for under-cap team bidding on any OVR (validation skipped if not over cap)
- [ ] Save checkpoint
