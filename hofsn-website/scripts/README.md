# Player Headshot Validation Script

## Overview

The `validate-player-images.ts` script automatically scans all game recaps for player names and validates that each player has a corresponding NBA headshot ID mapping in `client/src/lib/playerImages.ts`.

## Usage

Run the validation script from the project root:

```bash
pnpm tsx scripts/validate-player-images.ts
```

## What It Does

1. **Scans Game Recaps**: Reads all game recaps from `shared/newGameRecaps.ts`
2. **Extracts Player Names**: Pulls player names from the `keyPlayers` array in each recap
3. **Validates Mappings**: Checks if each player has a valid NBA player ID in `playerImages.ts`
4. **Generates Report**: Outputs a summary showing:
   - ✅ Valid headshots (players with correct NBA IDs)
   - ⚠️ Placeholder headshots (players marked as "placeholder")
   - ❌ Missing headshots (players with no ID mapping)

## Example Output

```
🔍 Scanning game recaps for player headshots...

📊 VALIDATION REPORT

============================================================
Total unique players found: 15
✅ Valid headshots: 13
⚠️  Placeholder headshots: 0
❌ Missing headshots: 2
============================================================

❌ MISSING PLAYER IDs:

  • Max Strus
    Game: Booker's 45-Point Explosion Powers Knicks Past 76ers

  • Austin Reaves
    Game: Reaves' 39-Point Eruption Lifts Spurs Over Hornets in Thriller

💡 Add these players to client/src/lib/playerImages.ts
```

## Exit Codes

- **0**: All players have valid headshot mappings
- **1**: One or more players are missing headshots or have placeholders

## When to Run

- **After adding new game recaps** to ensure all players have headshots
- **Before saving checkpoints** to catch missing player IDs early
- **In CI/CD pipelines** to prevent deploying with broken player images

## Adding Missing Players

When the script identifies missing players:

1. Find the NBA player ID from [NBA.com](https://www.nba.com)
2. Add the mapping to `client/src/lib/playerImages.ts`:

```typescript
"Player Name": "1234567",  // NBA Player ID
```

3. Re-run the validation script to confirm the fix

## Notes

- Player names must match **exactly** between game recaps and the mapping
- Use the same spelling and capitalization
- For players with special characters (é, ñ, etc.), add both versions if needed:
  ```typescript
  "Luka Dončić": "1629029",
  "Luka Doncic": "1629029",  // Without diacritic
  ```
