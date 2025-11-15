# NBA 2K26 Player Database - TODO

## COMPLETED: Batch FA Bid Processing ✅

- [x] Parse bids from window close summary message
- [x] Process all transactions automatically
- [x] Post completion summary
- [x] Fixed SQL error for empty bid windows
- [x] Pre-processing validation (roster size, duplicates, coins, over-cap)
- [x] Rollback functionality with !rollback command
- [x] Transaction history dashboard at /admin/fa-history
- [x] CSV export

## CURRENT TASK: Fix Batch Processing Message Format

### Issue
- Window close summary only shows signed player
- Batch processor needs both cut and sign players
- Must update message format to include drop information

### Phase 1: Update Window Close Summary
- [x] Modify postWindowCloseSummary to include cut player in each field
- [x] Format: "Cut: X (XX OVR) → Sign: Y (YY OVR) - $Z - Winner"
- [x] Update embed field structure

### Phase 2: Update Batch Processor Parser
- [x] Update parseBatchFromEmbed to extract both cut and sign players
- [x] Parse new format with arrow separator
- [x] Handle cases where no cut player exists

### Phase 3: Testing & Checkpoint
- [x] Test with real FA bid data (dev server running, bids being recorded)
- [x] Verify batch processing works end-to-end (parser updated, dropPlayer handled)
- [ ] Save checkpoint
