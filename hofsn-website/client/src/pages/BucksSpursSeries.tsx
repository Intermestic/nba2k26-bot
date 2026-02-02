import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

// Game 1: Bucks 99, Spurs 95
const game1BucksPlayers = [
  { name: "R.J. Barrett", min: 17, pts: 27, reb: 2, ast: 2, stl: 0, blk: 0, to: 2, fgm: 11, fga: 18 },
  { name: "F. VanVleet", min: 19, pts: 20, reb: 0, ast: 3, stl: 1, blk: 0, to: 1, fgm: 8, fga: 15 },
  { name: "B. Adebayo", min: 17, pts: 12, reb: 6, ast: 2, stl: 1, blk: 0, to: 1, fgm: 6, fga: 8 },
  { name: "K. George", min: 13, pts: 12, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 5, fga: 11 },
  { name: "C. Coward", min: 15, pts: 9, reb: 2, ast: 2, stl: 0, blk: 0, to: 1, fgm: 4, fga: 9 },
  { name: "N. Jovic", min: 15, pts: 6, reb: 5, ast: 1, stl: 0, blk: 0, to: 0, fgm: 2, fga: 4 },
  { name: "Y. Missi", min: 17, pts: 5, reb: 6, ast: 1, stl: 1, blk: 1, to: 1, fgm: 2, fga: 3 },
  { name: "J. McDaniels", min: 17, pts: 4, reb: 2, ast: 2, stl: 3, blk: 0, to: 1, fgm: 2, fga: 3 },
  { name: "G.G. Jackson", min: 15, pts: 4, reb: 4, ast: 0, stl: 0, blk: 0, to: 1, fgm: 2, fga: 4 },
  { name: "S. Adams", min: 15, pts: 0, reb: 6, ast: 2, stl: 1, blk: 0, to: 1, fgm: 0, fga: 1 },
];

const game1SpursPlayers = [
  { name: "H. Barnes", min: 18, pts: 28, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 12, fga: 15 },
  { name: "D. Booker", min: 20, pts: 26, reb: 1, ast: 7, stl: 0, blk: 0, to: 6, fgm: 12, fga: 21 },
  { name: "A. Simons", min: 13, pts: 14, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 7, fga: 12 },
  { name: "M. Smart", min: 21, pts: 13, reb: 3, ast: 1, stl: 3, blk: 0, to: 0, fgm: 5, fga: 7 },
  { name: "M. Diabate", min: 8, pts: 4, reb: 4, ast: 1, stl: 0, blk: 0, to: 2, fgm: 2, fga: 2 },
  { name: "D. Vassell", min: 15, pts: 4, reb: 4, ast: 1, stl: 0, blk: 0, to: 0, fgm: 2, fga: 7 },
  { name: "L. Markkanen", min: 15, pts: 2, reb: 3, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 6 },
  { name: "N. Tomlin", min: 12, pts: 2, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1 },
  { name: "S. Labissiere", min: 3, pts: 2, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 1, fga: 3 },
  { name: "R. Gobert", min: 15, pts: 0, reb: 6, ast: 1, stl: 1, blk: 0, to: 1, fgm: 0, fga: 1 },
];

export default function BucksSpursSeries() {
  const [showGame1BoxScore, setShowGame1BoxScore] = useState(false);

  const BoxScoreTable = ({ players, teamName }: { players: typeof game1BucksPlayers, teamName: string }) => (
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
      <div className="bg-gradient-to-b from-blue-900/20 to-background border-b border-border">
        <div className="container py-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gold-400 text-sm font-bold tracking-wide">🏆 FIRST ROUND - SERIES IN PROGRESS</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                Bucks Lead <span className="text-blue-500">1-0</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Milwaukee takes Game 1 in thrilling 3-point shootout, 99-95
              </p>
            </div>
            
            <Card className="bg-card/50 border-2 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-muted-foreground mb-1">SERIES RESULT</div>
                <div className="text-5xl font-black text-blue-500 mb-1">1-0</div>
                <div className="text-sm font-medium">Bucks Lead</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Series Overview */}
      <div className="container py-12">
        <Card className="bg-card border-gold-500/20">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👑</span>
              <h2 className="text-2xl font-bold">Series Overview</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed mb-4">
                The Milwaukee Bucks struck first in their first-round matchup against the San Antonio Spurs, claiming a hard-fought 99-95 victory in Game 1. The contest turned into a high-octane 3-point shootout, with both teams trading long-range bombs throughout the night.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                R.J. Barrett led the Bucks' offensive charge with a game-high 27 points on efficient 11-of-18 shooting, while Fred VanVleet added 20 points and knocked down four triples. Milwaukee's perimeter attack was relentless, launching 34 three-point attempts and converting 13 of them to keep San Antonio's defense stretched thin.
              </p>
              <p className="text-lg leading-relaxed">
                San Antonio got monster performances from Harrison Barnes (28 points on 12-of-15 shooting) and Devin Booker (26 points, 7 assists), but the Spurs couldn't overcome their struggles at the free-throw line (1-of-7) and Milwaukee's balanced scoring attack. Despite dominating the paint with 60 points, the Spurs' inability to convert at the charity stripe proved costly in the four-point loss.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Series Statistics */}
      <div className="container pb-12">
        <h2 className="text-3xl font-black mb-6">Series Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-orange-900/20 to-card border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-orange-400">3-Point Volume</h3>
              </div>
              <div className="text-4xl font-black mb-2">13/34</div>
              <p className="text-sm text-muted-foreground">Bucks' three-point shooting - 38.2% from deep kept Spurs on their heels</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-card border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-blue-400">Balanced Attack</h3>
              </div>
              <div className="text-4xl font-black mb-2">47 PTS</div>
              <p className="text-sm text-muted-foreground">Combined from Barrett (27) and VanVleet (20) - duo carried Milwaukee's offense</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-card border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💪</span>
                <h3 className="font-bold text-purple-400">Paint Dominance</h3>
              </div>
              <div className="text-4xl font-black mb-2">60 PTS</div>
              <p className="text-sm text-muted-foreground">Spurs' paint points - couldn't overcome poor free-throw shooting (1-7 FT)</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game 1 */}
      <div className="container pb-12">
        <Card className="bg-card border-blue-500/30">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Game 1: Bucks 99, Spurs 95</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowGame1BoxScore(!showGame1BoxScore)}
              >
                {showGame1BoxScore ? "Hide" : "Show"} Box Score
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 mb-8 p-6 bg-gradient-to-r from-blue-900/20 to-gray-900/20 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Milwaukee</div>
                <div className="text-5xl font-black text-blue-500">99</div>
              </div>
              <div className="text-2xl text-muted-foreground">-</div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">San Antonio</div>
                <div className="text-5xl font-black">95</div>
              </div>
            </div>

            {showGame1BoxScore && (
              <div className="space-y-8 mb-8 p-6 bg-gray-900/30 rounded-lg">
                <BoxScoreTable players={game1BucksPlayers} teamName="Milwaukee Bucks" />
                <BoxScoreTable players={game1SpursPlayers} teamName="San Antonio Spurs" />
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <h4 className="text-xl font-bold mb-4">Game Summary</h4>
              <p className="text-lg leading-relaxed mb-4">
                R.J. Barrett scored 27 points and Fred VanVleet added 20 as the Bucks held off the Spurs 99-95 in a high-octane matchup that turned into a 3-point shootout.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                Milwaukee leaned on shot-making from the perimeter, hitting 13 threes and getting timely help across the rotation. Bam Adebayo supplied steady interior production with 12 points and 6 rebounds, while Keyonte George chipped in 12. Even with a rough night at the line (2-of-6), the Bucks made enough shots to survive.
              </p>
              <p className="text-lg leading-relaxed">
                San Antonio got a big-time punch from Harrison Barnes (28 points on 12-of-15 shooting) and Devin Booker (26 points, 7 assists), but the Spurs left points at the stripe (1-of-7 FT) and couldn't fully cash in on their edge in the paint (60 paint points). Marcus Smart provided energy with 13 points and 3 steals, yet Milwaukee's 3-point volume (34 attempts) and balanced scoring ultimately carried the finish.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Looking Ahead */}
      <div className="container pb-16">
        <Card className="bg-gradient-to-br from-blue-900/20 to-card border-blue-500/30">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Looking Ahead</h2>
            <p className="text-lg leading-relaxed">
              The Bucks hold a crucial 1-0 series lead heading into Game 2. R.J. Barrett's efficient scoring and Milwaukee's three-point barrage set the tone, but San Antonio showed they can compete with their paint dominance and elite shot-making from Barnes and Booker. The Spurs will need to clean up their free-throw shooting and find a way to slow down the Bucks' perimeter attack if they hope to even the series. Game 2 promises to be another high-scoring affair as both teams look to impose their will.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
