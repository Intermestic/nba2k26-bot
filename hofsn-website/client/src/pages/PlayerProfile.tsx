import { useParams, useLocation } from "wouter";
import { getPlayerBySlug, playerNameToSlug } from "@shared/playerProfiles";
import { getPlayerHeadshot, getTeamLogo } from "@/lib/playerImages";
import { allAwardWinners, type PlayerAwardHistory } from "@/data/comprehensiveTrophyCase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlayerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  
  const player = slug ? getPlayerBySlug(slug) : undefined;

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Player Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The player profile you're looking for doesn't exist.
            </p>
            <Button onClick={() => setLocation("/season17-wrapup")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Season 17 Wrap-Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSeasonStats = player.careerStats[player.careerStats.length - 1];
  const playerHeadshot = getPlayerHeadshot(player.name);
  const teamLogo = getTeamLogo(player.team);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex gap-4 mb-2">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/season17-wrapup")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Season 17 Wrap-Up
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
            >
              🏠 Home
            </Button>
          </div>
        </div>
      </div>

      {/* Player Hero Section */}
      <div className="bg-gradient-to-b from-gold-900/20 to-background border-b border-gold-500/20">
        <div className="container py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Player Image */}
            <div className="relative">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gold-500 shadow-2xl bg-card">
                <img
                  src={playerHeadshot}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              {/* Team Logo Badge */}
              {teamLogo && (
                <div className="absolute bottom-0 right-0 w-16 h-16 rounded-full bg-card border-4 border-gold-500 shadow-lg overflow-hidden">
                  <img
                    src={teamLogo}
                    alt={player.team}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-black mb-2 text-foreground">{player.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <Badge variant="default" className="text-lg px-4 py-1">
                  {player.team}
                </Badge>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {player.position}
                </Badge>
              </div>
              
              {/* Physical Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-muted-foreground mb-6">
                <div>
                  <span className="font-semibold text-foreground">{player.height}</span>
                  <span className="text-sm ml-1">Height</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">{player.weight}</span>
                  <span className="text-sm ml-1">Weight</span>
                </div>
                {player.age && (
                  <div>
                    <span className="font-semibold text-foreground">{player.age}</span>
                    <span className="text-sm ml-1">Years Old</span>
                  </div>
                )}
              </div>

              {/* Awards History with Trophy Images */}
              {(() => {
                const playerAwards = allAwardWinners[player.name];
                if (!playerAwards) return null;
                
                // Build array of all awards from comprehensive trophy case
                const allAwards: Array<{type: string, season: number, image: string}> = [];
                
                // Add MVP awards
                playerAwards.mvpSeasons.forEach(season => {
                  allAwards.push({ type: 'MVP', season, image: '/trophies/mvp.png' });
                });
                
                // Add DPOY awards
                playerAwards.dpoySeasons.forEach(season => {
                  allAwards.push({ type: 'DPOY', season, image: '/trophies/dpoy.png' });
                });
                
                // Add 6MOY awards
                playerAwards.sixthManSeasons.forEach(season => {
                  allAwards.push({ type: '6MOY', season, image: '/trophies/sixth-man.png' });
                });
                
                // Add ROY awards
                playerAwards.roySeasons.forEach(season => {
                  allAwards.push({ type: 'ROY', season, image: '/trophies/roy.png' });
                });
                
                // Sort by season descending (most recent first)
                allAwards.sort((a, b) => b.season - a.season);
                
                return allAwards.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      <Trophy className="w-5 h-5 text-gold-500" />
                      <h3 className="text-lg font-bold">Awards History</h3>
                      <span className="text-sm text-muted-foreground">({allAwards.length} Total)</span>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      {allAwards.map((award, index) => {
                        const colorMap: Record<string, string> = {
                          'MVP': 'text-gold-400',
                          'DPOY': 'text-blue-400',
                          '6MOY': 'text-purple-400',
                          'ROY': 'text-green-400',
                        };
                        return (
                          <div key={index} className="flex flex-col items-center gap-2 p-4 bg-gold-500/10 rounded-lg border border-gold-500/30 hover:border-gold-500/50 transition-all">
                            <img 
                              src={award.image} 
                              alt={`${award.type} Trophy`}
                              className="w-16 h-16 object-contain"
                            />
                            <div className="text-center">
                              <div className={`text-sm font-bold ${colorMap[award.type]}`}>{award.type}</div>
                              <div className="text-xs text-muted-foreground">Season {award.season}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Season 17 Stats Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Season 17 Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.ppg.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">PPG</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.rpg.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">RPG</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.apg.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">APG</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.spg.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">SPG</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.bpg.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">BPG</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.fgPct.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">FG%</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.threePct.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">3P%</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{currentSeasonStats.ftPct.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">FT%</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Games Played</span>
                  <span className="text-2xl font-bold">{currentSeasonStats.gp}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Season Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {player.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{highlight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Career Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Career Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Season</th>
                    <th className="text-left py-3 px-4 font-semibold">Team</th>
                    <th className="text-center py-3 px-4 font-semibold">GP</th>
                    <th className="text-center py-3 px-4 font-semibold">PPG</th>
                    <th className="text-center py-3 px-4 font-semibold">RPG</th>
                    <th className="text-center py-3 px-4 font-semibold">APG</th>
                    <th className="text-center py-3 px-4 font-semibold">SPG</th>
                    <th className="text-center py-3 px-4 font-semibold">BPG</th>
                    <th className="text-center py-3 px-4 font-semibold">FG%</th>
                    <th className="text-center py-3 px-4 font-semibold">3P%</th>
                    <th className="text-center py-3 px-4 font-semibold">FT%</th>
                  </tr>
                </thead>
                <tbody>
                  {player.careerStats.map((seasonStats, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold">Season {seasonStats.season}</td>
                      <td className="py-3 px-4">{seasonStats.team}</td>
                      <td className="py-3 px-4 text-center">{seasonStats.gp}</td>
                      <td className="py-3 px-4 text-center font-semibold">{seasonStats.ppg.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">{seasonStats.rpg.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">{seasonStats.apg.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">{seasonStats.spg.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">{seasonStats.bpg.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">{seasonStats.fgPct.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">{seasonStats.threePct.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">{seasonStats.ftPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        {(player.college || player.draft) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Background</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {player.college && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">College</div>
                    <div className="text-lg font-semibold">{player.college}</div>
                  </div>
                )}
                {player.draft && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Draft</div>
                    <div className="text-lg font-semibold">{player.draft}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
