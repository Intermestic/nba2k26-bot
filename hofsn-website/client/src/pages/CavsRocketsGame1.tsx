import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Target, Zap, Flame, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Box score data from Cavs vs Rockets Game 1 (OT)
const rocketsPlayers = [
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
];

const cavsPlayers = [
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
];

export default function CavsRocketsGame1() {
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
                FIRST ROUND - GAME 1
              </h1>
              <p className="text-gold-400 text-lg">
                #5 Houston Rockets vs #12 Cleveland Cavaliers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Game Result Banner */}
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
                ROCKETS WIN GAME 1
              </h2>
              <p className="text-xl text-gray-200">5-Seed Holds Off Cavs in OT • Rockets Lead Series 1-0</p>
            </div>
          </div>
          <div className="text-4xl font-black text-white">
            Houston 96 - Cleveland 93 (OT)
          </div>
        </div>

        {/* Game Storyline */}
        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-red-400 flex items-center gap-2">
              <Flame className="w-6 h-6" />
              Edwards Explodes: 29 Points Lead Rockets to OT Victory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Anthony Edwards put on a playoff performance for the ages, scoring 29 points on an efficient 
              14-21 shooting to lead the Houston Rockets past the Cleveland Cavaliers 96-93 in overtime. 
              Edwards also added 3 steals, showing his two-way impact in the crucial Game 1 victory.
            </p>
            <p className="text-gray-300 mb-4">
              Zach LaVine provided crucial support with 19 points, while Bol Bol contributed 12 points 
              and 7 rebounds with 2 blocks off the bench. The Rockets needed every bit of their firepower 
              as Cleveland pushed them to the limit.
            </p>
            <p className="text-gray-300">
              For Cleveland, Shai Gilgeous-Alexander led all scorers with 26 points and an incredible 
              5 steals, while Donte DiVincenzo added 22 points. Despite the loss, the Cavaliers showed 
              they can compete with the higher-seeded Rockets.
            </p>
          </CardContent>
        </Card>

        {/* Game Box Score */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-red-900/50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <span className="text-red-400">Game 1 Final (OT)</span>
              <span className="text-sm text-muted-foreground">@ Houston</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <img 
                  src="/logos/rockets.png" 
                  alt="Rockets" 
                  className="w-12 h-12 mx-auto mb-2 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <p className="text-4xl font-black text-green-400">96</p>
                <p className="text-lg text-muted-foreground">Rockets</p>
                <p className="text-xs text-green-400">WIN</p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground px-4">FINAL (OT)</div>
              <div className="text-center flex-1">
                <img 
                  src="/logos/cavaliers.png" 
                  alt="Cavaliers" 
                  className="w-12 h-12 mx-auto mb-2 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <p className="text-4xl font-black text-red-400">93</p>
                <p className="text-lg text-muted-foreground">Cavaliers</p>
                <p className="text-xs text-red-400">LOSS</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rockets Box Score */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-red-900/30 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Houston Rockets Box Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
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
                {rocketsPlayers.map((player, idx) => (
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
          </CardContent>
        </Card>

        {/* Cavaliers Box Score */}
        <Card className="bg-card border-border">
          <CardHeader className="bg-gradient-to-r from-yellow-900/30 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Cleveland Cavaliers Box Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
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
                {cavsPlayers.map((player, idx) => (
                  <tr key={idx} className={`border-b border-border/50 ${idx === 0 ? 'bg-yellow-900/20' : ''}`}>
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
          </CardContent>
        </Card>

        {/* Series Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Series Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-red-900/20 rounded-lg p-4">
                <p className="text-3xl font-bold text-red-400">1</p>
                <p className="text-sm text-muted-foreground">Rockets Wins</p>
              </div>
              <div className="bg-yellow-900/20 rounded-lg p-4">
                <p className="text-3xl font-bold text-yellow-600">0</p>
                <p className="text-sm text-muted-foreground">Cavaliers Wins</p>
              </div>
            </div>
            <p className="text-center mt-4 text-muted-foreground">
              Best of 3 Series • Rockets lead 1-0
            </p>
          </CardContent>
        </Card>

        {/* Key Takeaways */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <span><strong>Anthony Edwards dominated</strong> with 29 points on 14-21 shooting (66.7% FG)</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0" />
                <span><strong>SGA led all scorers</strong> with 26 points and 5 steals in a losing effort</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <span><strong>Bol Bol's impact</strong> - 12 points, 7 rebounds, 2 blocks off the bench</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-gold-400 mt-1 flex-shrink-0" />
                <span><strong>Overtime thriller</strong> - 3-point margin suggests this series is far from over</span>
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
