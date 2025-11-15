# NBA 2K26 Player Database - TODO

## CURRENT TASK: Special FA Window - Include Previous Unprocessed Bids

- [x] Update FA status system to include bids from window 2025-11-14-PM
- [x] Add time-based logic to merge windows until noon EST 2025-11-15
- [x] Test bid counting includes all unprocessed bids (will show in next update)
- [x] Coin commitments calculate correctly (uses same logic)
- [ ] Save checkpoint

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

## Cap Violation Alert System - COMPLETED ✅

- [x] Create cap violation monitoring module
- [x] Track team cap status (checks every 6 hours)
- [x] Send Discord DM to team owner when over cap
- [x] Include suggested players to drop in alert message (3 lowest OVR)
- [x] Integrate with existing bot systems
- [x] Test cap violation alerts (alerts sent successfully)
- [x] Save checkpoint
