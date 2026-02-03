import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import {
  seriesSummary,
  lookingAhead,
  gameSummaries,
  gameRecaps,
  seriesLeaders,
  seriesMVP,
} from "@shared/wizardsRocketsSeries";

export default function WizardsRocketsSeries() {
  const [expandedGame, setExpandedGame] = useState<number | null>(null);

  const toggleGame = (index: number) => {
    setExpandedGame(expandedGame === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Highlight Card */}
      <section className="relative">
        <div className="w-full">
          <img
            src="/wizards-rockets-series-highlight.png"
            alt="Wizards win series 3-1"
            className="w-full h-auto object-cover"
          />
        </div>
        
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
        <div className="prose prose-invert max-w-none">
          {seriesSummary.body.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed text-muted-foreground mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Series Leaders */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Series Leaders</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Wizards Leaders */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-4 mb-6">
              <img src="/wizards-logo.png" alt="Washington Wizards" className="w-16 h-16 object-contain" />
              <h3 className="text-xl font-bold">Washington Wizards</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-yellow-500 uppercase tracking-wide mb-3">Scoring</h4>
                {seriesLeaders.wizards.scoring.map((player, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">{player.player}</span>
                    <span className="text-muted-foreground">{player.total} PTS ({player.avg} PPG)</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-yellow-500 uppercase tracking-wide mb-3">Rebounds</h4>
                {seriesLeaders.wizards.rebounds.map((player, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">{player.player}</span>
                    <span className="text-muted-foreground">{player.total} REB ({player.avg} RPG)</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-yellow-500 uppercase tracking-wide mb-3">Assists</h4>
                {seriesLeaders.wizards.assists.map((player, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">{player.player}</span>
                    <span className="text-muted-foreground">{player.total} AST ({player.avg} APG)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rockets Leaders */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-4 mb-6">
              <img src="/rockets-logo.png" alt="Houston Rockets" className="w-16 h-16 object-contain" />
              <h3 className="text-xl font-bold">Houston Rockets</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">Scoring</h4>
                {seriesLeaders.rockets.scoring.map((player, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">{player.player}</span>
                    <span className="text-muted-foreground">{player.total} PTS ({player.avg} PPG)</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">Rebounds</h4>
                {seriesLeaders.rockets.rebounds.map((player, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">{player.player}</span>
                    <span className="text-muted-foreground">{player.total} REB ({player.avg} RPG)</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">Assists</h4>
                {seriesLeaders.rockets.assists.map((player, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">{player.player}</span>
                    <span className="text-muted-foreground">{player.total} AST ({player.avg} APG)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game-by-Game Breakdown */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Game-by-Game Breakdown</h2>
        <div className="space-y-4">
          {gameSummaries.map((game, index) => {
            const recap = gameRecaps.find(r => r.game === game.game);
            const wizardsWon = game.wizardsScore > game.rocketsScore;
            
            return (
              <div key={index} className="bg-card rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => toggleGame(index)}
                  className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">{game.game}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${wizardsWon ? 'text-green-500' : 'text-muted-foreground'}`}>
                        WAS {game.wizardsScore}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className={`font-bold ${!wizardsWon ? 'text-green-500' : 'text-muted-foreground'}`}>
                        HOU {game.rocketsScore}
                      </span>
                    </div>
                    {game.notes && (
                      <span className="text-sm text-yellow-500 italic">{game.notes}</span>
                    )}
                  </div>
                  {expandedGame === index ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                
                {expandedGame === index && recap && (
                  <div className="p-4 border-t border-border bg-background/50">
                    <h4 className="font-bold mb-3">{recap.title}</h4>
                    <div className="prose prose-invert max-w-none">
                      {recap.body.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-muted-foreground mb-3">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    {/* Game Stats */}
                    <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-lg">{game.wizardsFG}</div>
                        <div className="text-muted-foreground">WAS FG</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{game.wizards3PT}</div>
                        <div className="text-muted-foreground">WAS 3PT</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{game.wizardsFastBreak}</div>
                        <div className="text-muted-foreground">WAS Fast Break</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{game.rocketsFG}</div>
                        <div className="text-muted-foreground">HOU FG</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{game.rockets3PT}</div>
                        <div className="text-muted-foreground">HOU 3PT</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{game.rocketsFastBreak}</div>
                        <div className="text-muted-foreground">HOU Fast Break</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Series MVP */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-600/30 rounded-lg p-8 border border-yellow-500/50">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h2 className="text-3xl font-bold text-yellow-500">Series MVP</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-4xl font-bold mb-2">{seriesMVP.player}</h3>
              <p className="text-xl text-muted-foreground mb-4">{seriesMVP.team}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-background/50 rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-yellow-500">{seriesMVP.totalPoints}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>
                <div className="bg-background/50 rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-yellow-500">{seriesMVP.ppg}</div>
                  <div className="text-sm text-muted-foreground">PPG</div>
                </div>
              </div>
              <p className="mt-4 text-lg italic text-muted-foreground">
                Game-by-game: {seriesMVP.gameScores.join(' - ')}
              </p>
              <p className="mt-2 text-muted-foreground">{seriesMVP.highlights}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Looking Ahead */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">{lookingAhead.title}</h2>
        <div className="prose prose-invert max-w-none">
          {lookingAhead.body.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed text-muted-foreground mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Footer */}
      <section className="py-8 px-4 max-w-6xl mx-auto text-center">
        <img src="/hofsn-logo.png" alt="HOFSN" className="h-12 mx-auto opacity-50" />
      </section>
    </div>
  );
}
