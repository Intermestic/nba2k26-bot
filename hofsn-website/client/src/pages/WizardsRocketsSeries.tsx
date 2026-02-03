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
    return boxScores.filter(p => p.game === game && p.team === team && !p.dnp);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full">
          <img
            src="/wizards-rockets-series-highlight.png"
            alt="Wizards lead Rockets 3-1"
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
        <Card className="bg-gradient-to-br from-blue-900/30 to-red-900/30 border-gold-500/30">
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

      {/* Series MVP */}
      <section className="container py-4">
        <Card className="bg-gradient-to-r from-gold-900/30 to-gold-700/20 border-gold-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gold-400 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Series MVP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{seriesMVP.player}</h3>
                <p className="text-gray-400">{seriesMVP.team}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold-400">{seriesMVP.totalPoints}</div>
                  <div className="text-xs text-gray-400">Total PTS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold-400">{seriesMVP.ppg}</div>
                  <div className="text-xs text-gray-400">PPG</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gold-400">{seriesMVP.gameScores.join("-")}</div>
                  <div className="text-xs text-gray-400">Scoring Line</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-3">{seriesMVP.highlights}</p>
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
          {/* Wizards Leaders */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-blue-400 flex items-center gap-2">
                <img src="/logos/wizards.png" alt="Wizards" className="w-8 h-8" />
                Washington Wizards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400 mb-2">SCORING</h4>
                {seriesLeaders.wizards.scoring.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-blue-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-blue-400">{player.total} PTS ({player.avg} PPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">REBOUNDS</h4>
                {seriesLeaders.wizards.rebounds.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-blue-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-blue-400">{player.total} REB ({player.avg} RPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">ASSISTS</h4>
                {seriesLeaders.wizards.assists.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-blue-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-blue-400">{player.total} AST ({player.avg} APG)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rockets Leaders */}
          <Card className="bg-red-900/20 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-red-400 flex items-center gap-2">
                <img src="/logos/rockets.png" alt="Rockets" className="w-8 h-8" />
                Houston Rockets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400 mb-2">SCORING</h4>
                {seriesLeaders.rockets.scoring.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-red-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-red-400">{player.total} PTS ({player.avg} PPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">REBOUNDS</h4>
                {seriesLeaders.rockets.rebounds.map((player, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-red-500/20">
                    <span className="text-white font-medium">{player.player}</span>
                    <span className="text-red-400">{player.total} REB ({player.avg} RPG)</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">ASSISTS</h4>
                {seriesLeaders.rockets.assists.map((player, i) => (
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
                        <img src="/logos/wizards.png" alt="Wizards" className="w-6 h-6" />
                        <span className="text-xl font-bold text-blue-400">{game.wizardsScore}</span>
                        <span className="text-gray-500">-</span>
                        <span className="text-xl font-bold text-red-400">{game.rocketsScore}</span>
                        <img src="/logos/rockets.png" alt="Rockets" className="w-6 h-6" />
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
                      <div className="text-blue-400 font-semibold">Wizards</div>
                      <div className="text-gray-400">Stat</div>
                      <div className="text-red-400 font-semibold">Rockets</div>
                      
                      <div className="text-white">{game.wizardsFG}</div>
                      <div className="text-gray-500">FG</div>
                      <div className="text-white">{game.rocketsFG}</div>
                      
                      <div className="text-white">{game.wizards3PT}</div>
                      <div className="text-gray-500">3PT</div>
                      <div className="text-white">{game.rockets3PT}</div>
                      
                      <div className="text-white">{game.wizardsFT}</div>
                      <div className="text-gray-500">FT</div>
                      <div className="text-white">{game.rocketsFT}</div>
                      
                      <div className="text-white">{game.wizardsPaint}</div>
                      <div className="text-gray-500">Paint</div>
                      <div className="text-white">{game.rocketsPaint}</div>
                      
                      <div className="text-white">{game.wizards2ndChance}</div>
                      <div className="text-gray-500">2nd Chance</div>
                      <div className="text-white">{game.rockets2ndChance}</div>
                      
                      <div className="text-white">{game.wizardsBench}</div>
                      <div className="text-gray-500">Bench</div>
                      <div className="text-white">{game.rocketsBench}</div>
                      
                      <div className="text-white">{game.wizardsFastBreak}</div>
                      <div className="text-gray-500">Fast Break</div>
                      <div className="text-white">{game.rocketsFastBreak}</div>
                      
                      <div className="text-white">{game.wizardsOR}</div>
                      <div className="text-gray-500">Off Reb</div>
                      <div className="text-white">{game.rocketsOR}</div>
                      
                      <div className="text-white">{game.wizardsTO}</div>
                      <div className="text-gray-500">Turnovers</div>
                      <div className="text-white">{game.rocketsTO}</div>
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
                        {/* Wizards Box Score */}
                        <div>
                          <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                            <img src="/logos/wizards.png" alt="Wizards" className="w-5 h-5" />
                            Washington Wizards
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
                                {getBoxScoreForGame(game.game, "Washington Wizards").map((player, i) => (
                                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-2 px-1 text-white font-medium">{player.player}</td>
                                    <td className="text-center py-2 px-1 text-gray-400">{player.min}</td>
                                    <td className="text-center py-2 px-1 text-blue-400 font-semibold">{player.pts}</td>
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

                        {/* Rockets Box Score */}
                        <div>
                          <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                            <img src="/logos/rockets.png" alt="Rockets" className="w-5 h-5" />
                            Houston Rockets
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
                                {getBoxScoreForGame(game.game, "Houston Rockets").map((player, i) => (
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

      {/* Looking Ahead */}
      <section className="container py-8">
        <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-purple-400 flex items-center gap-3">
              <Eye className="w-8 h-8" />
              {lookingAhead.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {lookingAhead.body}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
