# NBA 2K26 Player Database - TODO

## COMPLETED: Batch Processing Fix ✅
- [x] Added dropPlayer field to faBids schema
- [x] Updated window close summary format to show "Cut: X / Sign: Y"
- [x] Updated batch processor parser to extract both players
- [x] Implemented automatic roster updates for dropped players

## CURRENT TASK: Manual Window Summary Regeneration

### Goal
Regenerate window close summary for 2025-11-15-AM window with all cut/sign information so admin can process via ⚡ reaction

### Phase 1: Create Manual Command
- [x] Add !regenerate-summary command to Discord bot
- [x] Query all bids from 2025-11-15-AM window (or specify window ID)
- [x] Include dropPlayer info from database
- [x] Format as window close summary embed
- [x] Post to FA channel

### Phase 2: Test & Execute
- [x] Command ready to test (dev server running, no errors)
- [ ] User to execute: !regenerate-summary 2025-11-15-AM
- [ ] Verify all bids appear with cut/sign format
- [ ] Confirm ⚡ reaction triggers batch processing

### Phase 3: Checkpoint
- [ ] Save checkpoint with manual command
