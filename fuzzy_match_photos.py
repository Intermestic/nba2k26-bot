#!/usr/bin/env python3
"""
Fuzzy match missing players with NBA.com player IDs
"""
import json
import unicodedata
import re
from difflib import SequenceMatcher

def normalize_name(name):
    """Normalize player name for matching"""
    # Remove accents/diacritics
    name = unicodedata.normalize('NFD', name)
    name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
    # Remove spaces, dots, apostrophes, hyphens, Jr/Sr/III/II/IV
    name = re.sub(r'[\s\.\'\-]', '', name)
    name = re.sub(r'(Jr|Sr|III|II|IV)$', '', name, flags=re.IGNORECASE)
    return name.lower().strip()

def similarity(a, b):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, a, b).ratio()

# Load NBA.com players
with open('/home/ubuntu/nba2k26-database/nba_all_players.json') as f:
    nba_players = json.load(f)

print(f"Loaded {len(nba_players)} NBA.com players")

# Unmatched players from previous run
unmatched_players = [
    "Adam Flagler", "Adama Sanogo", "Alec Burks", "Alex Ducas", "Alex Reese",
    "Alondes Williams", "Anton Watson", "Armel Traoré", "B. Bule", "Ben Simmons",
    "Brandon Boston Jr.", "Braxton Key", "Bruno Fernando", "Cam Reddish", "Cameron Payne",
    "Chris Duarte", "Christian Wood", "Chuma Okeke", "Cody Zeller", "Cory Joseph",
    "Cui Yongxi", "DJ Carton", "DJ Steward", "DaQuan Jeffries", "Daishen Nix",
    "Dalano Banton", "Damion Baugh", "Daniel Theis", "Dariq Whitehead", "David Duke Jr",
    "David Roddy", "Delon Wright", "Dillon Jones", "Drew Timme", "EJ Harkless",
    "Elfrid Payton", "Eli Ndiaye", "Emoni Bates", "Erik Stevenson", "Eugene Omoruyi",
    "Garrison Mathews", "Isaiah Mobley", "Isaiah Wong", "J. Edwards", "J.T. Thor",
    "Jack McVeigh", "Jaden Springer", "Jae Crowder", "Jahlil Okafor", "Jalen Bridges",
    "Jalen Crutcher", "Jalen Hood-Schifino", "Jalen McDaniels", "Jamaree Bouyea",
    "James Johnson", "Jared Butler", "Jared Rhoden", "Jason Preston", "Javante McCoy",
    "Jaylen Nowell", "Jazian Gortman", "Jeff Dowtin", "Johnny Davis", "Josh Christopher",
    "Justin Minaya", "Kai Jones", "Kenyon Martin Jr.", "Keon Johnson", "Kessler Edwards",
    "Kevin Knox II", "Killian Hayes", "Kobe Bufkin", "Kylor Kelley", "Lamar Stevens",
    "Lester Quinones", "Liam McNeely", "Liam Robbins", "Lonnie Walker IV", "Malachi Flynn",
    "Malevy Leons", "Marcus Bagley", "Marcus Garrett", "Markelle Fultz", "Maxwell Lewis",
    "Micah Potter", "Mohamed Bamba", "Moses Brown", "Nate Williams", "Oshae Brissett",
    "P.J. Tucker", "PJ Dozier", "Patty Mills", "Phillip Wheeler", "Quincy Olivari",
    "R.J. Barrett", "Reece Beekman", "Reggie Jackson", "Ricky Council IV", "Ron Holland",
    "Seth Curry", "Seth Lundy", "Skal Labissiere", "Stanley Umude", "Steph Curry",
    "Taj Gibson", "Taran Armstrong", "Taze Moore", "Terence Davis", "Terry Taylor",
    "Torrey Craig", "Trevelin Queen", "Trey Lyles", "Tristan Thompson", "Tristen Newton",
    "Ulrich Chomche", "Vlatko Cancar", "Yuki Kawamura", "Yuri Collins", "Zyon Pullin"
]

# Fuzzy match with threshold
THRESHOLD = 0.75  # 75% similarity required
matches = []
unmatched = []

for player_name in unmatched_players:
    norm_name = normalize_name(player_name)
    
    # Find best match
    best_match = None
    best_score = 0
    
    for nba_player in nba_players:
        nba_norm = normalize_name(nba_player['name'])
        score = similarity(norm_name, nba_norm)
        
        if score > best_score:
            best_score = score
            best_match = nba_player
    
    if best_score >= THRESHOLD:
        photo_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{best_match['id']}.png"
        matches.append({
            'db_name': player_name,
            'nba_name': best_match['name'],
            'player_id': best_match['id'],
            'photo_url': photo_url,
            'similarity': round(best_score, 3)
        })
        print(f"✓ Matched ({best_score:.1%}): {player_name} → {best_match['name']} (ID: {best_match['id']})")
    else:
        unmatched.append({
            'name': player_name,
            'best_match': best_match['name'] if best_match else None,
            'score': round(best_score, 3)
        })
        print(f"✗ No match: {player_name} (best: {best_match['name'] if best_match else 'none'} at {best_score:.1%})")

print(f"\n=== Summary ===")
print(f"Matched: {len(matches)}")
print(f"Unmatched: {len(unmatched)}")

# Save matches
with open('/home/ubuntu/nba2k26-database/fuzzy_photo_matches.json', 'w') as f:
    json.dump(matches, f, indent=2)

# Save unmatched with best guesses
with open('/home/ubuntu/nba2k26-database/unmatched_players.json', 'w') as f:
    json.dump(unmatched, f, indent=2)

if len(matches) > 0:
    print(f"\nTop matches:")
    for m in sorted(matches, key=lambda x: x['similarity'], reverse=True)[:10]:
        print(f"  {m['db_name']} → {m['nba_name']} ({m['similarity']:.1%})")
