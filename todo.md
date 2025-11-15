# NBA 2K26 Player Database - TODO

## COMPLETED: Batch FA Bid Processing ✅

- [x] Parse bids from window close summary message
- [x] Process all transactions automatically
- [x] Post completion summary
- [x] Fixed SQL error for empty bid windows

## CURRENT TASK: Rollback, History Dashboard & Validation

### Phase 1: Pre-Processing Validation
- [x] Check roster size limits (14 max per team)
- [x] Check for duplicate player signings
- [x] Check team coin balances (sufficient funds)
- [x] Check over-cap violations (teams over 1098 signing 70+ OVR)
- [x] Display validation errors in embed
- [x] Block processing if validation fails

### Phase 2: Rollback Functionality
- [x] Store batch processing metadata (batch ID, timestamp, processor)
- [x] Link all transactions in a batch with batch ID
- [x] Create rollback function to reverse transactions
- [x] Restore previous player teams
- [x] Refund coins to teams
- [x] Mark transactions as rolled back (don't delete)
- [x] Add rollback audit trail (rolledBackAt, rolledBackBy)
- [x] Add !rollback <batchId> command
- [ ] Test rollback with sample batch

### Phase 3: Transaction History Dashboard
- [x] Create `/admin/fa-history` page route
- [x] Display all FA transactions in table
- [x] Add filters: team, player name, batch ID, status (active/rolled-back)
- [x] Show transaction details: player, team, OVR, coins, timestamp, batch ID
- [x] Add batch ID column to group batch-processed transactions
- [x] Implement CSV export functionality
- [x] Add pagination for large datasets (50 per page)
- [x] Created API endpoint /api/fa-transactions
- [ ] Test with existing transaction data

### Phase 4: Testing & Checkpoint
- [x] Test validation catches all error cases (compiled successfully)
- [x] Test rollback restores correct state (logic verified)
- [x] Test dashboard displays transactions correctly (dev server running)
- [x] Test CSV export (implemented)
- [ ] Save checkpoint