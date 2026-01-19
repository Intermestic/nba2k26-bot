# Discord Bot Testing Plan - Phase 4 & 5

This document outlines the specific testing procedures for the trade voting and FA bidding systems in the clean bot rebuild.

---

## Phase 4: Trade Voting System

### Overview
The trade voting system monitors the trade channel for trade proposals, tracks votes via reactions, and automatically processes trades when they reach the approval/rejection threshold.

### Test Environment Setup
- **Trade Channel ID**: `1087524540634116116`
- **Approval Threshold**: 7 upvotes (👍)
- **Rejection Threshold**: 5 downvotes (👎)
- **Admin User ID**: `679275787664359435`

---

### Test Cases

#### 4.1 Trade Channel Monitoring
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Channel connection | Start bot, check logs | Log shows "Watching trade channel: 1087524540634116116" |
| Message detection | Post new message in trade channel | Bot logs "New message in trade channel" |

#### 4.2 Trade Message Parsing
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Standard embed format | Post trade with "Team1 Sends: Player1 / Team2 Sends: Player2" | Bot parses both teams and players correctly |
| @Team(nickname) format | Post trade with "@Pacers(nickname) Sends:" | Bot extracts team name ignoring nickname |
| Player with badges | Post "Player Name 81 (10 badges)" | Bot parses name, overall, salary correctly |
| Multi-player trade | Post trade with 3+ players per side | All players extracted with correct teams |

**Sample Trade Format to Test:**
```
**Pacers Sends:**
Player One 82 (11)
Player Two 79 (9)

**Lakers Sends:**
Player Three 85 (13)
Player Four 80 (10)
```

#### 4.3 Vote Detection
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Upvote detection | Add 👍 to trade message | Bot logs "Upvote detected from [user]" |
| Downvote detection | Add 👎 to trade message | Bot logs "Downvote detected from [user]" |
| Vote count update | Add multiple votes | Bot tracks cumulative count |
| Duplicate prevention | Same user votes twice | Second vote ignored |

#### 4.4 Trade Approval Flow
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Threshold reached | Add 7th upvote | Bot logs "Trade approved" |
| Database update | After approval | Trade status = "approved" in DB |
| Player movement | After approval | Players moved to new teams in DB |
| Success message | After approval | Bot posts "✅ Trade Approved" in channel |

#### 4.5 Trade Rejection Flow
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Rejection threshold | Add 5th downvote | Bot logs "Trade rejected" |
| Database update | After rejection | Trade status = "rejected" in DB |
| No player movement | After rejection | Players remain on original teams |
| Rejection message | After rejection | Bot posts "❌ Trade Rejected" in channel |

#### 4.6 Trade Reversal
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Reversal emoji | Admin adds ⏪ to approved trade | Bot detects reversal request |
| Permission check | Non-admin adds ⏪ | Reversal ignored |
| Player rollback | After reversal | Players returned to original teams |
| Status update | After reversal | Trade status = "reversed" in DB |

#### 4.7 Edge Cases
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Partial message | React to uncached message | Bot fetches full message before processing |
| Bot restart | Restart bot mid-voting | Bot scans for missed votes on startup |
| Database offline | Disconnect DB, add vote | Bot logs warning, continues running |

---

## Phase 5: FA Bidding System

### Overview
The FA bidding system monitors the free agency channel for bid messages, allows admin confirmation of bids, and processes winning bids to sign/cut players and deduct coins.

### Test Environment Setup
- **FA Channel ID**: `1095812920056762510`
- **Admin User ID**: `679275787664359435`
- **Bid Confirm Emoji**: ❗
- **Bid Process Emoji**: ⚡

---

### Test Cases

#### 5.1 FA Channel Monitoring
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Channel connection | Start bot, check logs | Log shows "Watching FA channel: 1095812920056762510" |
| Message detection | Post new message in FA channel | Bot logs "New message in FA channel" |

#### 5.2 Bid Message Detection
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Standard bid format | "Sign Player Name Bid 5" | Bot detects bid, extracts player and amount |
| With cut player | "Cut Player1 Sign Player2 Bid 3" | Bot extracts both players and amount |
| Default bid amount | "Sign Player Name" | Bot defaults to bid amount 1 |
| Alternative keywords | "Add Player Name 5" | Bot recognizes "Add" as sign keyword |

**Sample Bid Formats to Test:**
```
Sign LeBron James Bid 10
Cut Player One Sign Player Two Bid 5
Add Stephen Curry 3
Pickup Kevin Durant Bid 8
```

#### 5.3 Player Name Fuzzy Matching
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Exact match | "Sign LeBron James" | Matches "LeBron James" (100%) |
| Partial match | "Sign Lebron" | Matches "LeBron James" (85%+) |
| Misspelling | "Sign Giannis" | Matches "Giannis Antetokounmpo" |
| Nickname | "Sign KD" | Matches "Kevin Durant" |
| Special chars | "Sign Jokic" | Matches "Nikola Jokić" |

#### 5.4 Bid Confirmation (❗ Emoji)
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Admin confirms | Admin adds ❗ to bid | Bot logs "Bid confirmed" |
| Non-admin confirms | Regular user adds ❗ | Confirmation ignored |
| Bid stored | After confirmation | Bid record created in DB with status "confirmed" |
| Success reaction | After confirmation | Bot adds ✅ to message |

#### 5.5 Winning Bid Processing (⚡ Emoji)
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Admin processes | Admin adds ⚡ to confirmed bid | Bot processes winning bid |
| Player signed | After processing | Player's team updated in DB |
| Player cut | After processing | Cut player set to "Free Agent" |
| Coins deducted | After processing | Team's coins reduced by bid amount |
| Success message | After processing | Bot posts "⚡ FA Signing Complete" |

#### 5.6 Coin Management
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Coin deduction | Process 5-coin bid | Team coins reduced by 5 |
| Zero floor | Bid exceeds remaining coins | Coins set to 0, not negative |
| Balance check | Query team coins | Returns correct remaining balance |

#### 5.7 Learned Aliases
| Test | Steps | Expected Result |
|------|-------|-----------------|
| New alias created | Fuzzy match "Lebron" → "LeBron James" | Alias saved to learned_aliases table |
| Alias reused | Search "Lebron" again | Uses saved alias, increments use_count |
| High confidence skip | Exact match "LeBron James" | No new alias created (100% match) |

#### 5.8 Error Handling
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Unknown player | "Sign Fake Player Name" | Bot logs warning, no crash |
| Invalid format | Random text in FA channel | Bot ignores, no crash |
| Database offline | Process bid with DB down | Bot logs error, adds ❌ reaction |
| Missing team | Bid without team context | Bot asks for team specification |

---

## Testing Procedure

### Pre-Test Checklist
1. [ ] Bot is running and connected to Discord
2. [ ] Database connection is healthy
3. [ ] Trade channel ID is correct
4. [ ] FA channel ID is correct
5. [ ] Admin user ID is correct

### Test Execution Order
1. Start with channel monitoring tests (4.1, 5.1)
2. Test message parsing (4.2, 5.2)
3. Test vote/bid detection (4.3, 5.3)
4. Test approval/confirmation flows (4.4, 5.4)
5. Test rejection/processing flows (4.5, 5.5)
6. Test edge cases (4.7, 5.8)

### Test Data Cleanup
After testing, clean up test data:
```sql
-- Remove test trades
DELETE FROM trades WHERE messageId LIKE 'test_%';

-- Remove test bids
DELETE FROM fa_bids WHERE messageId LIKE 'test_%';

-- Reset test player teams if needed
UPDATE players SET team = 'Free Agent' WHERE name = 'Test Player';
```

---

## Success Criteria

### Phase 4 Complete When:
- [ ] Trade messages are parsed correctly (90%+ accuracy)
- [ ] Votes are tracked accurately
- [ ] Trades auto-approve at 7 upvotes
- [ ] Trades auto-reject at 7 downvotes
- [ ] Player teams update correctly after approval
- [ ] Trade reversal works for admin

### Phase 5 Complete When:
- [ ] Bid messages are detected correctly (90%+ accuracy)
- [ ] Player names fuzzy match correctly (85%+ accuracy)
- [ ] Admin can confirm bids with ❗
- [ ] Admin can process winning bids with ⚡
- [ ] Players are signed/cut correctly
- [ ] Coins are deducted correctly
- [ ] Learned aliases are saved

---

## Known Issues to Watch For

1. **Partial Messages**: Discord.js may receive partial messages that need fetching
2. **Rate Limits**: Too many reactions may trigger Discord rate limits
3. **Database Timeouts**: Long-running queries may timeout under load
4. **Fuzzy Match Ambiguity**: Similar player names may cause wrong matches
5. **Team Detection**: Determining team from Discord roles may fail

---

## Rollback Plan

If testing reveals critical issues:
1. Stop the bot immediately
2. Rollback to previous checkpoint
3. Document the failure scenario
4. Fix the issue in code
5. Re-run the failed test
