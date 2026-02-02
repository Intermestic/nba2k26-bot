import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

// Game 1: Pistons 129, Mavericks 51
const game1PistonsPlayers = [
  {
    "name": "T. Maxey",
    "min": 23,
    "pts": 17,
    "reb": 0,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 2,
    "fgm": 8,
    "fga": 30
  },
  {
    "name": "D. Hunter",
    "min": 8,
    "pts": 7,
    "reb": 1,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 1,
    "fgm": 2,
    "fga": 2
  },
  {
    "name": "N. Vucevic",
    "min": 19,
    "pts": 5,
    "reb": 3,
    "ast": 0,
    "stl": 1,
    "blk": 0,
    "to": 0,
    "fgm": 2,
    "fga": 3
  },
  {
    "name": "J. McCain",
    "min": 8,
    "pts": 4,
    "reb": 2,
    "ast": 4,
    "stl": 0,
    "blk": 0,
    "to": 1,
    "fgm": 2,
    "fga": 12
  },
  {
    "name": "N. Marshall",
    "min": 11,
    "pts": 4,
    "reb": 1,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 1,
    "fgm": 2,
    "fga": 4
  },
  {
    "name": "D. Powell",
    "min": 5,
    "pts": 4,
    "reb": 3,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 2,
    "fga": 3
  },
  {
    "name": "C. Wallace",
    "min": 19,
    "pts": 2,
    "reb": 0,
    "ast": 0,
    "stl": 1,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 3
  },
  {
    "name": "K. Thompson",
    "min": 27,
    "pts": 2,
    "reb": 6,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 5
  },
  {
    "name": "P.J. Washington",
    "min": 13,
    "pts": 2,
    "reb": 2,
    "ast": 2,
    "stl": 3,
    "blk": 0,
    "to": 3,
    "fgm": 1,
    "fga": 5
  },
  {
    "name": "A. Bona",
    "min": 8,
    "pts": 2,
    "reb": 2,
    "ast": 1,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 3
  },
  {
    "name": "C. Braun",
    "min": 17,
    "pts": 2,
    "reb": 2,
    "ast": 0,
    "stl": 1,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 4
  },
  {
    "name": "J. Clark",
    "min": 2,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "B. Williams",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "K. Porter Jr.",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  }
];

const game1MavsPlayers = [
  {
    "name": "J. Watkins",
    "min": 18,
    "pts": 30,
    "reb": 0,
    "ast": 5,
    "stl": 1,
    "blk": 0,
    "to": 0,
    "fgm": 13,
    "fga": 17
  },
  {
    "name": "D. Ayton",
    "min": 14,
    "pts": 12,
    "reb": 14,
    "ast": 1,
    "stl": 1,
    "blk": 0,
    "to": 1,
    "fgm": 6,
    "fga": 6
  },
  {
    "name": "I. Quickley",
    "min": 14,
    "pts": 10,
    "reb": 0,
    "ast": 3,
    "stl": 1,
    "blk": 0,
    "to": 1,
    "fgm": 4,
    "fga": 6
  },
  {
    "name": "J. Jackson Jr.",
    "min": 18,
    "pts": 9,
    "reb": 12,
    "ast": 2,
    "stl": 0,
    "blk": 2,
    "to": 0,
    "fgm": 4,
    "fga": 5
  },
  {
    "name": "J. Champagnie",
    "min": 18,
    "pts": 8,
    "reb": 10,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 3,
    "fga": 3
  },
  {
    "name": "K. Ellis",
    "min": 18,
    "pts": 3,
    "reb": 1,
    "ast": 1,
    "stl": 0,
    "blk": 1,
    "to": 0,
    "fgm": 1,
    "fga": 1
  },
  {
    "name": "O. Toppin",
    "min": 14,
    "pts": 2,
    "reb": 4,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 3
  },
  {
    "name": "C. Reddish",
    "min": 7,
    "pts": 0,
    "reb": 0,
    "ast": 1,
    "stl": 1,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "I. Okoro",
    "min": 14,
    "pts": 0,
    "reb": 3,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 1,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "D. Finney-Smith",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "J. Williams",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "Z. Nnaji",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "M. Robinson",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  }
];

// Game 2: Pistons 81, Mavericks 63
const game2PistonsPlayers = [
  {
    "name": "T. Maxey",
    "min": 18,
    "pts": 16,
    "reb": 1,
    "ast": 6,
    "stl": 0,
    "blk": 0,
    "to": 5,
    "fgm": 7,
    "fga": 16
  },
  {
    "name": "D. Powell",
    "min": 16,
    "pts": 16,
    "reb": 4,
    "ast": 1,
    "stl": 1,
    "blk": 0,
    "to": 1,
    "fgm": 8,
    "fga": 15
  },
  {
    "name": "A. Bona",
    "min": 12,
    "pts": 10,
    "reb": 8,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 2,
    "fgm": 5,
    "fga": 6
  },
  {
    "name": "N. Marshall",
    "min": 9,
    "pts": 6,
    "reb": 1,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 1,
    "fgm": 3,
    "fga": 6
  },
  {
    "name": "C. Wallace",
    "min": 22,
    "pts": 4,
    "reb": 1,
    "ast": 1,
    "stl": 4,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 3
  },
  {
    "name": "P.J. Washington",
    "min": 23,
    "pts": 4,
    "reb": 4,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 1,
    "fgm": 2,
    "fga": 7
  },
  {
    "name": "J. Clark",
    "min": 23,
    "pts": 3,
    "reb": 3,
    "ast": 0,
    "stl": 2,
    "blk": 0,
    "to": 1,
    "fgm": 1,
    "fga": 1
  },
  {
    "name": "J. McCain",
    "min": 7,
    "pts": 2,
    "reb": 0,
    "ast": 3,
    "stl": 0,
    "blk": 1,
    "to": 0,
    "fgm": 1,
    "fga": 5
  },
  {
    "name": "B. Williams",
    "min": 6,
    "pts": 2,
    "reb": 0,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 4
  },
  {
    "name": "K. Thompson",
    "min": 9,
    "pts": 0,
    "reb": 2,
    "ast": 0,
    "stl": 1,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 1
  },
  {
    "name": "D. Hunter",
    "min": 4,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 1
  },
  {
    "name": "K. Porter Jr.",
    "min": 1,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "N. Vucevic",
    "min": 5,
    "pts": 0,
    "reb": 3,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 2,
    "fgm": 0,
    "fga": 1
  },
  {
    "name": "C. Braun",
    "min": 5,
    "pts": 0,
    "reb": 2,
    "ast": 1,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  }
];

const game2MavsPlayers = [
  {
    "name": "B. Ingram",
    "min": 22,
    "pts": 17,
    "reb": 2,
    "ast": 2,
    "stl": 0,
    "blk": 0,
    "to": 6,
    "fgm": 7,
    "fga": 17
  },
  {
    "name": "D. Ayton",
    "min": 10,
    "pts": 10,
    "reb": 8,
    "ast": 0,
    "stl": 1,
    "blk": 1,
    "to": 2,
    "fgm": 5,
    "fga": 10
  },
  {
    "name": "J. Jackson Jr.",
    "min": 19,
    "pts": 9,
    "reb": 6,
    "ast": 0,
    "stl": 3,
    "blk": 3,
    "to": 1,
    "fgm": 3,
    "fga": 4
  },
  {
    "name": "I. Quickley",
    "min": 10,
    "pts": 7,
    "reb": 1,
    "ast": 3,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 3,
    "fga": 9
  },
  {
    "name": "J. Champagnie",
    "min": 22,
    "pts": 6,
    "reb": 5,
    "ast": 0,
    "stl": 1,
    "blk": 0,
    "to": 1,
    "fgm": 1,
    "fga": 2
  },
  {
    "name": "C. Reddish",
    "min": 10,
    "pts": 2,
    "reb": 2,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 2
  },
  {
    "name": "M. Robinson",
    "min": 3,
    "pts": 2,
    "reb": 2,
    "ast": 1,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 1
  },
  {
    "name": "O. Toppin",
    "min": 10,
    "pts": 2,
    "reb": 4,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 1,
    "fga": 1
  },
  {
    "name": "K. Ellis",
    "min": 22,
    "pts": 0,
    "reb": 2,
    "ast": 2,
    "stl": 2,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "I. Okoro",
    "min": 10,
    "pts": 0,
    "reb": 1,
    "ast": 1,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 2
  },
  {
    "name": "D. Finney-Smith",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "J. Williams",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  },
  {
    "name": "Z. Nnaji",
    "min": 0,
    "pts": 0,
    "reb": 0,
    "ast": 0,
    "stl": 0,
    "blk": 0,
    "to": 0,
    "fgm": 0,
    "fga": 0
  }
];

export default function PistonsMavsSeries() {
  const [showGame1BoxScore, setShowGame1BoxScore] = useState(false);
  const [showGame2BoxScore, setShowGame2BoxScore] = useState(false);

  const BoxScoreTable = ({ players, teamName }: { players: typeof game1PistonsPlayers, teamName: string }) => (
    <div className="overflow-x-auto">
      <h4 className="text-lg font-bold mb-3 text-gold-400">{teamName}</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-2">Player</th>
            <th className="text-center py-2 px-2">MIN</th>
            <th className="text-center py-2 px-2">PTS</th>
            <th className="text-center py-2 px-2">REB</th>
            <th className="text-center py-2 px-2">AST</th>
            <th className="text-center py-2 px-2">STL</th>
            <th className="text-center py-2 px-2">BLK</th>
            <th className="text-center py-2 px-2">TO</th>
            <th className="text-center py-2 px-2">FG</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => (
            <tr key={idx} className="border-b border-gray-800 hover:bg-gray-900/50">
              <td className="py-2 px-2 font-medium">{player.name}</td>
              <td className="text-center py-2 px-2">{player.min}</td>
              <td className="text-center py-2 px-2 font-bold">{player.pts}</td>
              <td className="text-center py-2 px-2">{player.reb}</td>
              <td className="text-center py-2 px-2">{player.ast}</td>
              <td className="text-center py-2 px-2">{player.stl}</td>
              <td className="text-center py-2 px-2">{player.blk}</td>
              <td className="text-center py-2 px-2">{player.to}</td>
              <td className="text-center py-2 px-2">{player.fgm}-{player.fga}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <Link href="/playoffs">
            <Button variant="ghost" className="mb-2">
              ← Back to Playoffs
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-red-900/20 to-background border-b border-border">
        <div className="container py-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gold-400 text-sm font-bold tracking-wide">🏆 FIRST ROUND - SERIES COMPLETE</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                Pistons Win <span className="text-red-500">2-0</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Detroit sweeps Dallas to advance to Round 2
              </p>
            </div>
            
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-5xl font-black text-red-500">2</div>
                <div className="text-sm text-muted-foreground mt-1">Pistons</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-muted-foreground">0</div>
                <div className="text-sm text-muted-foreground mt-1">Mavericks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Series Summary */}
      <div className="container py-12">
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-gold-400">Series Summary</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                DETROIT (AP) — The defending champion Detroit Pistons advanced to the second round with a 2-0 sweep of the Dallas Mavericks, pairing a historic Game 1 blowout with a controlled closeout in Game 2.

Detroit’s stars set the tone: Brandon Ingram detonated for 55 in the opener as the Pistons hit 20 threes, then Jamal Watkins led the way in Game 2 with 26 points. Deandre Ayton provided steady interior finishing and rebounding, and Jaren Jackson Jr.’s rim protection and playmaking on defense (three blocks in Game 2) helped choke off Dallas’ spacing.

Dallas struggled to generate consistent offense in either game, with Tyrese Maxey forced into high-difficulty shots and the Mavericks’ supporting cast unable to punish Detroit’s help defense. The Pistons move on to face the Sacramento Kings in Round 2.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game 1 */}
      <div className="container py-8">
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Game 1</h3>
                <p className="text-muted-foreground">Pistons 129, Mavericks 51</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowGame1BoxScore(!showGame1BoxScore)}
              >
                {showGame1BoxScore ? "Hide" : "Show"} Box Score
              </Button>
            </div>

            {showGame1BoxScore && (
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <BoxScoreTable players={game1PistonsPlayers} teamName="Detroit Pistons" />
                <BoxScoreTable players={game1MavsPlayers} teamName="Dallas Mavericks" />
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                DALLAS (AP) — Brandon Ingram scored 55 points and the defending champion Detroit Pistons buried the Dallas Mavericks 129-51 on Tuesday night in Game 1 of their first-round series.

Ingram was blistering from deep (11 3-pointers) as Detroit shot 71% from the floor and drilled 20 triples, turning the game into a runaway by halftime. Jamal Watkins added 30 points, and Deandre Ayton and Jaren Jackson Jr. controlled the paint as Detroit piled up 52 points inside.

Tyrese Maxey led Dallas with 17 points, but the Mavericks shot 30% overall and 3-of-20 from 3-point range. Detroit’s pressure forced Dallas into rushed looks early, and the Pistons never let the Mavericks find rhythm.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game 2 */}
      <div className="container py-8">
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Game 2</h3>
                <p className="text-muted-foreground">Pistons 81, Mavericks 63</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowGame2BoxScore(!showGame2BoxScore)}
              >
                {showGame2BoxScore ? "Hide" : "Show"} Box Score
              </Button>
            </div>

            {showGame2BoxScore && (
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <BoxScoreTable players={game2PistonsPlayers} teamName="Detroit Pistons" />
                <BoxScoreTable players={game2MavsPlayers} teamName="Dallas Mavericks" />
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                DETROIT (AP) — Jamal Watkins scored 26 points and the Detroit Pistons completed a two-game sweep of the Dallas Mavericks with an 81-63 win in Game 2 on Thursday night.

Detroit didn’t have the nuclear shooting night from Game 1, but the Pistons again controlled the terms — defending the arc and making Dallas work in the half court. Brandon Ingram added 17 points, and Deandre Ayton had 10 points and eight rebounds. Jaren Jackson Jr. filled the box score with nine points, three steals and three blocks as Detroit held Dallas to 2-of-9 shooting from 3.

Dallas got 16 points apiece from Tyrese Maxey and Dwight Powell, and Adem Bona added 10 points and eight rebounds off the bench. But the Mavericks couldn’t string together enough stops — and Detroit’s timely shooting (11-of-20 from deep) pushed the Pistons into the second round.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Looking Ahead */}
      <div className="container py-8 pb-16">
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-gold-400">Looking Ahead</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                Looking ahead: Pistons vs. Kings (Round 2)

Sacramento enters Round 2 red-hot after sweeping Chicago, powered by De’Aaron Fox’s two-game burst: 58 points, 18 assists and 11 steals across Games 1–2. Kawhi Leonard was the steady secondary scorer (44 points), while Onyeka Okongwu owned the glass (21 rebounds) and Collin Sexton provided another downhill threat (27 points).

For Detroit, the matchup starts with transition defense and ball security. The Pistons just won Game 2 despite 15 turnovers — that number can’t live against Fox, who turns steals into instant offense. Expect Detroit to throw waves of length at Fox on-ball and to gap the paint with Jackson Jr. as the back-line eraser, trying to force Sacramento into late-clock jumpers.

On the other end, Detroit’s shooting profile is the obvious pressure point for Sacramento. The Pistons’ spacing was overwhelming in Game 1 (20 threes), and even in a slower Game 2 they hit 11 more. If Ingram and Watkins draw extra attention, Ayton becomes a key release valve at the rim — and Detroit’s role shooters will decide whether this looks like a track meet or a grind.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
