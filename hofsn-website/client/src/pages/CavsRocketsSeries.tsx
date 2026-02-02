import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Target, Zap, Crown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

// Game 1 Box Scores
const game1RocketsPlayers = [
  { name: "A. Edwards", min: 21, pts: 29, reb: 1, ast: 3, stl: 3, blk: 0, to: 3, fgm: 14, fga: 21 },
  { name: "Z. LaVine", min: 21, pts: 19, reb: 1, ast: 2, stl: 0, blk: 0, to: 0, fgm: 9, fga: 14 },
  { name: "B. Bol", min: 15, pts: 12, reb: 7, ast: 1, stl: 0, blk: 2, to: 2, fgm: 6, fga: 7 },
  { name: "D. Murray", min: 18, pts: 10, reb: 3, ast: 3, stl: 1, blk: 0, to: 1, fgm: 5, fga: 12 },
  { name: "K. Porzingis", min: 24, pts: 8, reb: 6, ast: 0, stl: 1, blk: 1, to: 2, fgm: 4, fga: 7 },
  { name: "C. Bassey", min: 12, pts: 6, reb: 2, ast: 0, stl: 0, blk: 0, to: 1, fgm: 3, fga: 3 },
  { name: "C. Whitmore", min: 12, pts: 6, reb: 0, ast: 1, stl: 2, blk: 0, to: 3, fgm: 3, fga: 3 },
  { name: "B. Fernando", min: 11, pts: 4, reb: 0, ast: 1, stl: 1, blk: 0, to: 1, fgm: 2, fga: 2 },
  { name: "D. Exum", min: 1, pts: 2, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "D. Brooks", min: 19, pts: 0, reb: 1, ast: 2, stl: 1, blk: 0, to: 1, fgm: 0, fga: 0 },
  { name: "Q. Grimes", min: 8, pts: 0, reb: 2, ast: 2, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "M. Thybulle", min: 3, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "O. Agbaji", min: 9, pts: 0, reb: 1, ast: 1, stl: 1, blk: 0, to: 1, fgm: 0, fga: 0 },
  { name: "J. Hayes", min: 6, pts: 0, reb: 2, ast: 0, stl: 0, blk: 1, to: 0, fgm: 0, fga: 0 },
];

const game1CavsPlayers = [
  { name: "S. Gilgeous-Alexander", min: 22, pts: 26, reb: 2, ast: 3, stl: 5, blk: 0, to: 2, fgm: 12, fga: 25 },
  { name: "D. DiVincenzo", min: 14, pts: 22, reb: 1, ast: 0, stl: 0, blk: 0, to: 3, fgm: 9, fga: 13 },
  { name: "T. Murphy III", min: 21, pts: 10, reb: 4, ast: 4, stl: 0, blk: 0, to: 0, fgm: 5, fga: 10 },
  { name: "K. Ware", min: 23, pts: 10, reb: 6, ast: 1, stl: 3, blk: 0, to: 2, fgm: 4, fga: 7 },
  { name: "K. Murray", min: 21, pts: 7, reb: 0, ast: 0, stl: 0, blk: 0, to: 1, fgm: 3, fga: 6 },
  { name: "K. Johnson", min: 15, pts: 6, reb: 2, ast: 1, stl: 2, blk: 0, to: 0, fgm: 3, fga: 4 },
  { name: "B. Portis Jr.", min: 20, pts: 5, reb: 7, ast: 2, stl: 0, blk: 0, to: 3, fgm: 2, fga: 3 },
  { name: "T. Hardaway Jr.", min: 15, pts: 4, reb: 2, ast: 1, stl: 2, blk: 0, to: 0, fgm: 2, fga: 6 },
  { name: "G. Bitadze", min: 9, pts: 3, reb: 1, ast: 1, stl: 0, blk: 0, to: 1, fgm: 1, fga: 1 },
  { name: "N. Clowney", min: 16, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 1, fgm: 0, fga: 2 },
  { name: "D. Cardwell", min: 4, pts: 0, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
];

// Game 2 Box Scores
const game2RocketsPlayers = [
  { name: "A. Edwards", min: 23, pts: 40, reb: 3, ast: 2, stl: 1, blk: 0, to: 1, fgm: 19, fga: 26 },
  { name: "Z. LaVine", min: 22, pts: 19, reb: 1, ast: 3, stl: 1, blk: 0, to: 0, fgm: 8, fga: 17 },
  { name: "D. Murray", min: 16, pts: 10, reb: 3, ast: 3, stl: 2, blk: 0, to: 1, fgm: 5, fga: 9 },
  { name: "K. Porzingis", min: 21, pts: 9, reb: 7, ast: 2, stl: 0, blk: 0, to: 2, fgm: 4, fga: 7 },
  { name: "C. Bassey", min: 14, pts: 6, reb: 3, ast: 1, stl: 0, blk: 2, to: 0, fgm: 3, fga: 4 },
  { name: "C. Whitmore", min: 12, pts: 6, reb: 1, ast: 2, stl: 1, blk: 0, to: 0, fgm: 3, fga: 5 },
  { name: "D. Brooks", min: 17, pts: 4, reb: 2, ast: 1, stl: 1, blk: 0, to: 0, fgm: 2, fga: 2 },
  { name: "B. Fernando", min: 13, pts: 4, reb: 2, ast: 1, stl: 1, blk: 0, to: 0, fgm: 2, fga: 3 },
  { name: "B. Bol", min: 20, pts: 2, reb: 5, ast: 0, stl: 0, blk: 1, to: 1, fgm: 1, fga: 3 },
  { name: "Q. Grimes", min: 7, pts: 0, reb: 0, ast: 0, stl: 1, blk: 0, to: 0, fgm: 0, fga: 1 },
  { name: "M. Thybulle", min: 7, pts: 0, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "O. Agbaji", min: 6, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "J. Hayes", min: 2, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
];

const game2CavsPlayers = [
  { name: "S. Gilgeous-Alexander", min: 22, pts: 28, reb: 1, ast: 4, stl: 2, blk: 0, to: 1, fgm: 11, fga: 29 },
  { name: "D. DiVincenzo", min: 14, pts: 22, reb: 2, ast: 3, stl: 0, blk: 0, to: 0, fgm: 11, fga: 17 },
  { name: "T. Murphy III", min: 20, pts: 11, reb: 2, ast: 2, stl: 0, blk: 0, to: 2, fgm: 5, fga: 11 },
  { name: "K. Ware", min: 22, pts: 9, reb: 9, ast: 2, stl: 0, blk: 2, to: 0, fgm: 3, fga: 4 },
  { name: "B. Portis Jr.", min: 18, pts: 6, reb: 7, ast: 1, stl: 0, blk: 0, to: 0, fgm: 3, fga: 3 },
  { name: "T. Hardaway Jr.", min: 16, pts: 6, reb: 3, ast: 3, stl: 0, blk: 0, to: 0, fgm: 3, fga: 4 },
  { name: "K. Johnson", min: 15, pts: 6, reb: 1, ast: 2, stl: 0, blk: 0, to: 1, fgm: 2, fga: 3 },
  { name: "K. Murray", min: 21, pts: 5, reb: 1, ast: 1, stl: 1, blk: 0, to: 2, fgm: 1, fga: 2 },
  { name: "G. Bitadze", min: 10, pts: 2, reb: 2, ast: 0, stl: 1, blk: 0, to: 1, fgm: 1, fga: 1 },
  { name: "N. Clowney", min: 18, pts: 2, reb: 4, ast: 1, stl: 0, blk: 1, to: 1, fgm: 1, fga: 1 },
  { name: "D. Cardwell", min: 4, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 1 },
];

export default function CavsRocketsSeries() {
  const [showGame1BoxScore, setShowGame1BoxScore] = useState(false);
  const [showGame2BoxScore, setShowGame2BoxScore] = useState(false);

  const BoxScoreTable = ({ players, teamName }: { players: typeof game1RocketsPlayers, teamName: string }) => (
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
      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 border-b border-gold-500/30">
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
                #5 Houston Rockets vs #12 Cleveland Cavaliers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Series Result Banner */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-xl p-6 text-center shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/logos/rockets.png" 
              alt="Rockets" 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white">
                ROCKETS WIN 2-0
              </h2>
              <p className="text-xl text-gray-200">5-Seed Advances • Best of 3 Series Complete</p>
            </div>
          </div>
          <div className="text-xl font-bold text-white">
            Game 1: Rockets 96-93 (OT) | Game 2: Rockets 100-97
          </div>
        </div>

        {/* Series Storyline */}
        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-red-400 flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Anthony Edwards Dominates in Playoff Debut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Anthony Edwards was absolutely unstoppable in this series, scoring 69 combined points 
              across two games. His Game 2 performance of 40 points on 19-26 shooting (73.1% FG) was 
              one of the most efficient playoff games in league history.
            </p>
            <p className="text-gray-300 mb-4">
              Despite Shai Gilgeous-Alexander's heroic efforts (54 total points in the series) and 
              Donte DiVincenzo's consistent scoring (44 points), the Cavaliers couldn't contain 
              Edwards and the Rockets' balanced attack.
            </p>
            <p className="text-gray-300">
              Both games were decided by just 3 points, with Game 1 going to overtime. The Rockets' 
              depth and Edwards' clutch performances proved to be the difference in this hard-fought series.
            </p>
          </CardContent>
        </Card>

        {/* Game 1 */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-red-900/50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="text-red-400">Game 1 (OT)</span>
              <span className="text-sm text-muted-foreground">@ Houston</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">96</p>
                <p className="text-sm text-muted-foreground">Rockets</p>
              </div>
              <div className="text-xl font-bold text-muted-foreground">FINAL (OT)</div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">93</p>
                <p className="text-sm text-muted-foreground">Cavaliers</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Edwards led with 29 points on 14-21 shooting. SGA had 26 points and 5 steals for Cleveland, 
              but the Rockets' depth proved decisive in overtime.
            </p>
            <button 
              onClick={() => setShowGame1BoxScore(!showGame1BoxScore)}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              {showGame1BoxScore ? "Hide Box Score ▲" : "Show Box Score ▼"}
            </button>
            
            {showGame1BoxScore && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Houston Rockets
                  </h4>
                  <BoxScoreTable players={game1RocketsPlayers} teamName="Rockets" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Cleveland Cavaliers
                  </h4>
                  <BoxScoreTable players={game1CavsPlayers} teamName="Cavaliers" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game 2 */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-red-900/50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="text-red-400">Game 2</span>
              <span className="text-sm text-muted-foreground">@ Cleveland</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">100</p>
                <p className="text-sm text-muted-foreground">Rockets</p>
              </div>
              <div className="text-xl font-bold text-muted-foreground">FINAL</div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">97</p>
                <p className="text-sm text-muted-foreground">Cavaliers</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Edwards exploded for 40 points on 19-26 shooting (73.1% FG) to clinch the series. 
              SGA and DiVincenzo combined for 50 points but couldn't overcome Ant's dominance.
            </p>
            <button 
              onClick={() => setShowGame2BoxScore(!showGame2BoxScore)}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              {showGame2BoxScore ? "Hide Box Score ▲" : "Show Box Score ▼"}
            </button>
            
            {showGame2BoxScore && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Houston Rockets
                  </h4>
                  <BoxScoreTable players={game2RocketsPlayers} teamName="Rockets" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Cleveland Cavaliers
                  </h4>
                  <BoxScoreTable players={game2CavsPlayers} teamName="Cavaliers" />
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
                <p className="text-2xl font-bold text-red-400">196</p>
                <p className="text-sm text-muted-foreground">Rockets Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">190</p>
                <p className="text-sm text-muted-foreground">Cavaliers Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold-400">+6</p>
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
              Series MVP: Anthony Edwards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <span><strong>69 total points</strong> on 33-47 shooting (70.2% FG) across two games</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <span><strong>40-point Game 2</strong> - one of the most efficient playoff performances ever</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <span><strong>4 steals in the series</strong> - contributed on both ends</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-gold-400 mt-1 flex-shrink-0" />
                <span><strong>LaVine's consistency</strong> - 38 points, 5 assists across both games</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="flex justify-center gap-4">
          <Link href="/playoff-bracket">
            <button className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all">
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
