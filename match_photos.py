#!/usr/bin/env python3
"""
Match missing players with NBA.com player IDs and generate photo URLs
"""
import json
import unicodedata
import re

def normalize_name(name):
    """Normalize player name for matching"""
    # Remove accents/diacritics
    name = unicodedata.normalize('NFD', name)
    name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
    # Remove spaces, dots, apostrophes, hyphens, Jr/Sr/III/II
    name = re.sub(r'[\s\.\'\-]', '', name)
    name = re.sub(r'(Jr|Sr|III|II|IV)$', '', name, flags=re.IGNORECASE)
    return name.lower().strip()

# Load NBA.com players
with open('/home/ubuntu/nba2k26-database/nba_all_players.json') as f:
    nba_players = json.load(f)

# Create normalized lookup
nba_lookup = {}
for player in nba_players:
    norm_name = normalize_name(player['name'])
    nba_lookup[norm_name] = player

print(f"Loaded {len(nba_players)} NBA.com players")
print(f"Sample normalized names: {list(nba_lookup.keys())[:5]}")

# Missing players from our database
missing_players = [
    "AJ Lawson", "Adam Flagler", "Adama Sanogo", "Alec Burks", "Alex Ducas",
    "Alex Reese", "Alondes Williams", "Andre Jackson Jr", "Anton Watson", "Armel Traoré",
    "B. Bule", "Ben Simmons", "Brandon Boston Jr.", "Braxton Key", "Bronny James Jr",
    "Bruno Fernando", "C.J. McCollum", "Cam Reddish", "Cameron Payne", "Chris Duarte",
    "Christian Wood", "Chuma Okeke", "Cody Zeller", "Cory Joseph", "Cui Yongxi",
    "DJ Carton", "DJ Steward", "DaQuan Jeffries", "Daishen Nix", "Dalano Banton",
    "Damion Baugh", "Daniel Theis", "Dariq Whitehead", "David Duke Jr", "David Roddy",
    "Delon Wright", "Derrick Jones Jr", "De'Aaron Fox", "Dillon Jones", "Drew Timme",
    "EJ Harkless", "Elfrid Payton", "Eli Ndiaye", "Emoni Bates", "Erik Stevenson",
    "Eugene Omoruyi", "Garrison Mathews", "Gary Trent Jr", "Isaiah Mobley", "Isaiah Wong",
    "J. Edwards", "J.T. Thor", "Jabari Smith Jr", "Jack McVeigh", "Jaden Springer",
    "Jae Crowder", "Jahlil Okafor", "Jaime Jaquez Jr", "Jalen Bridges", "Jalen Crutcher",
    "Jalen Hood-Schifino", "Jalen McDaniels", "Jamaree Bouyea", "James Johnson", "Jared Butler",
    "Jared Rhoden", "Jaren Jackson Jr", "Jason Preston", "Javante McCoy", "Jaylen Nowell",
    "Jazian Gortman", "Jeff Dowtin", "Jimmy Butler", "Johnny Davis", "Josh Christopher",
    "Justin Minaya", "Kai Jones", "Kelly Oubre Jr", "Kenyon Martin Jr.", "Keon Johnson",
    "Kessler Edwards", "Kevin Knox II", "Kevin Porter Jr", "Killian Hayes", "Kobe Bufkin",
    "Kylor Kelley", "Lamar Stevens", "Larry Nance Jr", "Lester Quinones", "Liam McNeely",
    "Liam Robbins", "Lonnie Walker IV", "Malachi Flynn", "Malevy Leons", "Marcus Bagley",
    "Marcus Garrett", "Markelle Fultz", "Maxwell Lewis", "Micah Potter", "Michael Porter Jr",
    "Mohamed Bamba", "Moses Brown", "Nate Williams", "Oshae Brissett", "P.J. Tucker",
    "PJ Dozier", "Patty Mills", "Phillip Wheeler", "Quincy Olivari", "R.J. Barrett",
    "Reece Beekman", "Reggie Jackson", "Ricky Council IV", "Ron Holland", "Seth Curry",
    "Seth Lundy", "Skal Labissiere", "Stanley Umude", "Steph Curry", "Taj Gibson",
    "Taran Armstrong", "Taze Moore", "Terence Davis", "Terrence Shannon Jr", "Terry Rozier III",
    "Terry Taylor", "Torrey Craig", "Trevelin Queen", "Trey Lyles", "Tristan Thompson",
    "Tristen Newton", "Ulrich Chomche", "Vlatko Cancar", "Walter Clayton Jr", "Wendell Carter Jr",
    "Wendell Moore Jr", "Xavier Tillman Sr.", "Yuki Kawamura", "Yuri Collins", "Zyon Pullin"
]

# Match players
matches = []
unmatched = []

for player_name in missing_players:
    norm_name = normalize_name(player_name)
    
    if norm_name in nba_lookup:
        nba_player = nba_lookup[norm_name]
        photo_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{nba_player['id']}.png"
        matches.append({
            'db_name': player_name,
            'nba_name': nba_player['name'],
            'player_id': nba_player['id'],
            'photo_url': photo_url
        })
        print(f"✓ Matched: {player_name} → {nba_player['name']} (ID: {nba_player['id']})")
    else:
        unmatched.append(player_name)
        print(f"✗ No match: {player_name} (normalized: {norm_name})")

print(f"\n=== Summary ===")
print(f"Matched: {len(matches)}")
print(f"Unmatched: {len(unmatched)}")

# Save matches
with open('/home/ubuntu/nba2k26-database/photo_matches.json', 'w') as f:
    json.dump(matches, f, indent=2)

if unmatched:
    print(f"\nUnmatched players:")
    for name in unmatched:
        print(f"  - {name}")
