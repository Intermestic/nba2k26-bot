#!/usr/bin/env python3
"""
Generate seed data for FA window signings from the 2025 NBA off-season
"""

import json
from datetime import datetime

# Major FA signings from 2025 off-season
fa_signings = [
    # July 6 - Top-tier signings
    {"playerName": "Deandre Ayton", "newTeam": "Los Angeles Lakers", "formerTeam": "Portland Trail Blazers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 1, "notes": "Waived on June 29"},
    {"playerName": "James Harden", "newTeam": "Los Angeles Clippers", "formerTeam": "Los Angeles Clippers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Kyrie Irving", "newTeam": "Dallas Mavericks", "formerTeam": "Dallas Mavericks", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Brook Lopez", "newTeam": "Los Angeles Clippers", "formerTeam": "Milwaukee Bucks", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Myles Turner", "newTeam": "Milwaukee Bucks", "formerTeam": "Indiana Pacers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Fred VanVleet", "newTeam": "Houston Rockets", "formerTeam": "Houston Rockets", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Tyus Jones", "newTeam": "Orlando Magic", "formerTeam": "Phoenix Suns", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Clint Capela", "newTeam": "Houston Rockets", "formerTeam": "Atlanta Hawks", "signedDate": "2025-07-06", "contractType": "Sign-and-Trade", "isSignAndTrade": 1},
    {"playerName": "Nicolas Batum", "newTeam": "Los Angeles Clippers", "formerTeam": "Los Angeles Clippers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Justin Edwards", "newTeam": "Philadelphia 76ers", "formerTeam": "Philadelphia 76ers", "signedDate": "2025-07-06", "contractType": "RFA", "isRFA": 1},
    {"playerName": "Dorian Finney-Smith", "newTeam": "Houston Rockets", "formerTeam": "Los Angeles Lakers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Jaxson Hayes", "newTeam": "Los Angeles Lakers", "formerTeam": "Los Angeles Lakers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Joe Ingles", "newTeam": "Minnesota Timberwolves", "formerTeam": "Minnesota Timberwolves", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Tre Jones", "newTeam": "Chicago Bulls", "formerTeam": "Chicago Bulls", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Jake LaRavia", "newTeam": "Los Angeles Lakers", "formerTeam": "Sacramento Kings", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Sam Merrill", "newTeam": "Cleveland Cavaliers", "formerTeam": "Cleveland Cavaliers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Ajay Mitchell", "newTeam": "Oklahoma City Thunder", "formerTeam": "Oklahoma City Thunder", "signedDate": "2025-07-06", "contractType": "RFA", "isRFA": 1},
    {"playerName": "Larry Nance Jr.", "newTeam": "Cleveland Cavaliers", "formerTeam": "Atlanta Hawks", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Bobby Portis", "newTeam": "Milwaukee Bucks", "formerTeam": "Milwaukee Bucks", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "D'Angelo Russell", "newTeam": "Dallas Mavericks", "formerTeam": "Brooklyn Nets", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Guerschon Yabusele", "newTeam": "New York Knicks", "formerTeam": "Philadelphia 76ers", "signedDate": "2025-07-06", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Nickeil Alexander-Walker", "newTeam": "Atlanta Hawks", "formerTeam": "Minnesota Timberwolves", "signedDate": "2025-07-06", "contractType": "Sign-and-Trade", "isSignAndTrade": 1},
    
    # July 7 signings
    {"playerName": "Jordan Clarkson", "newTeam": "New York Knicks", "formerTeam": "Utah Jazz", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 1, "notes": "Waived on July 1"},
    {"playerName": "Luka Garza", "newTeam": "Boston Celtics", "formerTeam": "Minnesota Timberwolves", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Luke Kornet", "newTeam": "San Antonio Spurs", "formerTeam": "Boston Celtics", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Caris LeVert", "newTeam": "Detroit Pistons", "formerTeam": "Atlanta Hawks", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Kevon Looney", "newTeam": "New Orleans Pelicans", "formerTeam": "Golden State Warriors", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Kyle Lowry", "newTeam": "Philadelphia 76ers", "formerTeam": "Philadelphia 76ers", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Davion Mitchell", "newTeam": "Miami Heat", "formerTeam": "Miami Heat", "signedDate": "2025-07-07", "contractType": "RFA", "isRFA": 1},
    {"playerName": "Duncan Robinson", "newTeam": "Detroit Pistons", "formerTeam": "Miami Heat", "signedDate": "2025-07-07", "contractType": "Sign-and-Trade", "isSignAndTrade": 1},
    {"playerName": "Dennis Schröder", "newTeam": "Sacramento Kings", "formerTeam": "Detroit Pistons", "signedDate": "2025-07-07", "contractType": "Sign-and-Trade", "isSignAndTrade": 1},
    {"playerName": "Gary Trent Jr.", "newTeam": "Milwaukee Bucks", "formerTeam": "Milwaukee Bucks", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Moritz Wagner", "newTeam": "Orlando Magic", "formerTeam": "Orlando Magic", "signedDate": "2025-07-07", "contractType": "Free Agent", "isWaived": 0},
    
    # July 14-15 signings
    {"playerName": "Ty Jerome", "newTeam": "Memphis Grizzlies", "formerTeam": "Cleveland Cavaliers", "signedDate": "2025-07-14", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Naz Reid", "newTeam": "Minnesota Timberwolves", "formerTeam": "Minnesota Timberwolves", "signedDate": "2025-07-14", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Santi Aldama", "newTeam": "Memphis Grizzlies", "formerTeam": "Memphis Grizzlies", "signedDate": "2025-07-15", "contractType": "RFA", "isRFA": 1},
    {"playerName": "Julius Randle", "newTeam": "Minnesota Timberwolves", "formerTeam": "Minnesota Timberwolves", "signedDate": "2025-07-15", "contractType": "Free Agent", "isWaived": 0},
    
    # High-profile waived players
    {"playerName": "Bradley Beal", "newTeam": "Los Angeles Clippers", "formerTeam": "Phoenix Suns", "signedDate": "2025-07-18", "contractType": "Free Agent", "isWaived": 1, "notes": "Waived on July 16"},
    {"playerName": "Damian Lillard", "newTeam": "Portland Trail Blazers", "formerTeam": "Milwaukee Bucks", "signedDate": "2025-07-19", "contractType": "Free Agent", "isWaived": 1, "notes": "Waived on July 7"},
    {"playerName": "Chris Paul", "newTeam": "Los Angeles Clippers", "formerTeam": "San Antonio Spurs", "signedDate": "2025-07-21", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Marcus Smart", "newTeam": "Los Angeles Lakers", "formerTeam": "Washington Wizards", "signedDate": "2025-07-22", "contractType": "Free Agent", "isWaived": 1, "notes": "Waived on July 20"},
    
    # July 1 signings
    {"playerName": "Eric Gordon", "newTeam": "Philadelphia 76ers", "formerTeam": "Philadelphia 76ers", "signedDate": "2025-07-01", "contractType": "Free Agent", "isWaived": 0},
    {"playerName": "Garrett Temple", "newTeam": "Toronto Raptors", "formerTeam": "Toronto Raptors", "signedDate": "2025-07-01", "contractType": "Free Agent", "isWaived": 0},
]

# Generate SQL insert statements
def generate_sql():
    sql_statements = []
    for i, signing in enumerate(fa_signings, 1):
        player_id = f"fa2025_{i:03d}"
        is_waived = signing.get("isWaived", 0)
        is_rfa = signing.get("isRFA", 0)
        is_sign_and_trade = signing.get("isSignAndTrade", 0)
        notes = signing.get("notes", "")
        former_team = signing.get("formerTeam", "")
        
        sql = f"""INSERT INTO fa_window_signings (playerId, playerName, newTeam, formerTeam, signedDate, contractType, isWaived, isRFA, isSignAndTrade, notes) VALUES ('{player_id}', '{signing['playerName']}', '{signing['newTeam']}', '{former_team}', '{signing['signedDate']}', '{signing['contractType']}', {is_waived}, {is_rfa}, {is_sign_and_trade}, '{notes}');"""
        sql_statements.append(sql)
    
    return sql_statements

# Generate JSON for reference
def generate_json():
    return json.dumps(fa_signings, indent=2)

if __name__ == "__main__":
    # Write SQL file
    with open("/home/ubuntu/nba2k26-database/seed-fa-signings.sql", "w") as f:
        f.write("-- FA Window Signings Seed Data (2025 NBA Off-Season)\n\n")
        for sql in generate_sql():
            f.write(sql + "\n")
    
    # Write JSON file for reference
    with open("/home/ubuntu/nba2k26-database/fa-signings-data.json", "w") as f:
        f.write(generate_json())
    
    print(f"Generated seed data for {len(fa_signings)} FA signings")
    print("Files created:")
    print("  - seed-fa-signings.sql")
    print("  - fa-signings-data.json")
