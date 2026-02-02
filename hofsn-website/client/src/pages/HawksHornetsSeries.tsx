import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

// Game 1: Hawks 89, Hornets 71
const game1HawksPlayers = [
  { name: "J. Johnson", min: 18, pts: 21, reb: 4, ast: 2, stl: 0, blk: 0, to: 1, fgm: 10, fga: 15 },
  { name: "A. Sengun", min: 18, pts: 21, reb: 3, ast: 0, stl: 1, blk: 0, to: 4, fgm: 10, fga: 17 },
  { name: "D. Daniels", min: 22, pts: 18, reb: 5, ast: 4, stl: 0, blk: 0, to: 0, fgm: 7, fga: 8 },
  { name: "N. Alexander-Walker", min: 17, pts: 9, reb: 2, ast: 3, stl: 1, blk: 1, to: 0, fgm: 3, fga: 3 },
  { name: "C.J. McCollum", min: 14, pts: 8, reb: 1, ast: 1, stl: 1, blk: 0, to: 2, fgm: 3, fga: 6 },
  { name: "J. Jaquez Jr.", min: 7, pts: 5, reb: 3, ast: 0, stl: 0, blk: 0, to: 0, fgm: 2, fga: 3 },
  { name: "I. Stewart", min: 18, pts: 3, reb: 7, ast: 0, stl: 0, blk: 1, to: 0, fgm: 1, fga: 1 },
  { name: "I. Collier", min: 10, pts: 2, reb: 0, ast: 2, stl: 0, blk: 0, to: 0, fgm: 1, fga: 4 },
  { name: "M. Plumlee", min: 9, pts: 2, reb: 2, ast: 1, stl: 0, blk: 0, to: 2, fgm: 1, fga: 1 },
  { name: "Z. Risacher", min: 14, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 1 },
  { name: "M. Gueye", min: 12, pts: 0, reb: 5, ast: 0, stl: 0, blk: 0, to: 0, fgm: 0, fga: 0 },
];

const game1HornetsPlayers = [
  { name: "L. Ball", min: 22, pts: 23, reb: 3, ast: 5, stl: 2, blk: 0, to: 1, fgm: 8, fga: 14 },
  { name: "A. Reaves", min: 17, pts: 12, reb: 1, ast: 0, stl: 0, blk: 0, to: 2, fgm: 5, fga: 16 },
  { name: "P. Siakam", min: 20, pts: 11, reb: 3, ast: 1, stl: 1, blk: 0, to: 1, fgm: 5, fga: 8 },
  { name: "M. Bridges", min: 22, pts: 8, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 3, fga: 4 },
  { name: "B. Beal", min: 12, pts: 7, reb: 2, ast: 1, stl: 1, blk: 0, to: 0, fgm: 3, fga: 9 },
  { name: "R. O'Neale", min: 11, pts: 6, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 2, fga: 3 },
  { name: "C. Carrington", min: 11, pts: 2, reb: 1, ast: 0, stl: 1, blk: 0, to: 0, fgm: 1, fga: 5 },
  { name: "S. James", min: 11, pts: 2, reb: 1, ast: 2, stl: 0, blk: 0, to: 1, fgm: 1, fga: 1 },
  { name: "R. Williams III", min: 17, pts: 0, reb: 5, ast: 2, stl: 0, blk: 2, to: 0, fgm: 0, fga: 0 },
  { name: "Q. Post", min: 9, pts: 0, reb: 3, ast: 2, stl: 1, blk: 0, to: 1, fgm: 0, fga: 1 },
];

// Game 2: Hawks 73, Hornets 64
const game2HawksPlayers = [
  { name: "J. Johnson", min: 19, pts: 23, reb: 6, ast: 3, stl: 0, blk: 0, to: 3, fgm: 11, fga: 20 },
  { name: "N. Alexander-Walker", min: 22, pts: 12, reb: 3, ast: 1, stl: 0, blk: 0, to: 0, fgm: 5, fga: 7 },
  { name: "A. Sengun", min: 19, pts: 12, reb: 6, ast: 0, stl: 1, blk: 0, to: 0, fgm: 6, fga: 14 },
  { name: "C.J. McCollum", min: 13, pts: 7, reb: 0, ast: 3, stl: 0, blk: 0, to: 1, fgm: 3, fga: 4 },
  { name: "M. Gueye", min: 10, pts: 6, reb: 3, ast: 0, stl: 0, blk: 1, to: 0, fgm: 3, fga: 4 },
  { name: "D. Daniels", min: 20, pts: 5, reb: 7, ast: 4, stl: 1, blk: 0, to: 2, fgm: 2, fga: 6 },
  { name: "I. Stewart", min: 19, pts: 3, reb: 7, ast: 1, stl: 1, blk: 0, to: 0, fgm: 1, fga: 3 },
  { name: "Z. Risacher", min: 13, pts: 3, reb: 3, ast: 0, stl: 1, blk: 0, to: 0, fgm: 1, fga: 3 },
  { name: "M. Plumlee", min: 8, pts: 2, reb: 1, ast: 0, stl: 0, blk: 0, to: 1, fgm: 1, fga: 1 },
  { name: "I. Collier", min: 9, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 1, fgm: 0, fga: 1 },
  { name: "J. Jaquez Jr.", min: 8, pts: 0, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, fgm: 0, fga: 2 },
];

const game2HornetsPlayers = [
  { name: "L. Ball", min: 22, pts: 21, reb: 5, ast: 6, stl: 1, blk: 0, to: 1, fgm: 10, fga: 18 },
  { name: "P. Siakam", min: 21, pts: 9, reb: 6, ast: 2, stl: 2, blk: 0, to: 0, fgm: 4, fga: 9 },
  { name: "A. Reaves", min: 22, pts: 8, reb: 1, ast: 4, stl: 0, blk: 0, to: 1, fgm: 3, fga: 9 },
  { name: "M. Bridges", min: 21, pts: 5, reb: 5, ast: 2, stl: 3, blk: 0, to: 1, fgm: 2, fga: 7 },
  { name: "R. Williams III", min: 13, pts: 4, reb: 3, ast: 2, stl: 0, blk: 0, to: 1, fgm: 2, fga: 2 },
  { name: "S. James", min: 13, pts: 4, reb: 1, ast: 0, stl: 0, blk: 0, to: 2, fgm: 2, fga: 2 },
  { name: "J. Sims", min: 5, pts: 4, reb: 0, ast: 1, stl: 0, blk: 0, to: 0, fgm: 2, fga: 2 },
  { name: "B. Beal", min: 7, pts: 3, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 7 },
  { name: "C. Carrington", min: 10, pts: 2, reb: 1, ast: 1, stl: 0, blk: 0, to: 0, fgm: 1, fga: 6 },
  { name: "R. O'Neale", min: 14, pts: 2, reb: 3, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 2 },
  { name: "Q. Post", min: 5, pts: 2, reb: 2, ast: 0, stl: 0, blk: 0, to: 0, fgm: 1, fga: 1 },
];

export default function HawksHornetsSeries() {
  const [showGame1BoxScore, setShowGame1BoxScore] = useState(false);
  const [showGame2BoxScore, setShowGame2BoxScore] = useState(false);

  const BoxScoreTable = ({ players, teamName }: { players: typeof game1HawksPlayers, teamName: string }) => (
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
                Hawks <span className="text-red-500">Advance</span> 2-0
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Atlanta sweeps Charlotte behind Jalen Johnson's dominant two-game performance
              </p>
            </div>
            
            <Card className="bg-card/50 border-2 border-red-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-muted-foreground mb-1">SERIES RESULT</div>
                <div className="text-5xl font-black text-red-500 mb-1">2-0</div>
                <div className="text-sm font-medium">Hawks Advance</div>
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
                The Atlanta Hawks delivered a statement sweep of the Charlotte Hornets, advancing to the second round with back-to-back victories built on defensive intensity and rebounding control. Jalen Johnson emerged as the series' undisputed star, combining for 44 points and 10 rebounds across two games while anchoring Atlanta's physical, grind-it-out approach.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                Game 1 saw the Hawks establish dominance early with efficient shooting and balanced scoring. Johnson and Alperen Şengün each dropped 21 points, while Dyson Daniels added 18 points and 4 assists as Atlanta buried Charlotte 89-71. The Hornets struggled to find offensive rhythm despite LaMelo Ball's 23-point effort, unable to overcome the Hawks' defensive pressure.
              </p>
              <p className="text-lg leading-relaxed">
                Game 2 became a defensive slugfest, with Atlanta grinding out a 73-64 victory to close the series. Johnson was the stabilizer again with 23 points and 6 rebounds, while Nickeil Alexander-Walker and Şengün added 12 apiece. Charlotte got another strong performance from Ball (21 points, 5 rebounds, 6 assists), but the Hornets couldn't generate consistent half-court offense when the pace slowed. Atlanta's defense and rebounding control held up late, securing the sweep and a ticket to the second round.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Series MVP */}
      <div className="container pb-12">
        <Card className="bg-gradient-to-br from-gold-900/20 to-card border-gold-500/30">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🏅</span>
              <h2 className="text-3xl font-black">Series MVP: Jalen Johnson</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">⚡</span>
                <p className="text-lg"><span className="font-bold">44 total points</span> on 21-35 shooting (60% FG) across two games</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">⚡</span>
                <p className="text-lg"><span className="font-bold">10 rebounds</span> - controlled the glass and provided second-chance opportunities</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">⚡</span>
                <p className="text-lg"><span className="font-bold">Defensive anchor</span> - physical presence disrupted Charlotte's offensive flow</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">⚡</span>
                <p className="text-lg"><span className="font-bold">Şengün's support</span> - 33 points combined, elite two-way play alongside Johnson</p>
              </div>
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
                <h3 className="font-bold text-orange-400">Dominant Duo</h3>
              </div>
              <div className="text-4xl font-black mb-2">44 PTS</div>
              <p className="text-sm text-muted-foreground">Jalen Johnson's series total (21 + 23) - carried Atlanta's offense in both games</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-card border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-blue-400">Defensive Intensity</h3>
              </div>
              <div className="text-4xl font-black mb-2">67.5 PPG</div>
              <p className="text-sm text-muted-foreground">Hornets' scoring average - Hawks' defense held Charlotte to just 135 total points</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-card border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💪</span>
                <h3 className="font-bold text-purple-400">Rebounding Control</h3>
              </div>
              <div className="text-4xl font-black mb-2">+8</div>
              <p className="text-sm text-muted-foreground">Hawks' rebounding margin - dominated the glass in both games</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game 1 */}
      <div className="container pb-12">
        <Card className="bg-card border-red-500/30">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Game 1: Hawks 89, Hornets 71</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowGame1BoxScore(!showGame1BoxScore)}
              >
                {showGame1BoxScore ? "Hide" : "Show"} Box Score
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 mb-8 p-6 bg-gradient-to-r from-red-900/20 to-gray-900/20 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Atlanta</div>
                <div className="text-5xl font-black text-red-500">89</div>
              </div>
              <div className="text-2xl text-muted-foreground">-</div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Charlotte</div>
                <div className="text-5xl font-black">71</div>
              </div>
            </div>

            {showGame1BoxScore && (
              <div className="space-y-8 mb-8 p-6 bg-gray-900/30 rounded-lg">
                <BoxScoreTable players={game1HawksPlayers} teamName="Atlanta Hawks" />
                <BoxScoreTable players={game1HornetsPlayers} teamName="Charlotte Hornets" />
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <h4 className="text-xl font-bold mb-4">Game Summary</h4>
              <p className="text-lg leading-relaxed mb-4">
                The Hawks buried Charlotte early with efficient shooting and never let the Hornets find rhythm. Jalen Johnson and Alperen Şengün each scored 21 points, while Dyson Daniels added 18 points and 4 assists as Atlanta cruised to an 18-point victory.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                Atlanta's balanced attack and defensive pressure overwhelmed Charlotte from the opening tip. The Hawks shot efficiently from the field and controlled the glass, limiting the Hornets' second-chance opportunities. Isaiah Stewart provided interior defense with 7 rebounds and a block, while the Hawks' perimeter defenders harassed Charlotte's ball-handlers all night.
              </p>
              <p className="text-lg leading-relaxed">
                LaMelo Ball led Charlotte with 23 points, 5 assists, and 2 steals, but the Hornets struggled to find secondary scoring. Austin Reaves added 12 points but shot just 5-of-16 from the field, while Pascal Siakam contributed 11 points. The Hornets' inability to generate consistent offense against Atlanta's defensive intensity put them in a 1-0 hole heading into Game 2.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game 2 */}
      <div className="container pb-12">
        <Card className="bg-card border-red-500/30">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Game 2: Hawks 73, Hornets 64</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowGame2BoxScore(!showGame2BoxScore)}
              >
                {showGame2BoxScore ? "Hide" : "Show"} Box Score
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 mb-8 p-6 bg-gradient-to-r from-red-900/20 to-gray-900/20 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Atlanta</div>
                <div className="text-5xl font-black text-red-500">73</div>
              </div>
              <div className="text-2xl text-muted-foreground">-</div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Charlotte</div>
                <div className="text-5xl font-black">64</div>
              </div>
            </div>

            {showGame2BoxScore && (
              <div className="space-y-8 mb-8 p-6 bg-gray-900/30 rounded-lg">
                <BoxScoreTable players={game2HawksPlayers} teamName="Atlanta Hawks" />
                <BoxScoreTable players={game2HornetsPlayers} teamName="Charlotte Hornets" />
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <h4 className="text-xl font-bold mb-4">Game Summary</h4>
              <p className="text-lg leading-relaxed mb-4">
                The Hawks closed the door in Game 2, grinding out a 73-64 win over the Hornets to take the best-of-3 first-round series 2-0. Jalen Johnson was the stabilizer again, finishing with 23 points and 6 rebounds, while Nickeil Alexander-Walker and Alperen Şengün added 12 apiece as Atlanta survived a choppy, defensive second half.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                Atlanta did not live at the line, but it made enough shots and won the possession game to keep Charlotte from making a late push. The Hawks' defense clamped down in the second half, holding the Hornets to just 64 total points and forcing difficult shots throughout. Isaiah Stewart and Dyson Daniels combined for 12 rebounds and provided crucial defensive stops when Charlotte threatened to make it close.
              </p>
              <p className="text-lg leading-relaxed">
                Charlotte got a strong all-around line from LaMelo Ball (21 points, 5 rebounds, 6 assists), with secondary contributions from Pascal Siakam (9 points, 6 rebounds, 2 steals) and Austin Reaves (8 points, 4 assists), but the Hornets could not generate consistent half-court offense when the pace slowed. Miles Bridges added 5 points and 3 steals, but Charlotte's shooting woes (particularly from three-point range) doomed their comeback hopes. The Hawks' rebounding control and defensive intensity proved too much, securing the sweep and sending Atlanta to the second round.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Looking Ahead */}
      <div className="container pb-16">
        <Card className="bg-gradient-to-br from-red-900/20 to-card border-red-500/30">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Looking Ahead</h2>
            <p className="text-lg leading-relaxed">
              The Hawks advance to the second round where they'll face a formidable opponent. Jalen Johnson has established himself as Atlanta's go-to scorer with his dominant two-game performance (44 points, 10 rebounds), and the Hawks will need more of the same as the competition intensifies. The supporting cast of Alperen Şengün, Dyson Daniels, and Nickeil Alexander-Walker will be crucial in maintaining the defensive intensity and rebounding control that carried Atlanta through the first round. With their physical, grind-it-out style now proven in the playoffs, the Hawks are a dangerous team heading into the next round.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
