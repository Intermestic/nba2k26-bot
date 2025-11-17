# NBA 2K26 Player Database - TODO

## CURRENT TASK: Add Player Upgrade History Viewer to Main Page

### Phase 1: Add player upgrade history button to player cards
- [x] Add "View Upgrades" button to player cards on home page
- [x] Add icon (History or TrendingUp) to button
- [x] Position button appropriately (below player name or in card footer)
- [x] Only show button for players with upgrade history

### Phase 2: Create upgrade history dialog component
- [x] Create PlayerUpgradeHistoryDialog component
- [x] Add TRPC query to fetch player upgrade history by player name
- [x] Display upgrade timeline with dates and details
- [x] Show statistics (total upgrades, unique badges, pending)
- [x] Add close button and proper dialog styling

### Phase 3: Test and save checkpoint
- [x] Test dialog opens correctly from player cards
- [x] Verify upgrade data displays properly
- [x] Test with players who have no upgrades
- [x] Save checkpoint
