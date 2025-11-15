# NBA 2K26 Player Database - TODO

## CURRENT TASK: Bid Expiration Countdown & Outbid Notifications

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
- [ ] Test outbid notification flow (ready for testing)

### Phase 3: Testing & Checkpoint
- [x] Test countdown updates hourly (compiled successfully, showing in status)
- [ ] Test outbid notifications with multiple bids (ready for live testing)
- [ ] Save checkpoint

## Fix Markdown Italics Bug - COMPLETED ✅

- [x] Escape underscores in Discord usernames
- [x] Test with rickflair_ username
- [x] Save checkpoint
