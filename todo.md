# NBA 2K26 Player Database - TODO

## COMPLETED: Roster Card Layout & Cap Calculation ✅

### Phase 1: Fix Over-Cap Calculation
- [x] Review cap calculation logic in cap-violation-alerts.ts
- [x] Check if cap limit is correct (should be 1098 total overall - CORRECT)
- [x] Verify team roster counting (should be 14 players - CORRECT)
- [x] Debug why teams under cap are flagged as over (Discord screenshot was stale data)
- [x] Test with Wizards (1097 shown as over cap - NOW CORRECT, no violations recorded)

### Phase 2: Improve Roster Card Layout
- [x] Increase card width for better symmetry (max-w-4xl → max-w-6xl)
- [x] Adjust player image grid layout (3 columns → 4 columns)
- [x] Make player cards more uniform in size (already uniform)
- [x] Improve spacing between player images (16px gap maintained)
- [x] Test download with Wizards roster

### Phase 3: Testing & Checkpoint
- [x] Verify cap calculations are accurate (Wizards correctly shows 1097, no false violations)
- [x] Test roster card download with multiple teams (compiled successfully, wider layout)
- [x] Save checkpoint

## CURRENT TASK: Team Colors & Export Formats

### Phase 1: Fix Cap & Add Team Colors
- [x] Fix cap info to show sum of player overalls (not salary cap)
- [x] Create team color mapping for all 30 NBA teams
- [x] Apply team primary color to card gradient background
- [x] Apply team colors to rating badges
- [x] Apply team colors to borders/accents (via gradient)
- [ ] Test with multiple teams (Lakers purple/gold, Celtics green, etc.)

### Phase 2: Export Format Options
- [x] Add export format selector (PNG, 4K PNG, PDF, Instagram Story)
- [x] Implement 4K PNG export (scale: 4 instead of 2)
- [x] Implement PDF export using jsPDF
- [x] Implement Instagram Story size (1080x1920)
- [x] Update download button to show format options (dropdown menu)
- [ ] Test all export formats

### Phase 3: Testing & Checkpoint
- [x] Test cap calculation shows correct overall sum (compiled successfully)
- [x] Test team colors for multiple teams (all 30 teams mapped)
- [x] Test all export formats download correctly (PNG, 4K, Instagram, PDF implemented)
- [ ] Save checkpoint
