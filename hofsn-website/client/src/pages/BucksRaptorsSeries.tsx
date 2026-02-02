import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, ChevronUp, Trophy, Target, Users } from "lucide-react";
import {
  seriesSummary,
  gameSummaries,
  gameRecaps,
  seriesLeaders,
  boxScores,
  type PlayerStats
} from "@shared/bucksRaptorsSeries";

export default function BucksRaptorsSeries() {
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [showBoxScore, setShowBoxScore] = useState<string | null>(null);

  const toggleGame = (game: string) => {
    setExpandedGame(expandedGame === game ? null : game);
  };

  const toggleBoxScore = (game: string) => {
    setShowBoxScore(showBoxScore === game ? null : game);
  };

  const getBoxScoreForGame = (game: string, team: string): PlayerStats[] => {
    return boxScores.filter(p => p.game === game && p.team === team && !p.dnp);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full">
          <img
            src="/bucks-raptors-series-highlight.png"
            alt="Bucks sweep Raptors 3-0"
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

      {/* Series Summary */}
      <section className="container py-8">
        <Card className="bg-gradient-to-br from-green-900/30 to-red-900/30 border-gold-500/30">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-gold-400 flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              Series Recap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {seriesSummary.body}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Series Leaders */}
      <section className="container py-8">
        <h2 className="text-2xl font-bold text-gold-400 mb-6 flex items-center gap-3">
          <Target className="w-6 h-6" />
          Series Leaders
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bucks Leaders */}
          <Card className="bg-green-900/20 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-green-400 flex items-center gap-2">
                <img src="/logos/bucks.png" alt="Bucks" className="w-8 h-8" />
                Milwaukee Bucks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400 mb-2">SCORING</h4>
                {seriesLeaders.bucks.scoring.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-green-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-green-400">{player.total} PTS ({player.avg} PPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">REBOUNDS</h4>
                {seriesLeaders.bucks.rebounds.slice(0, 2).map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-green-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-green-400">{player.total} REB ({player.avg} RPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">ASSISTS</h4>
                {seriesLeaders.bucks.assists.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-green-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-green-400">{player.total} AST ({player.avg} APG)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Raptors Leaders */}
          <Card className="bg-red-900/20 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-red-400 flex items-center gap-2">
                <img src="/logos/raptors.png" alt="Raptors" className="w-8 h-8" />
                Toronto Raptors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400 mb-2">SCORING</h4>
                {seriesLeaders.raptors.scoring.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-red-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-red-400">{player.total} PTS ({player.avg} PPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">REBOUNDS</h4>
                {seriesLeaders.raptors.rebounds.slice(0, 2).map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-red-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-red-400">{player.total} REB ({player.avg} RPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">ASSISTS</h4>
                {seriesLeaders.raptors.assists.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-red-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-red-400">{player.total} AST ({player.avg} APG)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Game-by-Game Breakdown */}
      <section className="container py-8">
        <h2 className="text-2xl font-bold text-gold-400 mb-6 flex items-center gap-3">
          <Users className="w-6 h-6" />
          Game-by-Game Breakdown
        </h2>

        <div className="space-y-4">
          {gameSummaries.map((game, index) => {
            const recap = gameRecaps[index];
            const isExpanded = expandedGame === game.game;
            const showingBoxScore = showBoxScore === game.game;
            
            return (
              <Card key={game.game} className="bg-card border-border overflow-hidden">
                {/* Game Header - Always Visible */}
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGame(game.game)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-gold-400">{game.game}</div>
                      <div className="flex items-center gap-2">
                        <img src="/logos/bucks.png" alt="Bucks" className="w-6 h-6" />
                        <span className="text-xl font-bold text-green-400">{game.bucksScore}</span>
                        <span className="text-gray-500">-</span>
                        <span className="text-xl font-bold text-red-400">{game.raptorsScore}</span>
                        <img src="/logos/raptors.png" alt="Raptors" className="w-6 h-6" />
                      </div>
                      {game.notes && (
                        <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-1 rounded">
                          {game.notes}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Game Recap */}
                    <div className="p-4 bg-muted/30">
                      <h4 className="text-sm font-semibold text-gold-400 mb-2">{recap.title}</h4>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                        {recap.body}
                      </p>
                    </div>

                    {/* Team Stats Comparison */}
                    <div className="p-4 grid grid-cols-3 gap-4 text-center text-sm">
                      <div className="text-green-400 font-semibold">Bucks</div>
                      <div className="text-gray-400">Stat</div>
                      <div className="text-red-400 font-semibold">Raptors</div>
                      
                      <div className="text-white">{game.bucksFG}</div>
                      <div className="text-gray-500">FG</div>
                      <div className="text-white">{game.raptorsFG}</div>
                      
                      <div className="text-white">{game.bucks3PT}</div>
                      <div className="text-gray-500">3PT</div>
                      <div className="text-white">{game.raptors3PT}</div>
                      
                      <div className="text-white">{game.bucksFT}</div>
                      <div className="text-gray-500">FT</div>
                      <div className="text-white">{game.raptorsFT}</div>
                      
                      <div className="text-white">{game.bucksPaint}</div>
                      <div className="text-gray-500">Paint</div>
                      <div className="text-white">{game.raptorsPaint}</div>
                      
                      <div className="text-white">{game.bucks2ndChance}</div>
                      <div className="text-gray-500">2nd Chance</div>
                      <div className="text-white">{game.raptors2ndChance}</div>
                      
                      <div className="text-white">{game.bucksBench}</div>
                      <div className="text-gray-500">Bench</div>
                      <div className="text-white">{game.raptorsBench}</div>
                      
                      <div className="text-white">{game.bucksOR}</div>
                      <div className="text-gray-500">Off Reb</div>
                      <div className="text-white">{game.raptorsOR}</div>
                      
                      <div className="text-white">{game.bucksTO}</div>
                      <div className="text-gray-500">Turnovers</div>
                      <div className="text-white">{game.raptorsTO}</div>
                    </div>

                    {/* Box Score Toggle */}
                    <div className="p-4 border-t border-border">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBoxScore(game.game);
                        }}
                        className="w-full"
                      >
                        {showingBoxScore ? "Hide Box Score" : "Show Full Box Score"}
                      </Button>
                    </div>

                    {/* Box Score Tables */}
                    {showingBoxScore && (
                      <div className="p-4 space-y-6 bg-muted/20">
                        {/* Bucks Box Score */}
                        <div>
                          <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                            <img src="/logos/bucks.png" alt="Bucks" className="w-5 h-5" />
                            Milwaukee Bucks
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400 border-b border-border">
                                  <th className="text-left py-2 px-1">Player</th>
                                  <th className="text-center py-2 px-1">MIN</th>
                                  <th className="text-center py-2 px-1">PTS</th>
                                  <th className="text-center py-2 px-1">REB</th>
                                  <th className="text-center py-2 px-1">AST</th>
                                  <th className="text-center py-2 px-1">STL</th>
                                  <th className="text-center py-2 px-1">BLK</th>
                                  <th className="text-center py-2 px-1">FG</th>
                                  <th className="text-center py-2 px-1">3PT</th>
                                  <th className="text-center py-2 px-1">FT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getBoxScoreForGame(game.game, "Milwaukee Bucks").map((player, i) => (
                                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-2 px-1 text-white font-medium">{player.player}</td>
                                    <td className="text-center py-2 px-1 text-gray-400">{player.min}</td>
                                    <td className="text-center py-2 px-1 text-green-400 font-semibold">{player.pts}</td>
                                    <td className="text-center py-2 px-1">{player.reb}</td>
                                    <td className="text-center py-2 px-1">{player.ast}</td>
                                    <td className="text-center py-2 px-1">{player.stl}</td>
                                    <td className="text-center py-2 px-1">{player.blk}</td>
                                    <td className="text-center py-2 px-1">{player.fgm}-{player.fga}</td>
                                    <td className="text-center py-2 px-1">{player.threePM}-{player.threePA}</td>
                                    <td className="text-center py-2 px-1">{player.ftm}-{player.fta}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Raptors Box Score */}
                        <div>
                          <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                            <img src="/logos/raptors.png" alt="Raptors" className="w-5 h-5" />
                            Toronto Raptors
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400 border-b border-border">
                                  <th className="text-left py-2 px-1">Player</th>
                                  <th className="text-center py-2 px-1">MIN</th>
                                  <th className="text-center py-2 px-1">PTS</th>
                                  <th className="text-center py-2 px-1">REB</th>
                                  <th className="text-center py-2 px-1">AST</th>
                                  <th className="text-center py-2 px-1">STL</th>
                                  <th className="text-center py-2 px-1">BLK</th>
                                  <th className="text-center py-2 px-1">FG</th>
                                  <th className="text-center py-2 px-1">3PT</th>
                                  <th className="text-center py-2 px-1">FT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getBoxScoreForGame(game.game, "Toronto Raptors").map((player, i) => (
                                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-2 px-1 text-white font-medium">{player.player}</td>
                                    <td className="text-center py-2 px-1 text-gray-400">{player.min}</td>
                                    <td className="text-center py-2 px-1 text-red-400 font-semibold">{player.pts}</td>
                                    <td className="text-center py-2 px-1">{player.reb}</td>
                                    <td className="text-center py-2 px-1">{player.ast}</td>
                                    <td className="text-center py-2 px-1">{player.stl}</td>
                                    <td className="text-center py-2 px-1">{player.blk}</td>
                                    <td className="text-center py-2 px-1">{player.fgm}-{player.fga}</td>
                                    <td className="text-center py-2 px-1">{player.threePM}-{player.threePA}</td>
                                    <td className="text-center py-2 px-1">{player.ftm}-{player.fta}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            © 2024 Hall of Fame Basketball Association. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            HoFSN - Your source for NBA 2K26 league coverage
          </p>
        </div>
      </footer>
    </div>
  );
}
