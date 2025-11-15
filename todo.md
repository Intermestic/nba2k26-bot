# NBA 2K26 Player Database - TODO

## CURRENT TASK: Update FA Status Message Formatting

- [x] Remove bold from "Bid:" and "Leader:" labels
- [x] Add separator lines (---) between players
- [x] Remove blank lines between players
- [x] Test formatting (will show in next update)
- [ ] Save checkpoint

## Fix Status Message Deletion - COMPLETED ✅

- [x] Debug why previous status messages aren't being deleted
- [x] Fix deletion logic to check both windows in special mode
- [x] Test that only one status message exists at a time
- [x] Save checkpoint

## Exclude Processed Bids - COMPLETED ✅

- [x] Check how processed transactions are tracked (faTransactions table)
- [x] Update getActiveBids to exclude bids that have been processed
- [x] Filter out bids for players whose transactions were completed
- [x] Save checkpoint
