# Test Suite Documentation

## FA Bid Parser Tests

### Overview

The FA bid parser test suite (`fa-bid-parser.test.ts`) provides comprehensive validation of the bid message parsing logic used by the Discord bot to process free agency bids.

### Running Tests

```bash
# Run all tests
pnpm test

# Run only FA bid parser tests
pnpm test server/__tests__/fa-bid-parser.test.ts

# Run tests in watch mode
pnpm test --watch
```

### Test Coverage

The test suite includes **44 test cases** organized into the following categories:

#### 1. Valid Bid Formats (5 tests)
- Basic cut + sign format
- With bid keyword and amount
- Standalone number at end
- Sign without cut (no drop player)
- Default bid amount of 1

#### 2. Different Action Verbs (4 tests)
- Alternative cut verbs: drop, waive
- Alternative sign verbs: add, pickup

#### 3. Edge Cases: Player Names with Acquisition Keywords (6 tests)
**Critical regression prevention** - These tests ensure the parser correctly handles player names that contain acquisition keywords:
- "Saddiq" (contains "add")
- "Addison" (starts with "add")
- "Signor" (contains "sign")
- Names containing "bid"
- Signing players with keywords in their names
- Both players having keywords in names

#### 4. Case Insensitivity (3 tests)
- Uppercase keywords
- Mixed case
- Preserving player name casing

#### 5. Bid Amount Variations (4 tests)
- "bid: 5" format with colon
- Large amounts (100+)
- Standalone numbers
- Bid keyword priority

#### 6. Multi-word Player Names (3 tests)
- Three-word names
- Hyphenated names (e.g., "Karl-Anthony Towns")
- Names with suffixes (e.g., "Jr.")

#### 7. Error Cases: Should Return Null (6 tests)
- No acquisition keywords
- Only cut without sign
- Empty string
- Whitespace only
- Bid keyword without sign
- Random text

#### 8. Alternative Value Keywords (3 tests)
- "coin" keyword
- "coins" keyword
- "$" symbol

#### 9. Real-World Examples (4 tests)
- Jazz bug report example ("Cut Saddiq bey sign Christian Koloko")
- Typical FA bid with amount
- Updated bid (same player, new amount)
- Simple sign without drop

#### 10. Edge Cases: Spacing and Formatting (3 tests)
- Extra spaces between words
- Leading/trailing whitespace
- Tab characters

#### 11. Boundary Cases (3 tests)
- Single-word player names
- Very long player names
- Bid amount of 0

### Key Regex Patterns Tested

The test suite validates two critical regex patterns:

**Cut Pattern:**
```typescript
const cutPattern = /\b(cut|drop|waive)\s+(.+?)(?:\s+(?:sign|add|pickup))/i;
```
- Captures everything after cut/drop/waive until sign/add/pickup
- Non-greedy match to stop at first acquisition keyword
- Handles player names containing acquisition keywords

**Sign Pattern:**
```typescript
const signPattern = /\b(sign|add|pickup)\s+(.+?)(?:\s+(?:bid|\d+)|$)/i;
```
- Captures everything after sign/add/pickup until bid, number, or end
- Non-greedy match to stop at first delimiter
- Handles player names with special characters

### Common Test Patterns

**Valid Bid Test:**
```typescript
it('should parse basic cut + sign format', () => {
  const result = parseBidMessage('Cut John Doe sign Jane Smith');
  expect(result).toEqual({
    playerName: 'Jane Smith',
    bidAmount: 1,
    dropPlayer: 'John Doe'
  });
});
```

**Error Case Test:**
```typescript
it('should return null for invalid format', () => {
  const result = parseBidMessage('Invalid message');
  expect(result).toBeNull();
});
```

### Adding New Tests

When adding new test cases:

1. **Identify the category** - Place the test in the appropriate describe block
2. **Use descriptive names** - Test names should clearly state what they validate
3. **Test both success and failure** - Include positive and negative cases
4. **Document edge cases** - Add comments for non-obvious scenarios
5. **Run tests locally** - Ensure all tests pass before committing

Example:
```typescript
it('should parse player name with apostrophe', () => {
  const result = parseBidMessage("Sign D'Angelo Russell bid 10");
  expect(result).toEqual({
    playerName: "D'Angelo Russell",
    bidAmount: 10,
    dropPlayer: undefined
  });
});
```

### Regression Prevention

This test suite was created to prevent the **"Saddiq Bey bug"** where player names containing acquisition keywords (like "add" in "Saddiq") were incorrectly parsed. The comprehensive edge case coverage ensures:

- Parser correctly handles all player name variations
- Regex changes don't break existing functionality
- New features don't introduce parsing regressions
- Real-world Discord messages are parsed accurately

### Continuous Integration

These tests should be run:
- Before every commit
- In CI/CD pipeline
- After any parser logic changes
- When adding new acquisition/value keywords

### Test Maintenance

When modifying the parser:
1. Update failing tests to match new behavior
2. Add new tests for new features
3. Ensure all 44 tests still pass
4. Document any breaking changes
5. Update this README if test structure changes
