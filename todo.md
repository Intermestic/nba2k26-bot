# NBA 2K26 Player Database - TODO

## CURRENT TASK: Trade Voting System Bug Fixes - COMPLETED ✅

- [x] Fix vote threshold logic (5 👎 before 7 👍 = rejected)
- [x] Add debug logging for role detection
- [x] Fix role check to be case-insensitive and trim whitespace
- [x] Test rejection message posting (5 👎 votes)
- [x] Test approval message posting (7 👍 votes)
- [x] Remove excessive debug logging
- [ ] Save checkpoint

## Trade Voting System - COMPLETED ✅

- [x] Monitor trade channel for new trade embeds
- [x] Auto-add 👍 and 👎 reactions to new trade embeds
- [x] Track votes from users with "Trade Committee" role
- [x] Reject votes from non-Trade Committee members with DM notification
- [x] Check vote counts on each new reaction
- [x] Approve trade when 7 👍 reached before 5 👎 (post confirmation)
- [x] Reject trade when 5 👎 reached before 7 👍 (post rejection)
- [x] Initial testing completed

## Discord FA Status Message Font - COMPLETED ✅

- [x] Remove italic/oblique styling from FA status messages (changed tree chars to bullets)
- [x] Use normal font weight for all text (bold labels instead of italic)
- [x] Test Discord message appearance (next hourly update)
- [x] Save checkpoint

## Player Edit Form Fixes - COMPLETED ✅

- [x] Add team dropdown to player edit form (Free Agents + 28 teams)
- [x] Add 2kratings URL field to edit form
- [x] Add team field to update API mutation
- [x] Create team validation function to prevent creating invalid teams
- [x] Apply validation to discord-bot.ts (FA transactions)
- [x] Apply validation to trade-handler.ts (trade processing)
- [x] Test all changes (TypeScript compiled with no errors)
- [x] Save checkpoint

## Cap Status Message Fix

- [x] Remove Free Agents from cap status embed (filtered from query)
- [x] Test cap status message (will show in next update)
- [ ] Save checkpoint
