# NBA 2K26 Player Database - TODO

## CURRENT TASK: Fix Status Message Deletion

- [x] Debug why previous status messages aren't being deleted (special window mode issue)
- [x] Check if statusMessageId is being saved correctly (was checking wrong window)
- [x] Fix deletion logic to check both windows in special mode
- [x] Test that only one status message exists at a time (confirmed in logs)
- [ ] Save checkpoint

## Exclude Processed Bids - COMPLETED ✅

- [x] Check how processed transactions are tracked (faTransactions table)
- [x] Update getActiveBids to exclude bids that have been processed via ⚡ reaction
- [x] Filter out bids for players whose transactions were completed
- [x] Test that Colin Castleton and Johnny Davis are excluded
- [x] Verify coin commitments update correctly
- [x] Save checkpoint

## Special FA Window - COMPLETED ✅

- [x] Update FA status system to include bids from window 2025-11-14-PM
- [x] Add time-based logic to merge windows until noon EST 2025-11-15
- [x] Test bid counting includes all unprocessed bids
- [x] Coin commitments calculate correctly
- [x] Save checkpoint
