# NBA 2K26 Player Database - TODO

## COMPLETED: Add Player Upgrade History Viewer to Main Page ✅

All phases completed and checkpoint saved.

---

## CURRENT TASK: Fix FA Bid Team Detection

### Issue
FA bid parser incorrectly identifies "Free Agents" as the bidding team instead of the actual team (Hornets). This causes false "over cap" rejections because it checks Free Agents' cap status instead of the bidding team's cap status.

### Phase 1: Investigate FA bid team detection logic
- [x] Review fa-bid-parser.ts to understand current team detection
- [x] Check how teamAssignments table is being used
- [x] Identify where Discord role-based team detection should be applied

### Phase 2: Update FA bid parser to use Discord role-based team detection
- [x] Update parseFABid function to prioritize Discord role team assignment
- [x] Ensure teamAssignments table lookup by Discord user ID
- [x] Remove fallback to dropped player's team for team detection
- [x] Update cap validation to use correct bidding team

### Phase 3: Test and verify fix with Hornets bid scenario
- [x] Test with Hornets bid: "Cut Carlton carrington sign miles McBride bid 56"
- [x] Verify bot correctly identifies Hornets as bidding team
- [x] Verify cap check runs against Hornets roster (not Free Agents)
- [x] Save checkpoint
