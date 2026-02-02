import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Target, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

// Game 1 Box Scores
const game1WizardsPlayers = [
  { name: "J. Suggs", min: 21, pts: 40, reb: 2, ast: 4, stl: 1, blk: 1, to: 4, fgm: 18, fga: 28 },
  { name: "J. Allen", min: 21, pts: 22, reb: 13, ast: 5, stl: 1, blk: 0, to: 1, fgm: 10, fga: 11 },
  { name: "J. Brown", min: 21, pts: 15, reb: 3, ast: 6, stl: 0, blk: 0, to: 3, fgm: 7, fga: 11 },
  { name: "S. Castle", min: 20, pts: 9, reb: 5, ast: 3, stl: 3, blk: 0, to: 1, fgm: 4, fga: 6 },
  { name: "A. Caruso", min: 14, pts: 3, reb: 2, ast: 4, stl: 2, blk: 0, to: 1, fgm: 1, fga: 1 },
  { name: "B. Mathurin", min: 9, pts: 2, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 2 },
  { name: "D. Green", min: 19, pts: 0, reb: 0, ast: 3, stl: 1, blk: 1, to: 0, fgm: 0, fga: 1 },
  { name: "J. Walsh", min: 13, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 1, fgm: 0, fga: 2 },
  { name: "M. Raynaud", min: 7, pts: 0, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 5 },
  { name: "K. Maluach", min: 7, pts: 0, reb: 2, ast: 0, stl: 0, blk: 1, to: 0, fgm: 0, fga: 0 },
  { name: "T. Vukcevic", min: 8, pts: 0, reb: 5, ast: 1, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
];

const game1BlazersPlayers = [
  { name: "T. Young", min: 21, pts: 14, reb: 1, ast: 5, stl: 3, blk: 0, to: 2, fgm: 5, fga: 14 },
  { name: "L. James", min: 19, pts: 14, reb: 1, ast: 3, stl: 0, blk: 0, to: 1, fgm: 5, fga: 13 },
  { name: "D. Garland", min: 18, pts: 9, reb: 0, ast: 1, stl: 0, blk: 0, to: 2, fgm: 4, fga: 11 },
  { name: "C. LeVert", min: 15, pts: 7, reb: 0, ast: 0, stl: 0, blk: 0, to: 1, fgm: 3, fga: 6 },
  { name: "T. Harris", min: 19, pts: 6, reb: 1, ast: 1, stl: 0, blk: 0, to: 1, fgm: 3, fga: 7 },
  { name: "K. Jones", min: 10, pts: 6, reb: 8, ast: 0, stl: 0, blk: 0, to: 1, fgm: 3, fga: 4 },
  { name: "J. Champagnie", min: 12, pts: 5, reb: 3, ast: 1, stl: 1, blk: 0, to: 0, fgm: 2, fga: 4 },
  { name: "M. Williams", min: 13, pts: 4, reb: 7, ast: 0, stl: 2, blk: 0, to: 0, fgm: 2, fga: 4 },
  { name: "G. Allen", min: 13, pts: 4, reb: 0, ast: 2, stl: 2, blk: 0, to: 1, fgm: 2, fga: 4 },
  { name: "N. Clifford", min: 4, pts: 4, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "L. Kornet", min: 9, pts: 2, reb: 4, ast: 1, stl: 1, blk: 1, to: 1, fgm: 1, fga: 3 },
  { name: "L. Nance Jr.", min: 7, pts: 0, reb: 2, ast: 2, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
];

// Game 2 Box Scores
const game2WizardsPlayers = [
  { name: "J. Suggs", min: 25, pts: 65, reb: 1, ast: 3, stl: 1, blk: 0, to: 3, fgm: 29, fga: 40 },
  { name: "J. Brown", min: 23, pts: 16, reb: 5, ast: 7, stl: 0, blk: 0, to: 1, fgm: 8, fga: 14 },
  { name: "S. Castle", min: 19, pts: 6, reb: 1, ast: 1, stl: 3, blk: 0, to: 0, fgm: 3, fga: 4 },
  { name: "J. Allen", min: 17, pts: 6, reb: 4, ast: 1, stl: 0, blk: 0, to: 1, fgm: 3, fga: 7 },
  { name: "B. Mathurin", min: 15, pts: 5, reb: 1, ast: 0, stl: 0, blk: 1, to: 0, fgm: 2, fga: 5 },
  { name: "D. Green", min: 17, pts: 4, reb: 1, ast: 3, stl: 5, blk: 0, to: 1, fgm: 2, fga: 3 },
  { name: "J. Walsh", min: 10, pts: 0, reb: 3, ast: 1, stl: 1, blk: 0, to: 1, fgm: 0, fga: 0 },
  { name: "A. Caruso", min: 15, pts: 0, reb: 1, ast: 7, stl: 3, blk: 0, to: 1, fgm: 0, fga: 0 },
  { name: "M. Raynaud", min: 7, pts: 0, reb: 2, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "K. Maluach", min: 5, pts: 0, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "T. Vukcevic", min: 7, pts: 0, reb: 0, ast: 0, stl: 0, blk: 1, to: 0, fgm: 0, fga: 0 },
];

const game2BlazersPlayers = [
  { name: "M. Williams", min: 17, pts: 23, reb: 5, ast: 1, stl: 0, blk: 0, to: 0, fgm: 10, fga: 10 },
  { name: "D. Garland", min: 20, pts: 17, reb: 1, ast: 9, stl: 2, blk: 0, to: 4, fgm: 7, fga: 10 },
  { name: "T. Young", min: 19, pts: 15, reb: 2, ast: 7, stl: 2, blk: 0, to: 3, fgm: 6, fga: 8 },
  { name: "C. LeVert", min: 14, pts: 12, reb: 2, ast: 2, stl: 0, blk: 0, to: 0, fgm: 5, fga: 8 },
  { name: "L. Kornet", min: 11, pts: 10, reb: 5, ast: 1, stl: 0, blk: 0, to: 1, fgm: 5, fga: 7 },
  { name: "L. James", min: 18, pts: 9, reb: 3, ast: 4, stl: 0, blk: 0, to: 5, fgm: 4, fga: 9 },
  { name: "T. Harris", min: 21, pts: 4, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 2, fga: 3 },
  { name: "L. Nance Jr.", min: 11, pts: 2, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "G. Allen", min: 11, pts: 0, reb: 0, ast: 1, stl: 2, blk: 0, to: 2, fgm: 0, fga: 1 },
  { name: "J. Champagnie", min: 10, pts: 0, reb: 1, ast: 1, stl: 2, blk: 0, to: 1, fgm: 0, fga: 1 },
  { name: "N. Clifford", min: 5, pts: 0, reb: 0, ast: 1, stl: 0, blk: 0, to: 1, fgm: 0, fga: 0 },
  { name: "K. Jones", min: 3, pts: 0, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 0, fga: 1 },
];

export default function WizardsBlazersSeries() {
  const [showGame1BoxScore, setShowGame1BoxScore] = useState(false);
  const [showGame2BoxScore, setShowGame2BoxScore] = useState(false);

  const BoxScoreTable = ({ players, teamName }: { players: typeof game1WizardsPlayers, teamName: string }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-2">Player</th>
            <th className="text-center py-2 px-1">MIN</th>
            <th className="text-center py-2 px-1">PTS</th>
            <th className="text-center py-2 px-1">REB</th>
            <th className="text-center py-2 px-1">AST</th>
            <th className="text-center py-2 px-1">STL</th>
            <th className="text-center py-2 px-1">BLK</th>
            <th className="text-center py-2 px-1">TO</th>
            <th className="text-center py-2 px-1">FG</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => (
            <tr key={idx} className={`border-b border-border/50 ${idx === 0 ? 'bg-red-900/20' : ''}`}>
              <td className="py-2 px-2 font-medium">{player.name}</td>
              <td className="text-center py-2 px-1 text-muted-foreground">{player.min}</td>
              <td className="text-center py-2 px-1 font-bold">{player.pts}</td>
              <td className="text-center py-2 px-1">{player.reb}</td>
              <td className="text-center py-2 px-1">{player.ast}</td>
              <td className="text-center py-2 px-1">{player.stl}</td>
              <td className="text-center py-2 px-1">{player.blk}</td>
              <td className="text-center py-2 px-1 text-red-400">{player.to}</td>
              <td className="text-center py-2 px-1 text-muted-foreground">{player.fgm}-{player.fga}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-950 via-slate-900 to-black py-16 md:py-24">
        <div className="container">
          <Link href="/playoffs">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Playoffs
            </button>
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">
                  First Round - Series Complete
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4">
                Wizards <span className="text-red-500">Sweep</span> Blazers
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Washington dominates Portland 2-0 behind Jalen Suggs' historic 105-point series performance
              </p>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="text-center mb-2">
                <div className="text-sm text-muted-foreground mb-1">SERIES RESULT</div>
                <div className="text-5xl font-black text-red-500">2-0</div>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Wizards Advance
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Series Summary */}
      <section className="container py-12">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Series Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              The Washington Wizards delivered a statement sweep of the Portland Trail Blazers, advancing to the second round with back-to-back victories. Jalen Suggs put on one of the most dominant playoff performances in league history, combining for 105 points across two games (40 in Game 1, 65 in Game 2).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Game 1 saw the Wizards establish control early with a balanced attack led by Suggs' 40-point explosion and Jarrett Allen's 22-point, 13-rebound double-double. Portland struggled to find offensive rhythm, with Trae Young and LeBron James each scoring 14 points but unable to overcome Washington's defensive intensity.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Game 2 became the Jalen Suggs show. After Portland cut the lead to just 2 points with under 4 minutes remaining, Suggs took over completely, scoring the final 12 Wizards points to seal the 10-point victory and the series sweep. His 65-point performance on 29-of-40 shooting stands as one of the greatest individual playoff games in franchise history.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Key Stats Grid */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold mb-6">Series Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-yellow-500" />
                Offensive Explosion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-red-500 mb-2">105 PTS</div>
              <p className="text-sm text-muted-foreground">
                Jalen Suggs' combined series total (40 + 65) - Historic playoff performance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-blue-400" />
                Clutch Gene
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-blue-400 mb-2">12 PTS</div>
              <p className="text-sm text-muted-foreground">
                Suggs' final 12 Wizards points in Game 2 to close out the series
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-purple-400 mb-2">72.5%</div>
              <p className="text-sm text-muted-foreground">
                Suggs' Game 2 field goal percentage (29-40 FG) - Unstoppable
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Game 1 Recap */}
      <section className="container py-12">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Game 1: Wizards 91, Blazers 75</CardTitle>
              <button
                onClick={() => setShowGame1BoxScore(!showGame1BoxScore)}
                className="text-sm text-primary hover:underline"
              >
                {showGame1BoxScore ? "Hide" : "Show"} Box Score
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Washington</div>
                <div className="text-4xl font-black text-red-500">91</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Portland</div>
                <div className="text-4xl font-black">75</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Game Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                Jalen Suggs announced his arrival on the playoff stage with a dominant 40-point performance, leading Washington to a commanding 16-point victory. Suggs was unstoppable, shooting 18-of-28 from the field while adding 4 assists and playing lockdown defense.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Jarrett Allen provided the perfect complement with a 22-point, 13-rebound double-double, controlling the paint on both ends. Jaylen Brown added 15 points and 6 assists as the Wizards' balanced attack overwhelmed Portland's defense.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Portland struggled to find offensive rhythm, with Trae Young and LeBron James each scoring 14 points but shooting a combined 10-of-27 from the field. The Blazers' inability to generate consistent scoring opportunities proved costly as Washington built a lead they never relinquished.
              </p>
            </div>

            {showGame1BoxScore && (
              <div className="space-y-6 mt-6">
                <div>
                  <h4 className="font-bold mb-3 text-red-500">Washington Wizards</h4>
                  <BoxScoreTable players={game1WizardsPlayers} teamName="Wizards" />
                </div>
                <div>
                  <h4 className="font-bold mb-3">Portland Trail Blazers</h4>
                  <BoxScoreTable players={game1BlazersPlayers} teamName="Blazers" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Game 2 Recap */}
      <section className="container py-12">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Game 2: Wizards 102, Blazers 92</CardTitle>
              <button
                onClick={() => setShowGame2BoxScore(!showGame2BoxScore)}
                className="text-sm text-primary hover:underline"
              >
                {showGame2BoxScore ? "Hide" : "Show"} Box Score
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Washington</div>
                <div className="text-4xl font-black text-red-500">102</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Portland</div>
                <div className="text-4xl font-black">92</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Game Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                Jalen Suggs delivered one of the greatest individual playoff performances in league history, exploding for 65 points on an absurd 29-of-40 shooting (72.5%) to close out the series. His historic night included 7 three-pointers and complete control of the game's crucial moments.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Portland made a valiant push in the fourth quarter, cutting Washington's lead to just 2 points with under 4 minutes remaining. But Suggs had other plans. The Wizards' superstar took over completely, scoring the final 12 Washington points to push the lead back to 10 and seal the series sweep.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Mark Williams led Portland with 23 points on perfect 10-of-10 shooting, while Darius Garland added 17 points and 9 assists. But no amount of balanced scoring could overcome Suggs' otherworldly performance. Jaylen Brown contributed 16 points and 7 assists for Washington in a supporting role.
              </p>
            </div>

            {showGame2BoxScore && (
              <div className="space-y-6 mt-6">
                <div>
                  <h4 className="font-bold mb-3 text-red-500">Washington Wizards</h4>
                  <BoxScoreTable players={game2WizardsPlayers} teamName="Wizards" />
                </div>
                <div>
                  <h4 className="font-bold mb-3">Portland Trail Blazers</h4>
                  <BoxScoreTable players={game2BlazersPlayers} teamName="Blazers" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* What's Next */}
      <section className="container py-12 pb-24">
        <Card className="bg-gradient-to-br from-yellow-950/30 to-yellow-900/20 border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Looking Ahead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              The Wizards advance to the second round where they'll face a formidable opponent. Jalen Suggs has announced himself as a playoff superstar with his historic 105-point series, and Washington will need more of the same if they hope to continue their championship run. The supporting cast of Jarrett Allen, Jaylen Brown, and Stephon Castle will be crucial as the competition intensifies.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
