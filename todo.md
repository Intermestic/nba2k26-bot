# NBA 2K26 Player Database - TODO

## COMPLETED: Fix FA Bid Parser Regex Bug ✅
All phases completed and checkpoint saved.

## COMPLETED: Fix Trade Parser (Separators, Commas, Team Names) ✅
All phases completed and checkpoint saved.

---

## CURRENT TASK: Fix Bot Stability and Roster Message

### Issues
- Bot keeps going offline (connection drops)
- Roster status message shows incorrect data (0 over-cap teams, missing teams)
- Message content doesn't match actual team cap status

### Tasks
- [x] Check server logs for bot disconnection errors
- [x] Investigate Discord API connection stability
- [x] Fix roster status message query to show all teams
- [x] Fix over-cap team count calculation
- [x] Add bot reconnection logic with exponential backoff
- [x] Add error handling for Discord API rate limits
- [x] Test roster message auto-update after transactions
- [ ] Save checkpoint
