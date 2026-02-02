#!/usr/bin/env python3
"""
HoFBA Season 17 Playoff Bracket Updater
========================================
This script updates the playoff bracket with series results.
Edit the SERIES_RESULTS dictionary to update scores and winners.

Usage: python3 update_bracket.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Load the original bracket as the base
ORIGINAL_BRACKET = '/home/ubuntu/hofsn/client/public/szn17-playoff-bracket.png'
OUTPUT_BRACKET = '/home/ubuntu/hofsn/client/public/szn17-playoff-bracket-current.png'

# ============================================
# EDIT THIS SECTION TO UPDATE SERIES RESULTS
# ============================================
# winner: 0 = top team wins, 1 = bottom team wins, None = series not complete
# score: "X-Y" format where X is winner's wins, Y is loser's wins

SERIES_RESULTS = {
    # LEFT SIDE MATCHUPS
    0: {"score": "2-0", "winner": 0, "team": "Toronto Raptors"},    # (1) Raptors vs (16) Pacers
    1: {"score": None, "winner": None, "team": None},               # (8) Spurs vs (9) Bucks
    2: {"score": None, "winner": None, "team": None},               # (4) Wizards vs (13) Trail Blazers
    3: {"score": None, "winner": None, "team": None},               # (5) Rockets vs (12) Cavaliers
    
    # RIGHT SIDE MATCHUPS
    4: {"score": None, "winner": None, "team": None},               # (2) Hawks vs (15) Hornets
    5: {"score": None, "winner": None, "team": None},               # (7) Nuggets vs (10) Jazz
    6: {"score": None, "winner": None, "team": None},               # (3) Kings vs (14) Bulls
    7: {"score": None, "winner": None, "team": None},               # (6) Pistons vs (11) Mavericks
}

# Round 2 results (after first round is complete)
ROUND2_RESULTS = {
    0: {"score": None, "winner": None, "team": None},  # Winner of 0 vs Winner of 1
    1: {"score": None, "winner": None, "team": None},  # Winner of 2 vs Winner of 3
    2: {"score": None, "winner": None, "team": None},  # Winner of 4 vs Winner of 5
    3: {"score": None, "winner": None, "team": None},  # Winner of 6 vs Winner of 7
}

# Conference Finals results
CONF_FINALS_RESULTS = {
    0: {"score": None, "winner": None, "team": None},  # Left conference
    1: {"score": None, "winner": None, "team": None},  # Right conference
}

# Championship result
CHAMPIONSHIP_RESULT = {"score": None, "winner": None, "team": None}

# ============================================
# END OF EDITABLE SECTION
# ============================================

# Team logo positions in original bracket
TEAM_LOGOS = {
    "Toronto Raptors": (45, 55, 125, 135),
    "Indiana Pacers": (45, 165, 125, 245),
    "San Antonio Spurs": (45, 285, 125, 365),
    "Milwaukee Bucks": (45, 395, 125, 475),
    "Washington Wizards": (45, 525, 125, 605),
    "Portland Trail Blazers": (45, 635, 125, 715),
    "Houston Rockets": (45, 775, 125, 855),
    "Cleveland Cavaliers": (45, 885, 125, 965),
    "Atlanta Hawks": (1923, 55, 2003, 135),
    "Charlotte Hornets": (1923, 165, 2003, 245),
    "Denver Nuggets": (1923, 285, 2003, 365),
    "Utah Jazz": (1923, 395, 2003, 475),
    "Sacramento Kings": (1923, 525, 2003, 605),
    "Chicago Bulls": (1923, 635, 2003, 715),
    "Detroit Pistons": (1923, 775, 2003, 855),
    "Dallas Mavericks": (1923, 885, 2003, 965),
}

def update_bracket():
    """Update the bracket with current series results"""
    original = Image.open(ORIGINAL_BRACKET).convert('RGBA')
    img = original.copy()
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    try:
        font_score = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
        font_team = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except:
        font_score = ImageFont.load_default()
        font_team = font_score
    
    GOLD_BRIGHT = (255, 215, 0)
    GOLD = (212, 175, 55)
    WHITE = (255, 255, 255)
    DARK_BG = (15, 20, 40, 200)
    
    # Score positions
    LEFT_SCORE_POSITIONS = [(295, 180), (295, 400), (295, 640), (295, 880)]
    RIGHT_SCORE_POSITIONS = [(1753, 180), (1753, 400), (1753, 640), (1753, 880)]
    
    # Round 2 slot positions
    LEFT_R2_SLOTS = [(385, 200), (385, 660)]
    RIGHT_R2_SLOTS = [(1563, 200), (1563, 660)]
    
    # Draw first round scores
    for i, (x, y) in enumerate(LEFT_SCORE_POSITIONS):
        result = SERIES_RESULTS.get(i)
        if result and result["score"]:
            bbox = draw.textbbox((x, y), result["score"], font=font_score, anchor="mm")
            padding = 5
            draw.rectangle((bbox[0]-padding, bbox[1]-padding, bbox[2]+padding, bbox[3]+padding),
                          fill=DARK_BG, outline=GOLD, width=2)
            draw.text((x, y), result["score"], fill=GOLD_BRIGHT, font=font_score, anchor="mm")
    
    for i, (x, y) in enumerate(RIGHT_SCORE_POSITIONS):
        result = SERIES_RESULTS.get(i + 4)
        if result and result["score"]:
            bbox = draw.textbbox((x, y), result["score"], font=font_score, anchor="mm")
            padding = 5
            draw.rectangle((bbox[0]-padding, bbox[1]-padding, bbox[2]+padding, bbox[3]+padding),
                          fill=DARK_BG, outline=GOLD, width=2)
            draw.text((x, y), result["score"], fill=GOLD_BRIGHT, font=font_score, anchor="mm")
    
    # Fill Round 2 slots with winners
    for i, (x, y) in enumerate(LEFT_R2_SLOTS):
        matchup_idx = i * 2  # 0 or 2
        result = SERIES_RESULTS.get(matchup_idx)
        if result and result["winner"] is not None and result["team"]:
            team = result["team"]
            if team in TEAM_LOGOS:
                logo = original.crop(TEAM_LOGOS[team])
                logo = logo.resize((75, 75), Image.Resampling.LANCZOS)
                img.paste(logo, (x + 12, y + 5), logo)
                abbrev = team.split()[-1][:3].upper()
                draw.text((x + 50, y + 85), abbrev, fill=WHITE, font=font_team, anchor="mm")
    
    for i, (x, y) in enumerate(RIGHT_R2_SLOTS):
        matchup_idx = (i * 2) + 4  # 4 or 6
        result = SERIES_RESULTS.get(matchup_idx)
        if result and result["winner"] is not None and result["team"]:
            team = result["team"]
            if team in TEAM_LOGOS:
                logo = original.crop(TEAM_LOGOS[team])
                logo = logo.resize((75, 75), Image.Resampling.LANCZOS)
                img.paste(logo, (x + 12, y + 5), logo)
                abbrev = team.split()[-1][:3].upper()
                draw.text((x + 50, y + 85), abbrev, fill=WHITE, font=font_team, anchor="mm")
    
    # Save result
    img = img.convert('RGB')
    img.save(OUTPUT_BRACKET, 'PNG', quality=95)
    print(f"Bracket updated: {OUTPUT_BRACKET}")

if __name__ == "__main__":
    update_bracket()
