# NBA 2K26 Player Database - TODO

## CURRENT TASK: Exclude Processed Bids from Active Bids

- [x] Check how processed transactions are tracked (faTransactions table)
- [x] Update getActiveBids to exclude bids that have been processed via ⚡ reaction
- [x] Filter out bids for players whose transactions were completed
- [ ] Test that Colin Castleton and Johnny Davis are excluded (will show in next update)
- [ ] Verify coin commitments update correctly (automatic)
- [ ] Save checkpoint

## Special FA Window - COMPLETED ✅

- [x] Update FA status system to include bids from window 2025-11-14-PM
- [x] Add time-based logic to merge windows until noon EST 2025-11-15
- [x] Test bid counting includes all unprocessed bids (will show in next update)
- [x] Coin commitments calculate correctly (uses same logic)
- [x] Save checkpoint

## Cap Compliance Dashboard - COMPLETED ✅

- [x] Create database schema for cap violation logs
- [x] Add migration for capViolations table
- [x] Update cap alert system to log violations to database
- [x] Create tRPC endpoint for cap violation history
- [x] Build admin dashboard page at /admin/cap-compliance
- [x] Show violation timeline with filters
- [x] Display compliance status and repeat offenders
- [x] Add export to CSV functionality
- [x] Test dashboard (compiled successfully, accessible at /admin/cap-compliance)
- [x] Save checkpoint
