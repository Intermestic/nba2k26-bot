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
