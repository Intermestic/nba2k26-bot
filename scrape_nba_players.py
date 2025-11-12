#!/usr/bin/env python3
"""
Scrape NBA.com players page to get all player IDs and names
"""
import requests
from bs4 import BeautifulSoup
import json
import re

# Fetch the NBA players page
url = "https://www.nba.com/players"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print("Fetching NBA.com players page...")
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Find all player links
player_links = soup.find_all('a', href=re.compile(r'/player/\d+/'))

players = []
seen_ids = set()

for link in player_links:
    href = link.get('href')
    # Extract player ID from URL like /player/1630173/precious-achiuwa
    match = re.search(r'/player/(\d+)/([^/]+)', href)
    if match:
        player_id = match.group(1)
        player_slug = match.group(2)
        
        if player_id not in seen_ids:
            seen_ids.add(player_id)
            
            # Get player name from link text or slug
            player_name = link.get_text(strip=True)
            if not player_name:
                # Convert slug to name
                player_name = player_slug.replace('-', ' ').title()
            
            players.append({
                'id': player_id,
                'name': player_name,
                'slug': player_slug,
                'photo_url': f'https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png'
            })

print(f"Found {len(players)} unique players")

# Save to JSON
with open('/home/ubuntu/nba2k26-database/nba_players_scraped.json', 'w') as f:
    json.dump(players, f, indent=2)

print(f"Saved to nba_players_scraped.json")

# Print first 10 for verification
print("\nFirst 10 players:")
for p in players[:10]:
    print(f"  {p['name']} (ID: {p['id']})")
