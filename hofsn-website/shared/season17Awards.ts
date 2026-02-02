// Season 17 All-HoF Teams and All-Defense Teams

export interface AwardPlayer {
  name: string;
  team: string;
  gp: number;
  stats: string;
  description: string;
  headshot?: string;
  teamLogo?: string;
}

export interface AwardTeam {
  id: string;
  title: string;
  players: AwardPlayer[];
}

// Team logo mapping
const teamLogos: Record<string, string> = {
  "Raptors": "/logos/raptors.png",
  "Pistons": "/logos/pistons.png",
  "Nuggets": "/logos/nuggets.png",
  "Wizards": "/logos/wizards.png",
  "Hawks": "/logos/hawks.png",
  "Kings": "/logos/kings.png",
  "Jazz": "/logos/jazz.png",
  "Trail Blazers": "/logos/trail-blazers.png",
  "Cavaliers": "/logos/cavaliers.png",
  "Mavs": "/logos/mavericks.png",
  "Rockets": "/logos/rockets.png",
  "Pacers": "/logos/pacers.png",
};

export const season17Awards: AwardTeam[] = [
  {
    id: "first-team-hof",
    title: "First Team All-HoF",
    players: [
      {
        name: "Jayson Tatum",
        team: "Raptors",
        gp: 72,
        stats: "2682 PTS (37.25 PPG) | 358 AST | +1253 Net Impact",
        description: "Tatum was the league's most relentless high-usage scorer and still kept the offense organized, finishing with 2,682 points in 72 games (37.25 PPG) plus 358 assists. The season consistently swung in the Raptors' favor when he played, reflected in a staggering +1253 net impact. He closes the year as the clear standard-setter in volume and winning influence, with most total points and best +/-.",
        headshot: "/headshots/jayson-tatum.jpg",
        teamLogo: teamLogos["Raptors"]
      },
      {
        name: "Brandon Ingram",
        team: "Pistons",
        gp: 64,
        stats: "2483 PTS (38.80 PPG) | 201 3PM | +563 Net Impact",
        description: "Ingram produced the league's most explosive scoring season, dropping 2,483 points in 64 games for league-high PPG (38.80) while pairing that volume with elite efficiency and spacing pressure. He buried 201 threes and lived in advantage situations, forcing defenses to choose between giving up clean jumpers or collapsing into paint openings. His +563 impact underscores that this wasn't empty volume—his scoring reliably decided games.",
        headshot: "/headshots/brandon-ingram.jpg",
        teamLogo: teamLogos["Pistons"]
      },
      {
        name: "Steph Curry",
        team: "Nuggets",
        gp: 61,
        stats: "2264 PTS (37.11 PPG) | 371 AST | +636 Net Impact | Best FT%",
        description: "Curry combined peak scoring with real creation, posting 2,264 points in 61 games (37.11 PPG) and 371 assists while maintaining the kind of efficiency that breaks defensive game plans. Late-game possessions and spacing were consistently dictated by his gravity, and his +636 impact captures how much the floor tilted with him on it. He also separated himself at the line with best FT% (min 100 FTA).",
        headshot: "/headshots/steph-curry.png",
        teamLogo: teamLogos["Nuggets"]
      },
      {
        name: "Jalen Suggs",
        team: "Wizards",
        gp: 71,
        stats: "2542 PTS (35.80 PPG) | 147 STL | 43.97% Opp FG | +512 Net Impact",
        description: "Suggs delivered a true two-way superstar year, scoring 2,542 points in 71 games (35.80 PPG) while also driving defensive outcomes possession-to-possession. He generated 147 steals and led the league's high-volume stoppers in opponent shot suppression at 43.97% on 746 defended attempts. The +512 net impact reflects a season where his offense mattered, but his defensive control was the differentiator, anchored by best OppFG% (OFGA≥400).",
        headshot: "/headshots/jalen-suggs.jpg",
        teamLogo: teamLogos["Wizards"]
      },
      {
        name: "Jalen Johnson",
        team: "Hawks",
        gp: 71,
        stats: "2438 PTS (34.34 PPG) | Most 2PT Makes | +278 Net Impact",
        description: "Johnson was Atlanta's nightly pace-setter, producing 2,438 points in 71 games (34.34 PPG) with constant pressure inside the arc. He won possessions with downhill force and paint presence, finishing as the league's most consistent two-point finisher with most 2PT makes. His +278 impact shows the scoring translated into real leverage rather than just volume.",
        headshot: "/headshots/jalen-johnson.png",
        teamLogo: teamLogos["Hawks"]
      }
    ]
  },
  {
    id: "second-team-hof",
    title: "Second Team All-HoF",
    players: [
      {
        name: "De'Aaron Fox",
        team: "Kings",
        gp: 61,
        stats: "1619 PTS (26.54 PPG) | 501 AST (8.21 APG) | 137 STL | Most Total Assists",
        description: "Fox delivered elite two-way production with league-leading assist totals while maintaining high-level scoring and defensive pressure.",
        headshot: "/headshots/deaaron-fox.jpg",
        teamLogo: teamLogos["Kings"]
      },
      {
        name: "James Harden",
        team: "Jazz",
        gp: 55,
        stats: "1559 PTS (28.35 PPG) | 297 AST (5.40 APG) | 74 STL",
        description: "Harden combined scoring punch with playmaking consistency, anchoring the Jazz offense across 55 games.",
        headshot: "/headshots/james-harden.jpg",
        teamLogo: teamLogos["Jazz"]
      },
      {
        name: "LeBron James",
        team: "Trail Blazers",
        gp: 65,
        stats: "1819 PTS (27.98 PPG) | 239 AST (3.68 APG) | 120 REB",
        description: "LeBron continued his legendary production, leading the Blazers with elite scoring and all-around impact.",
        headshot: "/headshots/lebron-james.jpg",
        teamLogo: teamLogos["Trail Blazers"]
      },
      {
        name: "Shai Gilgeous-Alexander",
        team: "Cavaliers",
        gp: 71,
        stats: "1826 PTS (25.72 PPG) | 327 AST (4.61 APG) | 147 STL",
        description: "SGA delivered consistent two-way excellence across a full 71-game season with scoring and defensive pressure.",
        headshot: "/headshots/shai-gilgeous-alexander.png",
        teamLogo: teamLogos["Cavaliers"]
      },
      {
        name: "OG Anunoby",
        team: "Raptors",
        gp: 72,
        stats: "1104 PTS (15.33 PPG) | 180 STL (2.50 SPG) | DIS 90.51 | 47.04% Opp FG | Most Steals | Best SPG | #1 DIS",
        description: "Anunoby earned his spot with elite defensive dominance: league-leading steals, steals per game, and defensive impact score while contributing solid scoring.",
        headshot: "/headshots/og-anunoby.png",
        teamLogo: teamLogos["Raptors"]
      }
    ]
  },
  {
    id: "first-team-defense",
    title: "First Team All-Defense",
    players: [
      {
        name: "OG Anunoby",
        team: "Raptors",
        gp: 72,
        stats: "180 STL (2.50 SPG) | DIS 90.51 | 47.04% Opp FG (793 OFGA) | Most Steals | Best SPG | #1 DIS",
        description: "Anunoby put together the league's cleanest 'events + efficiency + volume' defensive season, generating turnovers at a massive rate while still holding opponents under 50% across elite workload. He finished with 180 steals (2.50 SPG), defended 793 attempts at 47.04%, and graded out as the top DIS defender in the league. The profile is as complete as it gets: most steals, best steals per game, and #1 DIS.",
        headshot: "/headshots/og-anunoby.png",
        teamLogo: teamLogos["Raptors"]
      },
      {
        name: "Jalen Suggs",
        team: "Wizards",
        gp: 71,
        stats: "147 STL | 43.97% Opp FG (746 OFGA) | Best OppFG% (OFGA≥400)",
        description: "Suggs was the premier high-volume stopper, taking on constant matchup responsibility and still producing the best efficiency outcome among heavy defenders. He held opponents to 43.97% on 746 defended attempts while piling up 147 steals, pairing shot suppression with event creation. It's the rare perimeter season where the workload is huge and the results improve with scale, driven by best OppFG% (OFGA≥400).",
        headshot: "/headshots/jalen-suggs.jpg",
        teamLogo: teamLogos["Wizards"]
      },
      {
        name: "Cason Wallace",
        team: "Mavs",
        gp: 64,
        stats: "137 STL | 49.68% Opp FG (616 OFGA) | +757 Net Impact",
        description: "Wallace's season was built on disruption and stability at the point of attack: 137 steals, 616 defended attempts, and opponent efficiency kept just under the cutoff at 49.68%. He graded as one of the league's top DIS defenders while consistently generating extra possessions without giving up clean looks. The +757 net impact reinforces how much winning basketball came from his defensive pressure even when the offense wasn't the headline.",
        headshot: "/headshots/cason-wallace.png",
        teamLogo: teamLogos["Mavs"]
      },
      {
        name: "Kristaps Porzingis",
        team: "Rockets",
        gp: 70,
        stats: "62 BLK | 48.93% Opp FG (560 OFGA)",
        description: "Porzingis anchored the paint with consistent rim deterrence, finishing with 62 blocks while keeping opponent efficiency under the DIS cutoff (48.93% on 560 defended attempts). His value showed up in the possessions that never became shots at all—drives aborted, angles shut off, and late-clock bailouts forced. Few bigs combined that much volume and that much rim influence over a full season.",
        headshot: "/headshots/kristaps-porzingis.png",
        teamLogo: teamLogos["Rockets"]
      },
      {
        name: "Alex Caruso",
        team: "Wizards",
        gp: 74,
        stats: "124 STL | 49.21% Opp FG (504 OFGA)",
        description: "Caruso delivered a classic impact-stopper season: high reps, high pressure, and reliable event creation across 74 games. He finished with 124 steals and held opponents to 49.21% on 504 defended attempts while placing among the league's top DIS perimeter defenders. Night after night, he turned defense into offense by manufacturing possessions and shrinking playmaking windows.",
        headshot: "/headshots/alex-caruso.png",
        teamLogo: teamLogos["Wizards"]
      }
    ]
  },
  {
    id: "second-team-defense",
    title: "Second Team All-Defense",
    players: [
      {
        name: "Nicolas Claxton",
        team: "Jazz",
        gp: 54,
        stats: "84 BLK (1.56 BPG) | League Leader in BPG | Most Total Blocks",
        description: "Claxton dominated the paint as the league's premier shot-blocker, leading in both total blocks (84) and blocks per game (1.56 BPG) across 54 games. His rim protection anchored the Jazz defense, altering shots and deterring drives all season long.",
        headshot: "/headshots/nicolas-claxton.png",
        teamLogo: teamLogos["Jazz"]
      },
      {
        name: "Anthony Davis",
        team: "Pacers",
        gp: 45,
        stats: "DIS 70.00 | 48.48% Opp FG (462 OFGA) | 67 STL | 68 BLK | 378 REB",
        description: "Davis delivered elite rim protection and perimeter versatility, anchoring the Pacers defense with blocks, steals, and rebounding.",
        headshot: "/headshots/anthony-davis.png",
        teamLogo: teamLogos["Pacers"]
      },
      {
        name: "Marcus Smart",
        team: "Nuggets",
        gp: 59,
        stats: "DIS 67.23 | 48.73% Opp FG (474 OFGA) | 87 STL | 7 BLK",
        description: "Smart brought his trademark intensity and defensive IQ, generating turnovers and disrupting offensive flow across 59 games.",
        headshot: "/headshots/marcus-smart.png",
        teamLogo: teamLogos["Nuggets"]
      },
      {
        name: "P.J. Washington",
        team: "Mavs",
        gp: 57,
        stats: "DIS 61.99 | 47.96% Opp FG (417 OFGA) | 49 STL | 8 BLK",
        description: "Washington provided versatile defensive coverage, switching across positions and holding opponents to under 48% shooting.",
        headshot: "/headshots/pj-washington.png",
        teamLogo: teamLogos["Mavs"]
      },
      {
        name: "Keon Ellis",
        team: "Pistons",
        gp: 67,
        stats: "50.07% Opp FG (713 OFGA) | 154 STL (2.30 SPG) | 14 BLK | +676 Net Impact",
        description: "Ellis generated massive steal volume (2.30 SPG) while maintaining defensive stability across high workload, contributing to a +676 net impact.",
        headshot: "/headshots/keon-ellis.png",
        teamLogo: teamLogos["Pistons"]
      }
    ]
  }
];
