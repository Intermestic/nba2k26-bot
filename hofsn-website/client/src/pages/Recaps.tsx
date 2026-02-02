import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import gamesData from "@/data/games.json";

export default function Recaps() {
  // Sort games by ID (most recent first)
  const games = [...gamesData].reverse();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/40 border-b border-gold-500/20">
        <div className="container py-6">
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors mb-4">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </a>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gold-400 mb-2">
            Weekly Recaps 🏀
          </h1>
          <p className="text-gray-300">
            Complete game summaries from Season 17 of the Hall of Fame Basketball Association
          </p>
        </div>
      </div>

      {/* Games List */}
      <div className="container py-8">
        <div className="space-y-6">
          {games.map((game) => {
            const teams = Object.values(game.teams);
            const team1 = teams[0] as any;
            const team2 = teams[1] as any;
            
            // Find top performer (most points)
            const allPlayers = [...team1.players, ...team2.players];
            const topPerformer = allPlayers.reduce((max, player) => 
              player.pts > max.pts ? player : max
            );

            return (
              <Card key={game.id} className="bg-black/60 border-gold-500/30 hover:border-gold-400/50 transition-all">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle className="text-2xl text-gold-400">
                      {game.matchup}
                    </CardTitle>
                    {game.notes && (
                      <span className="text-sm text-gray-400 italic">
                        {game.notes}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Score */}
                  <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div>
                      <div className="text-lg font-semibold text-white mb-1">
                        {team1.name}
                      </div>
                      <div className={`text-4xl font-bold ${
                        team1.total_points > team2.total_points 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                      }`}>
                        {team1.total_points}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-2xl text-gray-500">-</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white mb-1">
                        {team2.name}
                      </div>
                      <div className={`text-4xl font-bold ${
                        team2.total_points > team1.total_points 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                      }`}>
                        {team2.total_points}
                      </div>
                    </div>
                  </div>

                  {/* Top Performer */}
                  <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-gold-400" />
                      <span className="text-sm font-semibold text-gold-400">
                        Top Performer
                      </span>
                    </div>
                    <div className="text-white">
                      <span className="font-bold text-lg">{topPerformer.name}</span>
                      <span className="text-gray-400 ml-2">
                        {topPerformer.pts} PTS, {topPerformer.reb} REB, {topPerformer.ast} AST
                      </span>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {teams.map((team: any) => (
                      <div key={team.name}>
                        <h3 className="text-lg font-semibold text-gold-400 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {team.name} Leaders
                        </h3>
                        <div className="space-y-2">
                          {team.players
                            .sort((a: any, b: any) => b.pts - a.pts)
                            .slice(0, 5)
                            .map((player: any) => (
                              <div
                                key={player.name}
                                className="flex justify-between items-center text-sm bg-black/40 rounded px-3 py-2"
                              >
                                <span className="text-white font-medium">
                                  {player.name}
                                </span>
                                <span className="text-gray-400">
                                  {player.pts} PTS / {player.reb} REB / {player.ast} AST
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
