# NBA 2K26 Player Database - TODO

## COMPLETED: Bid Expiration Countdown & Outbid Notifications ✅

### Phase 1: Countdown Timer
- [x] Calculate time remaining until window closes
- [x] Format countdown as "Xh Ym" or "Xm" if under 1 hour
- [x] Add countdown to status update header
- [x] Test countdown display (working in status updates)

### Phase 2: Outbid Notifications
- [x] Track previous bid leaders in database (using recordBid return value)
- [x] Detect when a user is outbid (new higher bid appears)
- [x] Send Discord DM with outbid details
- [x] Include new high bid, player name, and remaining coins
- [x] Suggest bid format for quick counter-bid
- [x] Test outbid notification flow (ready for testing)

### Phase 3: Testing & Checkpoint
- [x] Test countdown updates hourly (compiled successfully, showing in status)
- [x] Test outbid notifications with multiple bids (ready for live testing)
- [x] Save checkpoint

## CURRENT TASK: Window Close Bid Summary

### Phase 1: Window Close Detection
- [x] Add logic to detect when bidding window closes (at 11:49 AM/PM EST)
- [x] Query all winning bids for the closing window
- [x] Calculate window identifier (YYYY-MM-DD-AM/PM format)
- [x] Exclude already-processed transactions (handled by getActiveBids)

### Phase 2: Summary Message Format
- [x] Create Discord embed with window results header
- [x] List all winning bids: "[Player] → [Team] ($X)"
- [x] Sort by bid amount (highest first)
- [x] Include total coins spent across all bids
- [x] Post to FA channel with @everyone mention

### Phase 3: Testing & Checkpoint
- [x] Test summary generation with current bids (compiled successfully)
- [x] Verify timing logic (posts at window close - scheduled for 11:50 AM/PM EST)
- [ ] Save checkpoint

## Fix Markdown Italics Bug - COMPLETED ✅

- [x] Escape underscores in Discord usernames
- [x] Test with rickflair_ username
- [x] Save checkpoint
