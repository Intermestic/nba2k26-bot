import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RaptorsPacersSeries() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 border-b border-gold-500/30">
        <div className="container py-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-gold-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                FIRST ROUND SERIES RECAP
              </h1>
              <p className="text-gold-400 text-lg">
                #1 Toronto Raptors vs #16 Indiana Pacers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Series Result Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-center shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/team-logos/raptors.png" 
              alt="Raptors" 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white">
                RAPTORS SWEEP 2-0
              </h2>
              <p className="text-xl text-gray-200">Advance to Second Round</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            Game 1: 87-77 | Game 2: 128-63
          </div>
        </div>

        {/* Series MVP */}
        <Card className="bg-gradient-to-br from-gold-900/20 to-gold-800/10 border-gold-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-gold-400 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Series MVP: Jayson Tatum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-3xl font-black text-gold-400">76</div>
                <div className="text-sm text-gray-400">Total Points</div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-3xl font-black text-gold-400">16</div>
                <div className="text-sm text-gray-400">Rebounds</div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-3xl font-black text-gold-400">10</div>
                <div className="text-sm text-gray-400">Assists</div>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <div className="text-3xl font-black text-gold-400">74.4%</div>
                <div className="text-sm text-gray-400">FG% (32-43)</div>
              </div>
            </div>
            <p className="mt-4 text-gray-300">
              Tatum was absolutely dominant throughout the series, averaging 38 PPG on historic efficiency. 
              His Game 2 performance of 50 points on 21-26 shooting (80.8%) was one of the most efficient 
              50-point games in playoff history.
            </p>
          </CardContent>
        </Card>

        {/* Game Recaps */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Game 1 */}
          <Card className="bg-card border-border">
            <CardHeader className="bg-gradient-to-r from-red-900/50 to-transparent">
              <CardTitle className="flex items-center justify-between">
                <span>Game 1</span>
                <span className="text-gold-400">TOR 87 - IND 77</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Top Performers - Raptors
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="text-white font-semibold">J. Tatum:</span> 26 PTS, 8 REB, 5 AST, 2 STL (11-17 FG, 64.7%)</li>
                  <li><span className="text-white font-semibold">K. Olynyk:</span> 18 PTS, 6 REB (7-12 FG)</li>
                  <li><span className="text-white font-semibold">P. Pritchard:</span> 12 PTS, 4 AST (5-9 FG)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Top Performers - Pacers
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="text-white font-semibold">K. Towns:</span> 15 PTS, 8 REB (6-14 FG)</li>
                  <li><span className="text-white font-semibold">T. Herro:</span> 14 PTS, 3 AST (5-12 FG)</li>
                  <li><span className="text-white font-semibold">A. Davis:</span> 12 PTS, 5 REB (5-10 FG)</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-border">
                <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Key Metrics
                </h4>
                <p className="text-sm text-muted-foreground">
                  The Raptors controlled the pace throughout, shooting 48% from the field while holding 
                  Indiana to just 39%. Toronto's defense forced 14 turnovers and limited the Pacers to 
                  just 6-22 from three-point range.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Game 2 */}
          <Card className="bg-card border-border">
            <CardHeader className="bg-gradient-to-r from-red-900/50 to-transparent">
              <CardTitle className="flex items-center justify-between">
                <span>Game 2</span>
                <span className="text-gold-400">TOR 128 - IND 63</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Top Performers - Raptors
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="text-white font-semibold">J. Tatum:</span> 50 PTS, 8 REB, 5 AST, 3 STL (21-26 FG, 80.8%)</li>
                  <li><span className="text-white font-semibold">K. Olynyk:</span> 35 PTS, 5 REB (14-21 FG, 7-12 3PT)</li>
                  <li><span className="text-white font-semibold">P. Pritchard:</span> 15 PTS, 5 AST (6-14 FG)</li>
                  <li><span className="text-white font-semibold">O. Anunoby:</span> 14 PTS, 3 REB (5-8 FG)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Top Performers - Pacers
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="text-white font-semibold">K. Towns:</span> 12 PTS, 4 REB (6-18 FG, 0-8 3PT)</li>
                  <li><span className="text-white font-semibold">S. Sharpe:</span> 12 PTS, 5 REB (6-10 FG)</li>
                  <li><span className="text-white font-semibold">T. Herro:</span> 10 PTS, 3 AST (4-14 FG, 2-9 3PT)</li>
                  <li><span className="text-white font-semibold">A. Davis:</span> 10 PTS, 3 REB (4-8 FG)</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-border">
                <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Key Metrics
                </h4>
                <p className="text-sm text-muted-foreground">
                  A historic blowout. Toronto shot 67% from the field (52-78) and 58% from three (19-33). 
                  The Raptors dominated in every category: 60 points in the paint, 42 bench points, 
                  26 fast break points. Indiana committed 11 turnovers and shot just 39% overall.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Comparison */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Series Team Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4">Stat</th>
                    <th className="text-center py-2 px-4 text-red-400">Raptors</th>
                    <th className="text-center py-2 px-4 text-blue-400">Pacers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-4">Total Points</td>
                    <td className="text-center py-2 px-4 font-bold text-gold-400">215</td>
                    <td className="text-center py-2 px-4">140</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-4">FG%</td>
                    <td className="text-center py-2 px-4 font-bold text-gold-400">57.5%</td>
                    <td className="text-center py-2 px-4">39.0%</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-4">3PT%</td>
                    <td className="text-center py-2 px-4 font-bold text-gold-400">45.5%</td>
                    <td className="text-center py-2 px-4">22.6%</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-4">Points in Paint</td>
                    <td className="text-center py-2 px-4 font-bold text-gold-400">108</td>
                    <td className="text-center py-2 px-4">78</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-4">Fast Break Points</td>
                    <td className="text-center py-2 px-4 font-bold text-gold-400">44</td>
                    <td className="text-center py-2 px-4">26</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">Turnovers</td>
                    <td className="text-center py-2 px-4 font-bold text-gold-400">8</td>
                    <td className="text-center py-2 px-4">25</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Series Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Series Analysis</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The #1 seed Toronto Raptors made quick work of the #16 Indiana Pacers, completing a dominant 
              2-0 sweep to advance to the second round. The series was never competitive, with Toronto 
              outscoring Indiana by a combined 75 points (215-140) across the two games.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-white">Jayson Tatum</strong> was the undisputed star of the series, 
              putting up historic numbers with 76 total points on 74.4% shooting. His Game 2 performance 
              (50 points on 21-26 FG) was one of the most efficient scoring outputs in playoff history. 
              Kelly Olynyk provided excellent secondary scoring with 53 combined points across both games.
            </p>
            <p className="text-muted-foreground">
              For Indiana, the series exposed significant roster limitations. Karl-Anthony Towns struggled 
              mightily, shooting just 12-32 (37.5%) for the series and going 0-8 from three in Game 2. 
              The Pacers' three-point shooting was abysmal at 22.6% for the series, and they committed 
              25 turnovers compared to Toronto's 8.
            </p>
            <p className="text-muted-foreground">
              The Raptors now await the winner of the #8 San Antonio Spurs vs #9 Milwaukee Bucks series 
              in the second round.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link href="/playoff-bracket">
            <button className="px-6 py-3 bg-gold-500 text-black font-bold rounded-lg hover:bg-gold-600 transition-colors">
              View Full Playoff Bracket
            </button>
          </Link>
          <Link href="/">
            <button className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors">
              Back to Home
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
          <p className="text-xs mt-2">
            HoFSN - Your source for HoFBA league coverage
          </p>
        </div>
      </footer>
    </div>
  );
}
