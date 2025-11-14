# NBA 2K26 Player Database - TODO

## Features to Implement

### Phase 1: Website Design & Setup
- [ ] Design modern landing page with database overview
- [ ] Create player browsing interface with search and filters
- [ ] Add download section for CSV/JSON files
- [ ] Implement responsive design for mobile/desktop

### Phase 2: Photo Collection
- [x] Extracted all 529 NBA.com players with photos
- [x] Matched 371 NBA 2K26 players with NBA.com data
- [x] Updated database - now 407/540 players with photos (75.4%)
- [x] 251 NBA.com photos + 156 2K Ratings photos

### Phase 3: Website Development
- [x] Copy player database files to project
- [x] Build player card components with photos
- [x] Implement search functionality (by name, overall rating)
- [x] Add filter options (by overall rating range)
- [x] Create download page with file links
- [x] Add statistics dashboard

### Phase 4: Deployment
- [x] Test all functionality
- [x] Create checkpoint (version: 8ab7af66)
- [ ] User to publish via Management UI

### Photo Matching Updates
- [x] Successfully extracted all 529 NBA.com players
- [x] Implemented normalized name matching (ignore spacing/Jr/III/etc)
- [x] Verified star players: Trae Young, Jayson Tatum, LeBron James, Fred VanVleet all found

## Photo Matching Issues - FIXED

- [x] Debug why Evan Mobley, Ja Morant, Luka Doncic missing photos (special characters)
- [x] Check if these players exist in NBA.com data (found with diacritics)
- [x] Fix name matching algorithm to catch all variations (unicode normalization)
- [x] Re-run matching with improved algorithm (395 matches, up from 371)
- [x] Update website with corrected data (77.0% photo coverage)
- [x] Create new checkpoint with fixed photos (version: c69de34a)

## Maximize Photo Coverage - Get All 529 NBA.com Photos

- [ ] Analyze 145 unmatched players to categorize them
- [ ] Identify players that SHOULD match but don't (name variations)
- [ ] Use fuzzy matching for close name matches
- [ ] Manually map remaining matchable players
- [ ] Update database with maximum coverage
- [ ] Create final checkpoint with best possible photo coverage

## Investigation: Why only 395/529 NBA.com players matched?

- [ ] Reverse analysis: Check how many of 529 NBA.com players are being used
- [ ] Identify which NBA.com players are NOT being matched to 2K26
- [ ] Find the gap between 395 matched and 529 available
- [ ] Fix matching to use all 529 NBA.com photos

## Create Comprehensive Database - ALL 529 NBA.com Players

- [x] Start with all 529 NBA.com players as base
- [x] Add photo URLs for all 529 players from NBA.com
- [x] Merge NBA 2K26 ratings where players match (380 matched)
- [x] Leave rating blank for players not in 2K26 (149 players)
- [x] Add 143 NBA 2K26-only players (free agents, G-League)
- [x] Clean bad data entries (removed 2)
- [x] Update website with complete 672-player database
- [x] Create final checkpoint and deploy (version: a74f3f3f)

## Fix Missing Ratings for Major Stars

- [x] Investigate why Stephen Curry, Joel Embiid, Paul George, etc. don't have ratings
- [x] Search for these players in the original NBA 2K26 data
- [x] Create manual mappings for name variations (11 stars updated)
- [x] Update database with correct ratings
- [x] Verify all major stars have ratings
- [x] Re-extract ALL team rosters from 2kratings.com systematically
- [x] Use fuzzy matching to catch misspellings and name variations (80% threshold)
- [x] Merged user-provided CSV with 191 players
- [x] Update database with complete 2K26 ratings (86.3% coverage)
- [x] Update website with merged database
- [x] Create final checkpoint and publish (version: e405c720)

## Aggressive Fuzzy Search for 92 Missing Players

- [ ] Load all original NBA 2K26 data sources
- [ ] Implement multi-strategy matching (partial names, nicknames, last name only)
- [ ] Lower fuzzy match threshold to 60% for aggressive matching
- [ ] Manual verification of high-confidence matches
- [ ] Update database with found ratings
- [ ] Create final checkpoint with improved coverage

## Merge Additional Verified Ratings

- [x] Merge 36 verified ratings from user
- [x] Update database with new ratings (626/672 = 93.2%)
- [x] Update website with complete database
- [x] Calculate final coverage statistics
- [x] Create final checkpoint and publish (version: 0617328e)

## Extract Final 46 Player Ratings from 2kratings.com

- [ ] Search for Damian Lillard on 2kratings.com
- [ ] Search for Jerami Grant on 2kratings.com
- [ ] Search for remaining 44 players
- [ ] Update database with found ratings
- [ ] Create final checkpoint with maximum coverage

## Add In-House Player Comparison Tool

- [ ] Scrape badge totals for all 672 players from 2kratings.com
- [ ] Update database with badge counts
- [ ] Add "Compare" checkbox to player cards
- [ ] Create side-by-side comparison UI (photos, ratings, badges, team, position)
- [ ] Add link to view full comparison on 2kratings.com
- [ ] Deploy comparison feature

## Migrate to Database and Add Admin Panel

- [x] Fix Sion James rating (70 → 76 OVR)
- [x] Upgrade project to web-db-user (database + authentication)
- [x] Create database schema for players table
- [x] Migrate 672 players from JSON to PostgreSQL database
- [x] Create tRPC procedures for player CRUD operations
- [x] Build admin UI for editing players (overall, photo, links, badges)
- [x] Add role-based access control (owner + approved users)
- [x] Update frontend to fetch from database API instead of JSON files
- [ ] Test database-backed system
- [ ] Deploy with database migration complete

## Verify and Update Player Ratings

- [ ] Check Austin Reaves rating (should be 88 OVR)
- [ ] Apply all rating updates from first batch (Philadelphia, Milwaukee, Chicago, Cleveland, Boston, LA Clippers, Memphis, Atlanta, Miami, Indiana, New Orleans, Detroit, Toronto, Houston)
- [ ] Apply all rating updates from second batch (user will provide)
- [ ] Verify all updates in database
- [ ] Save checkpoint with corrected ratings

## Add User Authentication UI

- [x] Add login/logout button to header for user authentication
- [x] Fix OAuth login redirect to return to database website instead of Manus dashboard
- [x] Improve search to ignore capitalization, hyphens, apostrophes, and special characters
- [x] Add delete player functionality for owner-only in admin panel
- [x] Fix owner recognition issue in delete player functionality - Added debug endpoint
- [x] Change delete to allow all admins with two-step confirmation
- [x] Add fuzzy search to admin panel matching main search behavior
- [x] Sync database with new SZN17 roster (update existing, delete missing players)
- [x] Display team names in player cards
- [x] Add team filter dropdown
- [ ] Delete all players and repopulate from master CSV
- [ ] Add team/free agent badges to player cards

## Populate Missing Player Photos

- [x] Identify all players missing photos (empty or invalid photoUrl)
- [x] Search for missing player photo URLs from NBA.com headshots
- [x] Update database with found photo URLs (25 players updated) (20 players updated)
- [x] Verify photos display correctly on website
- [x] Save checkpoint with improved photo coverage (95.2% coverage - 612/643 players)

## Add Placeholder Images and Free Agent Badges

- [x] Create PlayerAvatar component with initials for players without photos
- [x] Add Free Agent badge component
- [x] Update player cards to show Free Agent badge when team is "Free Agent"
- [x] Update player cards to use PlayerAvatar fallback when photoUrl is missing
- [x] Test both features on the website
- [x] Save final checkpoint

## Add Team Logo Badges

- [x] Create team logo mapping with NBA.com logo URLs
- [x] Create TeamLogoBadge component
- [x] Update player cards to display team logo badges
- [x] Test team logos display correctly
- [x] Save checkpoint

## Team Roster Summary & Larger Badges

- [x] Increase team logo badge size (xl)
- [x] Add salary cap field to players table
- [x] Create TeamRosterSummary component with cap tracking
- [x] Display team summaries when filtering by team
- [x] Color-code cap status (green=under, neutral=at, red=over)
- [x] Test and save checkpoint

## Fix Cap System - Use Overall Ratings Sum

- [x] Remove salaryCap field from database schema (not needed)
- [x] Update TeamRosterSummary to calculate sum of overall ratings
- [x] Update component labels to show "Total Overall" instead of "Total Cap"
- [x] Update color coding logic (cap = 1098 max total overall ratings)
- [x] Test with team filter
- [x] Save corrected checkpoint

## Title Update & Team Summaries Table

- [x] Change page title to "Hall of Fame Basketball Association - SZN 17 Roster"
- [x] Update document title and metadata
- [x] Create sortable team summaries table showing all 28 teams
- [x] Adjust Free Agent display (no /14, just player count)
- [x] Move Free Agent to end of team sort order
- [x] Test and save checkpoint

## Admin Master Page for Team Management

- [x] Create /admin/master route (admin-only access)
- [x] Display all players in alphabetical order
- [x] Add team dropdown for each player
- [x] Create tRPC mutation to update player team
- [x] Add optimistic updates for better UX
- [x] Test team assignment changes
- [x] Save checkpoint

## Fix Team Summaries Table

- [x] Remove Status column (color already indicates status)
- [x] Exclude Free Agents from team summaries table
- [x] Add 76ers logo to teamLogos mapping
- [x] Test and save checkpoint

## Remove Duplicates & Fix Free Agents

- [x] Find duplicate players in database
- [x] Remove duplicate entries (keep one copy)
- [x] Report on duplicates removed
- [x] Fix Free Agents roster display (remove /14)
- [x] Move Free Agents to end of team dropdown
- [x] Test and save checkpoint

## Add Master Page Navigation

- [x] Add link to Master page from Admin page
- [x] Test navigation
- [x] Save checkpoint

## Restructure Admin Pages & Mobile Optimization

- [x] Swap routes: /admin → Team Management, /admin/players → Player Management
- [x] Rename Master.tsx to Admin.tsx and Admin.tsx to Players.tsx
- [x] Update App.tsx routes
- [x] Optimize team assignment interface for mobile (touch-friendly dropdowns)
- [x] Add responsive layout for mobile devices
- [x] Add navigation between admin pages
- [x] Test on mobile viewport
- [x] Save checkpoint

## Team Roster Screenshot Feature

- [x] Install html2canvas library
- [x] Add "Screenshot Roster" button when team is selected
- [x] Implement screenshot capture logic
- [x] Optimize screenshot layout for mobile sharing
- [x] Add download functionality
- [x] Test on mobile devices
- [x] Save checkpoint

## Screenshot Enhancements

- [x] Create screenshot header component with team logo and name
- [x] Add native share API for mobile devices
- [x] Update screenshot capture to include header
- [x] Add share button alongside screenshot button
- [x] Test share functionality on mobile
- [x] Save checkpoint

## Roster Card Fixes

- [x] Sort roster card players by overall rating (highest to lowest)
- [x] Fix roster card images to use image proxy to avoid CORS errors
- [ ] Convert OKLCH colors to RGB/HEX for html2canvas compatibility

## Admin Add Player & Bulk Trade Processor

- [x] Add "Add Player" button and form in admin panel
- [x] Create tRPC mutation for adding new players
- [x] Implement form validation (name, overall, team required)
- [ ] Add Bulk Trade Processor page at /admin/trades (UI rendering issue - backend complete)
- [x] Parse trade text format (Team Receive: Player (OVR))
- [x] Extract player names and destination teams from trade text
- [x] Update player teams in batch via tRPC mutation
- [x] Display trade summary before confirming
- [x] Test Add Player feature (working)
- [ ] Fix Bulk Trade Processor UI rendering issue
- [ ] Save checkpoint

## URGENT: Fix Bulk Trade Processor Bug

- [x] Investigate why bulk trade processor removed all players from teams (duplicate team names created)
- [x] Restore correct team assignments by merging duplicate teams
- [x] Verify trade processor only updates traded players, not all players
- [x] Add team name normalization to Trades.tsx (map full names to shortened names)
- [ ] Fix Trades.tsx UI rendering issue (deferred - backend works, UI can be fixed later)
- [x] Delete Test Player from database
- [ ] Save recovery checkpoint with fixes

## Add Go Home Button to All Secondary Pages

- [x] Add "Go Home" button to Admin page (/admin) - already existed
- [x] Add "Go Home" button to Players management page (/admin/players)
- [x] Test navigation from all pages (Home button working on Players page)
- [ ] Save checkpoint

## Create Minimal Bulk Transactions Page

- [x] Rename from "Bulk Trades" to "Bulk Transactions"
- [x] Create super minimal UI with basic HTML/CSS (no fancy components)
- [x] Support trade transactions (player moves between teams)
- [x] Support free agent signings (players joining teams)
- [x] Update all navigation links to use new name
- [ ] Fix persistent UI rendering issue (content exists in DOM but invisible)
- [x] Backend functionality complete and working
- [ ] Save checkpoint with working features

## Transaction History Log

- [x] Create database schema for transaction_history table
- [x] Add fields: id, player_id, player_name, from_team, to_team, admin_id, admin_name, timestamp, transaction_type
- [x] Update player.updateTeam mutation to log all team changes
- [x] Create tRPC endpoint to fetch transaction history
- [x] Create Transaction History page at /admin/history
- [x] Display transactions in reverse chronological order
- [x] Add filtering by player, team, or date range
- [x] Add navigation link to Transaction History from admin pages
- [x] Test transaction logging (LeBron James Spurs → Lakers recorded successfully)
- [ ] Fix Transaction History page UI rendering issue (same as Bulk Transactions)
- [ ] Save checkpoint

## CSV Export for Transaction History

- [x] Add CSV export function to History page
- [x] Export filtered transactions (respects search term)
- [x] Include all fields: player name, from team, to team, admin name, transaction type, timestamp
- [x] Add Export CSV button to History page header
- [x] Test CSV export button (visible and clickable)
- [ ] CSV export returns empty file due to History page rendering issue
- [ ] Save checkpoint with CSV export feature implementation

## Simplified Bulk Transaction Format

- [x] Update parseTrades function to support simplified format
- [x] Parse "Player to Team" format (e.g., "Alexander-Walker to Thunder")
- [x] Support both detailed trade format and simplified format in same input
- [x] Update placeholder and format instructions
- [ ] Test with example: Alexander-Walker to Thunder, Keon Ellis to Pistons, etc.
- [ ] Save checkpoint

## URGENT: Fix Critical Bugs

- [x] Roster card download function not working - FIXED with onclone to convert OKLCH to hex
- [ ] Bulk Transactions UI invisible (textarea and buttons not rendering)
- [x] Test roster card download with Jazz team (14 players, all photos visible!)
- [ ] Test Bulk Transactions with simplified format
- [ ] Save checkpoint with roster card fix

## New Roster Card Layout (5+ Players)

- [x] Update RosterCard component to detect when 5+ players are selected
- [x] Sort players by overall rating (highest first)
- [x] Create top row layout: Player 1 | Team Logo | Player 2
- [x] Make top 2 player cards larger than bottom rows
- [x] Create rows of 3 players for remaining players
- [x] Add team logo badge overlay on each player photo
- [x] Test with Jazz team (14 players) - PERFECT! Top 2 + logo + rows of 3
- [ ] Save checkpoint with new layout

## Fix Roster Card Mobile Formatting

- [x] Remove team logo badges from player photos (not loading properly)
- [x] Fix text overflow - names are cut off (e.g., "Karl-Anthony Towns" split across lines, "Jalen S..." truncated)
- [x] Fix mobile card width - right side of card is cut off (changed to width: 100%, maxWidth: 800px)
- [x] Ensure proper text wrapping and ellipsis for long names (added overflow: hidden, textOverflow: ellipsis, whiteSpace: nowrap)
- [x] Test with Wizards team (14 players with long names) - ALL NAMES VISIBLE!
- [ ] Save checkpoint with mobile fixes

## URGENT: Fix Roster Card Name Truncation in Downloaded PNG

- [x] Names still being cut off in downloaded PNG despite CSS fixes
- [x] Ellipsis/overflow CSS doesn't work in html2canvas
- [x] Examples: "Mikal Bridges", "Jalen S...", "Ben Sim...", "Matisse Thybulle", "Eugene O..." all truncated
- [x] Removed whiteSpace: nowrap to allow text wrapping
- [x] Reduced font size (top: 17px, bottom: 13px) and added lineHeight
- [x] Added minHeight and flexbox centering for consistent spacing
- [x] Test with Wizards team (has longest names) - ALL NAMES FULLY VISIBLE!
- [x] Verify all 14 names are fully visible in downloaded PNG - PERFECT!
- [ ] Save checkpoint with fix

## Fix Roster Card Layout Issues

- [ ] Fix JSX syntax errors in RosterCard component (malformed div tags)
- [ ] KEEP team logo in center and make it load properly (use image proxy)
- [ ] Remove "Avg 78 OVR" text (keep player count)
- [ ] Player overall badges already moved to bottom-right
- [ ] Test with Wizards team
- [ ] Save checkpoint with fixes

## Bulk Transactions Parse/Preview Feature

- [x] Add "Parse" button to bulk transactions page
- [x] Implement transaction parsing logic to preview results
- [x] Display parsed transactions in a preview table showing what will change
- [x] Add "Process" button that only appears after successful parsing
- [x] Add confirmation step before processing transactions
- [x] Test parse and process workflow
- [x] Save checkpoint

## Bulk Team Assignment for Admins

- [x] Add "Assign Team" button next to "Generate Roster Card" (admin-only)
- [x] Create team selection dialog/dropdown
- [x] Implement bulk team assignment using existing updateTeam mutation
- [x] Add confirmation dialog before processing assignment
- [x] Show success/error feedback after assignment
- [ ] Test with multiple selected players
- [ ] Save checkpoint

## Fix CSV Export to Include Team Affiliations

- [x] Update CSV export functionality to include team column
- [x] Generate CSV file with all player data and team affiliations
- [x] Deliver CSV file to user

## Salary Cap Display Enhancements

- [x] Add total salary cap display to roster card when all 14 team players are selected
- [x] Show amount over cap on roster card if team exceeds cap limit
- [x] Add over-cap indicator (+X) to homepage team table for teams over cap
- [x] Test roster card with full team selection
- [x] Test homepage team table with over-cap teams
- [x] Save checkpoint

## Fix Over-Cap Calculation

- [x] Change over-cap formula from salary cap to total overall rating
- [x] Use formula: totalOverall - 1098 for over-cap amount
- [x] Test with teams like Bucks (1106 → +8)
- [x] Save checkpoint

## Discord Webhook Integration

- [x] Create Discord webhook endpoint for posting team cap status
- [x] Build embed generator with color-coded cap status (green/yellow/red)
- [x] Add clickable team links that filter to specific team on website
- [x] Create admin UI for configuring Discord webhook URL
- [x] Add manual refresh button for admins
- [x] Test Discord embed posting and link functionality
- [x] Document setup instructions
- [x] Save checkpoint

## Discord Auto-Update System

- [x] Create database table for Discord configuration (webhook URL, message ID, enabled status)
- [x] Add admin UI to save Discord configuration
- [x] Implement auto-update trigger when team assignments change
- [x] Add toggle to enable/disable auto-updates
- [x] Add rate limiting to prevent spam (max 1 update per minute)
- [x] Test auto-update when assigning players to teams
- [x] Document auto-update feature
- [x] Save checkpoint
