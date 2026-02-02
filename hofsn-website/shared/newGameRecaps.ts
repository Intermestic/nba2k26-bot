// Season 17 Game Recaps - Latest Games (Nov 16, 2025)

export interface GameRecap {
  id: string;
  title: string;
  date: string;
  teams: {
    away: { name: string; abbr: string; score: number };
    home: { name: string; abbr: string; score: number };
  };
  headline: string;
  summary: string;
  keyPlayers: Array<{
    name: string;
    team: string;
    stats: string;
  }>;
  highlights: string[];
  featured?: boolean;
}

export const season17GameRecaps: GameRecap[] = [
  {
    id: "NYK-PHI-S17-001",
    title: "Booker's 45-Point Explosion Powers Knicks Past 76ers",
    date: "November 16, 2025",
    teams: {
      away: { name: "New York Knicks", abbr: "NYK", score: 98 },
      home: { name: "Philadelphia 76ers", abbr: "PHI", score: 94 }
    },
    headline: "Devin Booker Delivers Career Performance in Thrilling Knicks Victory",
    summary: "In what can only be described as a statement game, Devin Booker put the league on notice with a jaw-dropping 45-point performance to lead the Knicks to a hard-fought 98-94 victory over the 76ers. Booker was unstoppable, shooting 17-32 from the field and draining 9 three-pointers while dishing out 10 assists in a complete offensive masterclass. The win marks a significant moment for the Knicks, who have struggled this season, as Booker's brilliance finally translated into a crucial road victory. The 76ers fought valiantly behind Jaden McDaniels' 24 points, but couldn't overcome Booker's hot hand in the fourth quarter.",
    keyPlayers: [
      { name: "Devin Booker", team: "NYK", stats: "45 PTS, 10 AST, 3 REB, 17-32 FG, 9-16 3PT" },
      { name: "Max Strus", team: "NYK", stats: "22 PTS, 2 AST, 8-15 FG, 6-13 3PT" },
      { name: "Jaden McDaniels", team: "PHI", stats: "24 PTS, 2 REB, 9-24 FG, 6-16 3PT" },
      { name: "Jalen Green", team: "PHI", stats: "25 PTS, 6 AST, 11-16 FG, 3-6 3PT" }
    ],
    highlights: [
      "Booker's 45 points mark his highest scoring output of the season",
      "Knicks shot 49% from three-point range (19-39) in the victory",
      "New York's bench contributed only 11 points compared to Philly's 32",
      "The Knicks forced 8 turnovers while committing 14 of their own",
      "Booker and Strus combined for 15 three-pointers in the win"
    ],
    featured: true
  },
  {
    id: "WAS-NYK-S17-002",
    title: "Wizards Dominate Knicks in 92-61 Blowout Behind Elite Defense",
    date: "November 16, 2025",
    teams: {
      away: { name: "Washington Wizards", abbr: "WAS", score: 92 },
      home: { name: "New York Knicks", abbr: "NYK", score: 61 }
    },
    headline: "Suggs, Giddey Lead Defensive Masterpiece as Wizards Cruise",
    summary: "The Washington Wizards put on a defensive clinic, holding the Knicks to just 61 points in a dominant 92-61 victory. Jalen Suggs (34 points, 16-21 FG) and Josh Giddey (28 points, 5 assists) led the offensive charge while the Wizards' defense suffocated New York, limiting them to 41% shooting and forcing 19 turnovers. Devin Booker managed 26 points for the Knicks, but received little help as the rest of the roster combined for just 35 points. The 31-point margin represents one of the most lopsided games of the season.",
    keyPlayers: [
      { name: "Jalen Suggs", team: "WAS", stats: "34 PTS, 1 REB, 1 AST, 16-21 FG, 2-4 3PT" },
      { name: "Josh Giddey", team: "WAS", stats: "28 PTS, 6 REB, 5 AST, 12-19 FG, 4-5 3PT" },
      { name: "Devin Booker", team: "NYK", stats: "26 PTS, 5 AST, 4 REB, 9-23 FG, 4-8 3PT" },
      { name: "Anthony Davis", team: "NYK", stats: "8 PTS, 8 REB, 4-7 FG" }
    ],
    highlights: [
      "Wizards held Knicks to 41% shooting and just 61 total points",
      "Washington dominated in the paint 52-16",
      "Wizards' bench outscored Knicks' bench 5-13",
      "New York committed 19 turnovers compared to Washington's 4",
      "Suggs shot an efficient 76% from the field"
    ],
    featured: false
  },
  {
    id: "SAS-CHA-S17-003",
    title: "Reaves' 39-Point Eruption Lifts Spurs Over Hornets in Thriller",
    date: "November 16, 2025",
    teams: {
      away: { name: "San Antonio Spurs", abbr: "SAS", score: 96 },
      home: { name: "Charlotte Hornets", abbr: "CHA", score: 94 }
    },
    headline: "Austin Reaves Goes Nuclear as Spurs Escape with Narrow Victory",
    summary: "Austin Reaves put together one of the most impressive performances of the season, dropping 39 points on an absurd 17-22 shooting to carry the Spurs to a nail-biting 96-94 win over the Hornets. Reaves was unconscious from beyond the arc, draining 5 of 7 three-point attempts while adding 2 assists and 2 steals. Trae Young chipped in 20 points for San Antonio. The Hornets fought back behind balanced scoring but came up just short in a game that came down to the final possession. The Spurs' bench was the difference, outscoring Charlotte's reserves 53-14.",
    keyPlayers: [
      { name: "Austin Reaves", team: "SAS", stats: "39 PTS, 2 AST, 2 STL, 17-22 FG, 5-7 3PT" },
      { name: "Trae Young", team: "SAS", stats: "20 PTS, 7 AST, 4 STL, 8-17 FG, 1-5 3PT" },
      { name: "LeBron James", team: "SAS", stats: "23 PTS, 2 AST, 10-17 FG, 2-4 3PT" },
      { name: "Anfernee Simons", team: "SAS", stats: "23 PTS, 4 AST, 10-13 FG, 3-3 3PT" }
    ],
    highlights: [
      "Reaves shot 77% from the field in his 39-point outburst",
      "Spurs' bench dominated 53-14 over Hornets' reserves",
      "San Antonio shot 66% from the field as a team",
      "Both teams tied in points in the paint at 56",
      "Game came down to final possession with 2-point margin"
    ],
    featured: true
  },
  {
    id: "ATL-DAL-S17-004",
    title: "Ja Morant's Mavs Debut Spoiled as Hawks Roll 85-65",
    date: "November 16, 2025",
    teams: {
      away: { name: "Atlanta Hawks", abbr: "ATL", score: 85 },
      home: { name: "Dallas Mavericks", abbr: "DAL", score: 65 }
    },
    headline: "Morant Scores 32 in Dallas Debut, But Hawks' Defense Dominates",
    summary: "Ja Morant made his highly anticipated debut with the Dallas Mavericks, putting up an impressive 32 points on 12-28 shooting, but it wasn't enough as the Atlanta Hawks' stifling defense led them to an 85-65 victory. The Hawks held Dallas to just 40% shooting and dominated the paint 50-26. Dyson Daniels (21 points, 7-12 FG, 7-10 3PT) and Brandon Bol (18 points) paced Atlanta's balanced attack. Despite Morant's individual brilliance in his Mavs debut, Dallas struggled to find secondary scoring, with no other player reaching double figures.",
    keyPlayers: [
      { name: "Ja Morant", team: "DAL", stats: "32 PTS, 5 REB, 4 AST, 12-28 FG, 4-7 3PT - Mavs Debut" },
      { name: "Dyson Daniels", team: "ATL", stats: "21 PTS, 6 AST, 4 STL, 7-12 FG, 7-10 3PT" },
      { name: "Brandon Bol", team: "ATL", stats: "18 PTS, 3 REB, 9-13 FG" },
      { name: "Jaden Johnson", team: "ATL", stats: "23 PTS, 11-18 FG, 0-2 3PT" }
    ],
    highlights: [
      "Ja Morant debuts with Mavericks, scores team-high 32 points",
      "Hawks dominated paint 50-26 and bench points 46-25",
      "Atlanta's defense held Dallas to 40% shooting",
      "Daniels went 7-10 from three-point range",
      "Hawks forced 13 turnovers while committing only 10"
    ],
    featured: true
  }
];
