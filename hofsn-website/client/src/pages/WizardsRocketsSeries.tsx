import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, ChevronUp, Trophy, Target, Users, Eye } from "lucide-react";
import {
  seriesSummary,
  gameSummaries,
  gameRecaps,
  seriesLeaders,
  boxScores,
  seriesMVP,
  lookingAhead,
  type PlayerStats
} from "@shared/wizardsRocketsSeries";

export default function WizardsRocketsSeries() {
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [showBoxScore, setShowBoxScore] = useState<string | null>(null);

  const toggleGame = (game: string) => {
    setExpandedGame(expandedGame === game ? null : game);
  };

  const toggleBoxScore = (game: string) => {
    setShowBoxScore(showBoxScore === game ? null : game);
  };

  const getBoxScoreForGame = (game: string, team: string): PlayerStats[] => {
    const teamName = team === "Wizards" ? "Washington Wizards" : "Houston Rockets";
    return boxScores.filter(p => p.game === game && p.team === teamName && !p.dnp);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full">
          <img
            src="/wizards-rockets-series-highlight.png"
            alt="Wizards win series 3-1"
            className="w-full h-auto object-cover"
          />
        </div>
        
        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4">
          <Link href="/playoffs">
            <Button variant="outline" className="bg-black/50 border-white/30 text-white hover:bg-black/70">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Playoffs
            </Button>
          </Link>
        </div>
      </section>

      {/* Series Recap */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h2 className="text-3xl font-bold">Series Recap</h2>
        </div>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {seriesSummary.body}
        </p>
      </section>

      {/* Series MVP */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <Card className="bg-gradient-to-r from-yellow-900/20 to-yellow-600/20 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Series MVP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-yellow-500">{seriesMVP.player}</h3>
                <p className="text-muted-foreground">{seriesMVP.team}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{seriesMVP.ppg}</p>
                    <p className="text-sm text-muted-foreground">PPG</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{seriesMVP.totalPoints}</p>
                    <p className="text-sm text-muted-foreground">Total PTS</p>
                  </div>
                </div>
                <p className="mt-4 text-sm italic text-muted-foreground">{seriesMVP.highlights}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Series Leaders */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Target className="w-6 h-6" />
          Series Leaders
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Wizards Leaders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Washington Wizards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">SCORING</h4>
                {seriesLeaders.wizards.scoring.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span>{player.name}</span>
                    <span className="font-bold">{player.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">REBOUNDS</h4>
                {seriesLeaders.wizards.rebounds.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span>{player.name}</span>
                    <span className="font-bold">{player.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">ASSISTS</h4>
                {seriesLeaders.wizards.assists.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span>{player.name}</span>
                    <span className="font-bold">{player.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rockets Leaders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Houston Rockets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">SCORING</h4>
                {seriesLeaders.rockets.scoring.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span>{player.name}</span>
                    <span className="font-bold">{player.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">REBOUNDS</h4>
                {seriesLeaders.rockets.rebounds.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span>{player.name}</span>
                    <span className="font-bold">{player.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">ASSISTS</h4>
                {seriesLeaders.rockets.assists.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span>{player.name}</span>
                    <span className="font-bold">{player.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Game-by-Game Breakdown */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Users className="w-6 h-6" />
          Game-by-Game Breakdown
        </h2>
        <div className="space-y-4">
          {gameSummaries.map((game, index) => (
            <Card key={index} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGame(game.game)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">{game.game}</span>
                    <span className={`text-xl font-bold ${game.wizardsScore > game.rocketsScore ? 'text-red-500' : 'text-red-600'}`}>
                      {game.wizardsScore} - {game.rocketsScore}
                    </span>
                    {game.notes && game.notes.includes('OT') && <span className="text-yellow-500 text-sm font-semibold">OT</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{game.wizardsScore > game.rocketsScore ? 'Wizards win' : 'Rockets win'}</span>
                    {expandedGame === game.game ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>
              
              {expandedGame === game.game && (
                <CardContent className="border-t">
                  <p className="text-muted-foreground mb-4">
                    {gameRecaps.find(r => r.game === game.game)?.body || "No recap available."}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBoxScore(game.game);
                    }}
                    className="mb-4"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showBoxScore === game.game ? "Hide Box Score" : "View Box Score"}
                  </Button>
                  
                  {showBoxScore === game.game && (
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {/* Wizards Box Score */}
                      <div>
                        <h4 className="font-bold text-red-500 mb-2">Washington Wizards</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Player</th>
                                <th className="text-center py-2">PTS</th>
                                <th className="text-center py-2">REB</th>
                                <th className="text-center py-2">AST</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getBoxScoreForGame(game.game, "Wizards").map((player, i) => (
                                <tr key={i} className="border-b border-muted">
                                  <td className="py-1">{player.player}</td>
                                  <td className="text-center">{player.pts}</td>
                                  <td className="text-center">{player.reb}</td>
                                  <td className="text-center">{player.ast}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Rockets Box Score */}
                      <div>
                        <h4 className="font-bold text-red-600 mb-2">Houston Rockets</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Player</th>
                                <th className="text-center py-2">PTS</th>
                                <th className="text-center py-2">REB</th>
                                <th className="text-center py-2">AST</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getBoxScoreForGame(game.game, "Rockets").map((player, i) => (
                                <tr key={i} className="border-b border-muted">
                                  <td className="py-1">{player.player}</td>
                                  <td className="text-center">{player.pts}</td>
                                  <td className="text-center">{player.reb}</td>
                                  <td className="text-center">{player.ast}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Looking Ahead */}
      <section className="py-8 px-4 max-w-6xl mx-auto mb-8">
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-500" />
              Looking Ahead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {lookingAhead.body}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
