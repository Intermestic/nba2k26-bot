import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Target, Zap, Crown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

// Game 1 Box Scores
const game1KingsPlayers = [
  { name: "D. Fox", min: 23, pts: 27, reb: 0, ast: 10, stl: 8, blk: 0, to: 3, fgm: 12, fga: 18 },
  { name: "C. Sexton", min: 22, pts: 16, reb: 1, ast: 4, stl: 1, blk: 0, to: 1, fgm: 7, fga: 14 },
  { name: "O. Okongwu", min: 20, pts: 16, reb: 10, ast: 1, stl: 1, blk: 0, to: 1, fgm: 8, fga: 10 },
  { name: "K. Leonard", min: 22, pts: 15, reb: 2, ast: 6, stl: 3, blk: 0, to: 0, fgm: 7, fga: 14 },
  { name: "T. Hendricks", min: 22, pts: 12, reb: 5, ast: 0, stl: 1, blk: 0, to: 2, fgm: 4, fga: 7 },
  { name: "D. Jones Jr.", min: 17, pts: 7, reb: 1, ast: 0, stl: 2, blk: 0, to: 0, fgm: 3, fga: 3 },
  { name: "C. Spencer", min: 1, pts: 0, reb: 0, ast: 0, stl: 1, blk: 0, to: 1, fgm: 0, fga: 0 },
  { name: "W. Richard", min: 6, pts: 0, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "D. Sharpe", min: 12, pts: 0, reb: 3, ast: 0, stl: 0, blk: 1, to: 0, fgm: 0, fga: 0 },
  { name: "D. Powell", min: 13, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 3 },
  { name: "H. Highsmith", min: 2, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
];

const game1BullsPlayers = [
  { name: "M. Buzelis", min: 19, pts: 35, reb: 4, ast: 1, stl: 0, blk: 0, to: 1, fgm: 15, fga: 21 },
  { name: "L. Doncic", min: 22, pts: 26, reb: 4, ast: 5, stl: 0, blk: 0, to: 8, fgm: 12, fga: 19 },
  { name: "D. Avdija", min: 23, pts: 6, reb: 3, ast: 1, stl: 3, blk: 0, to: 1, fgm: 3, fga: 6 },
  { name: "A. Black", min: 10, pts: 6, reb: 1, ast: 1, stl: 1, blk: 0, to: 2, fgm: 2, fga: 3 },
  { name: "L. Dort", min: 24, pts: 2, reb: 2, ast: 1, stl: 2, blk: 0, to: 1, fgm: 1, fga: 2 },
  { name: "C. Bryant", min: 13, pts: 2, reb: 1, ast: 0, stl: 1, blk: 0, to: 1, fgm: 1, fga: 4 },
  { name: "I. Jackson", min: 12, pts: 2, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 2 },
  { name: "D. Clingan", min: 20, pts: 0, reb: 4, ast: 1, stl: 0, blk: 1, to: 1, fgm: 0, fga: 1 },
  { name: "D. Knecht", min: 5, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 3 },
  { name: "K. Looney", min: 12, pts: 0, reb: 6, ast: 0, stl: 0, blk: 0, to: 3, fgm: 0, fga: 0 },
];

// Game 2 Box Scores
const game2KingsPlayers = [
  { name: "D. Fox", min: 22, pts: 31, reb: 2, ast: 8, stl: 3, blk: 0, to: 4, fgm: 13, fga: 19 },
  { name: "K. Leonard", min: 19, pts: 29, reb: 2, ast: 2, stl: 3, blk: 0, to: 1, fgm: 14, fga: 19 },
  { name: "O. Okongwu", min: 19, pts: 13, reb: 11, ast: 1, stl: 1, blk: 1, to: 1, fgm: 6, fga: 7 },
  { name: "C. Sexton", min: 22, pts: 11, reb: 2, ast: 3, stl: 0, blk: 0, to: 2, fgm: 4, fga: 8 },
  { name: "T. Hendricks", min: 21, pts: 6, reb: 10, ast: 2, stl: 1, blk: 0, to: 2, fgm: 2, fga: 5 },
  { name: "H. Highsmith", min: 6, pts: 3, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "C. Spencer", min: 1, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "D. Jones Jr.", min: 14, pts: 0, reb: 1, ast: 0, stl: 3, blk: 0, to: 0, fgm: 0, fga: 3 },
  { name: "W. Richard", min: 7, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
  { name: "D. Sharpe", min: 13, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 1, fgm: 0, fga: 0 },
  { name: "D. Powell", min: 16, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
];

const game2BullsPlayers = [
  { name: "L. Doncic", min: 19, pts: 20, reb: 2, ast: 3, stl: 1, blk: 0, to: 3, fgm: 9, fga: 19 },
  { name: "M. Buzelis", min: 13, pts: 15, reb: 1, ast: 1, stl: 1, blk: 0, to: 0, fgm: 6, fga: 14 },
  { name: "D. Avdija", min: 19, pts: 12, reb: 1, ast: 3, stl: 0, blk: 0, to: 1, fgm: 5, fga: 7 },
  { name: "D. Knecht", min: 13, pts: 7, reb: 2, ast: 2, stl: 0, blk: 0, to: 1, fgm: 3, fga: 5 },
  { name: "K. Looney", min: 9, pts: 6, reb: 5, ast: 1, stl: 2, blk: 0, to: 1, fgm: 3, fga: 4 },
  { name: "L. Dort", min: 19, pts: 2, reb: 2, ast: 0, stl: 2, blk: 0, to: 0, fgm: 1, fga: 5 },
  { name: "C. Bryant", min: 19, pts: 2, reb: 0, ast: 0, stl: 2, blk: 0, to: 1, fgm: 1, fga: 3 },
  { name: "D. Clingan", min: 15, pts: 2, reb: 3, ast: 0, stl: 1, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "A. Horford", min: 4, pts: 2, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "I. Jackson", min: 13, pts: 2, reb: 4, ast: 1, stl: 0, blk: 0, to: 1, fgm: 1, fga: 2 },
  { name: "A. Black", min: 13, pts: 0, reb: 1, ast: 5, stl: 0, blk: 0, to: 3, fgm: 0, fga: 2 },
];

export default function KingsBullsSeries() {
  const [showGame1BoxScore, setShowGame1BoxScore] = useState(false);
  const [showGame2BoxScore, setShowGame2BoxScore] = useState(false);

  const BoxScoreTable = ({ players, teamName }: { players: typeof game1KingsPlayers, teamName: string }) => (
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
            <tr key={idx} className={`border-b border-border/50 ${idx === 0 ? 'bg-purple-900/20' : ''}`}>
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
      <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 border-b border-gold-500/30">
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
                #4 Sacramento Kings vs #13 Chicago Bulls
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Series Result Banner */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 rounded-xl p-6 text-center shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/logos/kings.png" 
              alt="Kings" 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white">
                KINGS WIN 2-0
              </h2>
              <p className="text-xl text-gray-200">4-Seed Advances • Best of 3 Series Complete</p>
            </div>
          </div>
          <div className="text-xl font-bold text-white">
            Game 1: Kings 93-79 | Game 2: Kings 93-70
          </div>
        </div>

        {/* Series Storyline */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-400 flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Fox & Leonard Lead Kings to Dominant Sweep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              De'Aaron Fox was sensational in this series, averaging 29 points, 9 assists, and an 
              incredible 5.5 steals per game. His Game 1 performance of 27 points, 10 assists, and 
              8 steals was one of the most complete playoff games of the season.
            </p>
            <p className="text-gray-300 mb-4">
              Kawhi Leonard provided elite two-way play, scoring 22 points per game while adding 
              lockdown defense. His Game 2 explosion of 29 points on 14-19 shooting sealed the series.
            </p>
            <p className="text-gray-300">
              Despite Matas Buzelis's breakout performance (35 points in Game 1), the Bulls couldn't 
              overcome Luka Doncic's 8 turnovers in Game 1 and the Kings' suffocating defense.
            </p>
          </CardContent>
        </Card>

        {/* Game 1 */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-purple-900/50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="text-purple-400">Game 1</span>
              <span className="text-sm text-muted-foreground">@ Sacramento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">93</p>
                <p className="text-sm text-muted-foreground">Kings</p>
              </div>
              <div className="text-xl font-bold text-muted-foreground">FINAL</div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">79</p>
                <p className="text-sm text-muted-foreground">Bulls</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Fox dominated with 27 points, 10 assists, and 8 steals. Buzelis's 35 points for Chicago 
              wasn't enough as Doncic struggled with 8 turnovers.
            </p>
            <button 
              onClick={() => setShowGame1BoxScore(!showGame1BoxScore)}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              {showGame1BoxScore ? "Hide Box Score ▲" : "Show Box Score ▼"}
            </button>
            
            {showGame1BoxScore && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Sacramento Kings
                  </h4>
                  <BoxScoreTable players={game1KingsPlayers} teamName="Kings" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Chicago Bulls
                  </h4>
                  <BoxScoreTable players={game1BullsPlayers} teamName="Bulls" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game 2 */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-purple-900/50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="text-purple-400">Game 2</span>
              <span className="text-sm text-muted-foreground">@ Chicago</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">93</p>
                <p className="text-sm text-muted-foreground">Kings</p>
              </div>
              <div className="text-xl font-bold text-muted-foreground">FINAL</div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">70</p>
                <p className="text-sm text-muted-foreground">Bulls</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Leonard exploded for 29 points on 14-19 shooting while Fox added 31 points and 8 assists. 
              The Kings' defense held Chicago to just 70 points to clinch the series.
            </p>
            <button 
              onClick={() => setShowGame2BoxScore(!showGame2BoxScore)}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              {showGame2BoxScore ? "Hide Box Score ▲" : "Show Box Score ▼"}
            </button>
            
            {showGame2BoxScore && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Sacramento Kings
                  </h4>
                  <BoxScoreTable players={game2KingsPlayers} teamName="Kings" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Chicago Bulls
                  </h4>
                  <BoxScoreTable players={game2BullsPlayers} teamName="Bulls" />
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
                <p className="text-2xl font-bold text-purple-400">186</p>
                <p className="text-sm text-muted-foreground">Kings Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">149</p>
                <p className="text-sm text-muted-foreground">Bulls Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold-400">+37</p>
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
              Series MVP: De'Aaron Fox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span><strong>58 total points</strong> on 25-37 shooting (67.6% FG) across two games</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span><strong>18 assists</strong> - elite playmaking for the Kings offense</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span><strong>11 steals in the series</strong> - defensive dominance</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-gold-400 mt-1 flex-shrink-0" />
                <span><strong>Leonard's support</strong> - 44 points, 6 steals, elite two-way play</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="flex justify-center gap-4">
          <Link href="/playoff-bracket">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all">
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
