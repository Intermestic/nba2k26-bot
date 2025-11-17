# NBA 2K26 Player Database - TODO

## COMPLETED: Fix FA Bid Team Detection ✅

All phases completed and checkpoint saved.

---

## CURRENT TASK: Fix Duplicate Bid Handling

### Issue
When a team submits a new bid for the same player they're already bidding on, the system treats it as an additional commitment instead of replacing the old bid. This causes coin validation to fail because it counts both bids (e.g., Lakers bidding $31 then $46 on Miles McBride = $77 total instead of just $46).

### Phase 1: Investigate bid recording and coin validation logic
- [x] Review recordBid function in fa-bid-parser.ts
- [x] Check how validateBidCoins calculates current commitments
- [x] Identify where duplicate bids should be cancelled

### Phase 2: Update recordBid to cancel previous bids on same player
- [x] Add logic to delete previous bids by same team on same player
- [x] Ensure only the latest bid counts toward coin commitments
- [x] Update validateBidCoins to exclude cancelled bids

### Phase 3: Test and verify fix with Lakers scenario
- [x] Test Lakers bidding $31 on Miles McBride
- [x] Test Lakers updating bid to $46 on same player
- [x] Verify only $46 counts toward coin commitment (not $77)
- [x] Save checkpoint
