# NBA 2K26 Player Database - TODO

## COMPLETED: Fix FA Bid Team Detection ✅
All phases completed and checkpoint saved.

## COMPLETED: Fix Duplicate Bid Handling ✅
All phases completed and checkpoint saved.

## COMPLETED: Fix FA Bid Parser Regex Bug ✅
All phases completed and checkpoint saved.

## COMPLETED: Create Comprehensive Test Suite for FA Bid Parser ✅
All phases completed and checkpoint saved.

## COMPLETED: Create Fuzzy Name Matching Test Suite ✅
All phases completed and checkpoint saved.

---

## COMPLETED: Fix Admin Dashboard Landing Page ✅
All phases completed and checkpoint saved.

---

## CURRENT TASK: Fix FA Bid Validation Bugs

### Issues
1. Cap calculation showing wrong total (244/1098 instead of actual team total)
2. Over-cap teams can sign 70+ OVR players (should be restricted to 70 OVR max)

### Tasks
- [x] Investigate cap calculation in fa-bid-parser.ts
- [x] Fix projected cap calculation to use correct team total
- [x] Verify over-cap validation logic for 70 OVR restriction
- [x] Test with Jazz bid scenario (Cut Furphy 70, Sign Dosunmu 77)
- [ ] Save checkpoint
