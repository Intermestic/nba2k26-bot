# NBA 2K26 Player Database - TODO

## CURRENT TASK: Trade Voting System

- [x] Monitor trade channel for new trade embeds
- [x] Auto-add 👍 and 👎 reactions to new trade embeds
- [x] Track votes from users with "Trade Committee" role
- [x] Reject votes from non-Trade Committee members with DM notification
- [x] Check vote counts on each new reaction
- [x] Approve trade when 7 👍 reached before 5 👎 (post confirmation)
- [x] Reject trade when 5 👎 reached before 7 👍 (post rejection)
- [ ] Test voting system (ready for testing)
- [ ] Save checkpoint

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

## Story Generation API Integration - DEFERRED TO TOMORROW

- [ ] Complete story generation API integration for 90+ OVR trades
- [ ] Test with sample trade
- [ ] Save checkpoint
