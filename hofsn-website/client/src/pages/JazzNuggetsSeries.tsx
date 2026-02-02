import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Target, Zap, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

// Game 1 Box Scores
const game1NuggetsPlayers = [
  { name: "S. Curry", min: 20, pts: 31, reb: 0, ast: 8, stl: 2, blk: 0, to: 3, fgm: 13, fga: 21 },
  { name: "R. Westbrook", min: 14, pts: 27, reb: 3, ast: 6, stl: 1, blk: 0, to: 1, fgm: 12, fga: 13 },
  { name: "K. Caldwell-Pope", min: 16, pts: 12, reb: 2, ast: 3, stl: 0, blk: 0, to: 0, fgm: 5, fga: 9 },
  { name: "J. Collins", min: 20, pts: 10, reb: 3, ast: 2, stl: 0, blk: 0, to: 0, fgm: 5, fga: 6 },
  { name: "C. Wood", min: 11, pts: 10, reb: 3, ast: 0, stl: 0, blk: 0, to: 0, fgm: 5, fga: 5 },
  { name: "M. Bridges", min: 18, pts: 9, reb: 3, ast: 0, stl: 0, blk: 0, to: 0, fgm: 4, fga: 7 },
  { name: "A. Mitchell", min: 5, pts: 6, reb: 0, ast: 2, stl: 0, blk: 0, to: 0, fgm: 2, fga: 2 },
  { name: "L. Ball", min: 17, pts: 2, reb: 0, ast: 4, stl: 1, blk: 0, to: 2, fgm: 1, fga: 2 },
  { name: "C. Capela", min: 13, pts: 2, reb: 6, ast: 1, stl: 0, blk: 2, to: 0, fgm: 1, fga: 1 },
  { name: "J.T. Thor", min: 11, pts: 2, reb: 0, ast: 2, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "B. Lopez", min: 11, pts: 2, reb: 3, ast: 1, stl: 0, blk: 1, to: 0, fgm: 1, fga: 1 },
];

const game1JazzPlayers = [
  { name: "J. Harden", min: 22, pts: 35, reb: 0, ast: 6, stl: 1, blk: 0, to: 1, fgm: 13, fga: 24 },
  { name: "J. Butler", min: 23, pts: 26, reb: 2, ast: 6, stl: 1, blk: 0, to: 0, fgm: 11, fga: 16 },
  { name: "J. Grant", min: 25, pts: 9, reb: 3, ast: 1, stl: 0, blk: 1, to: 1, fgm: 4, fga: 6 },
  { name: "N. Claxton", min: 23, pts: 8, reb: 5, ast: 1, stl: 0, blk: 0, to: 0, fgm: 4, fga: 5 },
  { name: "T.J. McConnell", min: 10, pts: 8, reb: 1, ast: 1, stl: 1, blk: 0, to: 1, fgm: 4, fga: 4 },
  { name: "M. Moody", min: 9, pts: 4, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 2, fga: 3 },
  { name: "H. Jones", min: 23, pts: 3, reb: 1, ast: 0, stl: 2, blk: 0, to: 2, fgm: 1, fga: 3 },
  { name: "N. Powell", min: 9, pts: 3, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 3 },
  { name: "T. Thompson", min: 9, pts: 2, reb: 3, ast: 0, stl: 0, blk: 0, to: 1, fgm: 1, fga: 2 },
  { name: "J. Kuminga", min: 7, pts: 0, reb: 1, ast: 1, stl: 1, blk: 0, to: 0, fgm: 0, fga: 0 },
];

// Game 2 Box Scores
const game2NuggetsPlayers = [
  { name: "S. Curry", min: 16, pts: 39, reb: 5, ast: 8, stl: 0, blk: 0, to: 1, fgm: 15, fga: 22 },
  { name: "R. Westbrook", min: 19, pts: 26, reb: 13, ast: 7, stl: 3, blk: 0, to: 3, fgm: 12, fga: 22 },
  { name: "M. Bridges", min: 16, pts: 18, reb: 7, ast: 4, stl: 1, blk: 1, to: 0, fgm: 8, fga: 10 },
  { name: "J. Collins", min: 21, pts: 15, reb: 7, ast: 3, stl: 0, blk: 0, to: 1, fgm: 5, fga: 8 },
  { name: "C. Thomas", min: 11, pts: 10, reb: 0, ast: 3, stl: 2, blk: 0, to: 2, fgm: 5, fga: 8 },
  { name: "A. Mitchell", min: 11, pts: 10, reb: 2, ast: 2, stl: 2, blk: 0, to: 0, fgm: 4, fga: 6 },
  { name: "C. Capela", min: 9, pts: 6, reb: 3, ast: 0, stl: 0, blk: 0, to: 2, fgm: 3, fga: 4 },
  { name: "K. Caldwell-Pope", min: 16, pts: 6, reb: 2, ast: 4, stl: 1, blk: 0, to: 4, fgm: 3, fga: 5 },
  { name: "J.T. Thor", min: 11, pts: 5, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 2, fga: 2 },
  { name: "C. Wood", min: 5, pts: 4, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 2, fga: 2 },
  { name: "L. Ball", min: 14, pts: 3, reb: 0, ast: 0, stl: 3, blk: 0, to: 0, fgm: 1, fga: 1 },
];

const game2JazzPlayers = [
  { name: "J. Harden", min: 20, pts: 26, reb: 2, ast: 8, stl: 0, blk: 0, to: 2, fgm: 9, fga: 15 },
  { name: "J. Butler", min: 25, pts: 25, reb: 5, ast: 6, stl: 0, blk: 1, to: 3, fgm: 11, fga: 23 },
  { name: "J. Kuminga", min: 16, pts: 18, reb: 3, ast: 1, stl: 1, blk: 0, to: 1, fgm: 8, fga: 14 },
  { name: "J. Grant", min: 20, pts: 16, reb: 1, ast: 0, stl: 1, blk: 1, to: 0, fgm: 7, fga: 15 },
  { name: "N. Powell", min: 12, pts: 12, reb: 1, ast: 1, stl: 0, blk: 0, to: 4, fgm: 5, fga: 9 },
  { name: "N. Claxton", min: 18, pts: 10, reb: 3, ast: 2, stl: 0, blk: 0, to: 2, fgm: 5, fga: 6 },
  { name: "T.J. McConnell", min: 7, pts: 4, reb: 1, ast: 4, stl: 0, blk: 0, to: 0, fgm: 2, fga: 3 },
  { name: "M. Moody", min: 5, pts: 3, reb: 0, ast: 1, stl: 1, blk: 0, to: 0, fgm: 1, fga: 2 },
  { name: "S. Mykhailiuk", min: 1, pts: 2, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "C. Koloko", min: 5, pts: 1, reb: 3, ast: 2, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "H. Jones", min: 19, pts: 0, reb: 4, ast: 3, stl: 2, blk: 0, to: 3, fgm: 0, fga: 0 },
];

export default function JazzNuggetsSeries() {
  const [showGame1BoxScore, setShowGame1BoxScore] = useState(false);
  const [showGame2BoxScore, setShowGame2BoxScore] = useState(false);

  const BoxScoreTable = ({ players, teamName }: { players: typeof game1NuggetsPlayers, teamName: string }) => (
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
            <tr key={idx} className={`border-b border-border/50 ${idx === 0 ? 'bg-blue-900/20' : ''}`}>
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
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-yellow-700 to-blue-900 border-b border-gold-500/30">
        <div className="container py-4">
          <Link href="/playoff-bracket">
            <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Playoff Bracket
            </button>
          </Link>
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-gold-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                FIRST ROUND SERIES RECAP
              </h1>
              <p className="text-gold-400 text-lg">
                #7 Denver Nuggets vs #10 Utah Jazz
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Series Result Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-yellow-600 rounded-xl p-6 text-center shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/logos/nuggets.png" 
              alt="Nuggets" 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white">
                NUGGETS WIN 2-0
              </h2>
              <p className="text-xl text-gray-200">7-Seed Advances • Best of 3 Series Complete</p>
            </div>
          </div>
          <div className="text-xl font-bold text-white">
            Game 1: Nuggets 113-98 | Game 2: Nuggets 144-117
          </div>
        </div>

        {/* Series Storyline */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-yellow-800/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-400 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Curry & Westbrook Dominate: Nuggets Sweep Jazz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Stephen Curry was unstoppable in this series, averaging 35 points per game while shooting 
              lights out from deep. His Game 2 performance of 39 points on 15-22 shooting was one of 
              the best individual playoff performances of the season.
            </p>
            <p className="text-gray-300 mb-4">
              Russell Westbrook provided the perfect complement, nearly averaging a triple-double with 
              26.5 points, 8 rebounds, and 6.5 assists across the two games. His 13-rebound, 7-assist 
              performance in Game 2 was crucial to Denver's dominant victory.
            </p>
            <p className="text-gray-300">
              Despite James Harden's heroic efforts (35 and 26 points) and Jimmy Butler's consistent 
              production, the Jazz simply had no answer for Denver's offensive firepower.
            </p>
          </CardContent>
        </Card>

        {/* Game 1 */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-blue-900/50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="text-blue-400">Game 1</span>
              <span className="text-sm text-muted-foreground">@ Denver</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">113</p>
                <p className="text-sm text-muted-foreground">Nuggets</p>
              </div>
              <div className="text-xl font-bold text-muted-foreground">FINAL</div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">98</p>
                <p className="text-sm text-muted-foreground">Jazz</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Curry led with 31 points and 8 assists, while Westbrook added 27 points on incredible 
              12-13 shooting. Harden's 35 points for Utah wasn't enough to overcome Denver's balanced attack.
            </p>
            <button 
              onClick={() => setShowGame1BoxScore(!showGame1BoxScore)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {showGame1BoxScore ? "Hide Box Score ▲" : "Show Box Score ▼"}
            </button>
            
            {showGame1BoxScore && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Denver Nuggets
                  </h4>
                  <BoxScoreTable players={game1NuggetsPlayers} teamName="Nuggets" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Utah Jazz
                  </h4>
                  <BoxScoreTable players={game1JazzPlayers} teamName="Jazz" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game 2 */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-blue-900/50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="text-blue-400">Game 2</span>
              <span className="text-sm text-muted-foreground">@ Utah</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">144</p>
                <p className="text-sm text-muted-foreground">Nuggets</p>
              </div>
              <div className="text-xl font-bold text-muted-foreground">FINAL</div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">117</p>
                <p className="text-sm text-muted-foreground">Jazz</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Curry exploded for 39 points (15-22 FG, 7-12 3PT) while Westbrook recorded a near 
              triple-double with 26 points, 13 rebounds, and 7 assists. Denver's 144 points was 
              one of the highest-scoring playoff games in league history.
            </p>
            <button 
              onClick={() => setShowGame2BoxScore(!showGame2BoxScore)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {showGame2BoxScore ? "Hide Box Score ▲" : "Show Box Score ▼"}
            </button>
            
            {showGame2BoxScore && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Denver Nuggets
                  </h4>
                  <BoxScoreTable players={game2NuggetsPlayers} teamName="Nuggets" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Utah Jazz
                  </h4>
                  <BoxScoreTable players={game2JazzPlayers} teamName="Jazz" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Series Stats */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Series Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-400">257</p>
                <p className="text-sm text-muted-foreground">Nuggets Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">215</p>
                <p className="text-sm text-muted-foreground">Jazz Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold-400">+42</p>
                <p className="text-sm text-muted-foreground">Point Differential</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Takeaways */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Series MVP: Stephen Curry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong>70 total points</strong> on 28-43 shooting (65.1% FG) across two games</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong>11-21 from three</strong> (52.4%) - absolutely lethal from deep</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span><strong>16 assists, only 4 turnovers</strong> - elite playmaking efficiency</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-gold-400 mt-1 flex-shrink-0" />
                <span><strong>Westbrook's support</strong> - 53 points, 16 rebounds, 13 assists in the series</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="flex justify-center gap-4">
          <Link href="/playoff-bracket">
            <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all">
              ← Back to Playoff Bracket
            </button>
          </Link>
          <Link href="/">
            <button className="px-8 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all">
              🏠 Home
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            © 2024 Hall of Fame Basketball Association. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
