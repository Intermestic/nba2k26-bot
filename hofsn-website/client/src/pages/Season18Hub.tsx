import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Calendar, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { season18Standings, season18GameRecaps } from "@/../../shared/season18Standings";
import { getTeamLogo } from "@/lib/playerImages";

export default function Season18Hub() {
  const [showStandings, setShowStandings] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sort standings by HoF Score (descending), then by win percentage
  const sortedStandings = [...season18Standings].sort((a, b) => {
    if (b.hofScr !== a.hofScr) return b.hofScr - a.hofScr;
    return b.pct - a.pct;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gold-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="flex items-center gap-2 text-gray-300 hover:text-gold-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-gold-500 to-yellow-600">
                SEASON 18 HUB
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Season 18 Announcement */}
      <section className="container py-8 md:py-12">
        <div className="max-w-5xl mx-auto mb-8">
          <img 
            src="/szn18-announcement.png" 
            alt="Season 18 - The Legacy Continues" 
            className="w-full h-auto rounded-xl shadow-2xl border-2 border-gold-500/30"
          />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            The Legacy Continues
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Season 18 is here! Follow along as the league's best compete for glory. 
            Check back for game recaps, standings updates, and more.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-600/20 border-2 border-blue-500/50 hover:border-blue-400 transition-all cursor-pointer h-full"
                onClick={() => {
                  setShowStandings(true);
                  setTimeout(() => {
                    document.getElementById('standings')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}>
            <CardContent className="pt-8 pb-8 text-center">
              <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-blue-400 mb-2">STANDINGS</h3>
              <p className="text-gray-300">Current league rankings</p>
            </CardContent>
          </Card>

          <a href="#recaps">
            <Card className="bg-gradient-to-br from-red-900/20 to-red-600/20 border-2 border-red-500/50 hover:border-red-400 transition-all cursor-pointer h-full">
              <CardContent className="pt-8 pb-8 text-center">
                <Flame className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-red-400 mb-2">GAME RECAPS</h3>
                <p className="text-gray-300">Latest game results</p>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Game Recaps Section */}
        <div id="recaps" className="mb-16">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/50">
            <CardHeader>
              <CardTitle className="text-3xl font-black text-gold-400 text-center flex items-center justify-center gap-3">
                <Calendar className="w-8 h-8" />
                GAME RECAPS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {season18GameRecaps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {season18GameRecaps.map((game) => (
                    <Card key={game.id} className="bg-gray-800/50 border border-gray-700 hover:border-gold-500/50 transition-all">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={getTeamLogo(game.awayTeam)} 
                              alt={game.awayTeam}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="text-white font-semibold">{game.awayTeam}</span>
                          </div>
                          <span className={`text-2xl font-black ${game.winner === game.awayTeam ? 'text-gold-400' : 'text-gray-400'}`}>
                            {game.awayScore}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={getTeamLogo(game.homeTeam)} 
                              alt={game.homeTeam}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="text-white font-semibold">{game.homeTeam}</span>
                          </div>
                          <span className={`text-2xl font-black ${game.winner === game.homeTeam ? 'text-gold-400' : 'text-gray-400'}`}>
                            {game.homeScore}
                          </span>
                        </div>
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <p className="text-sm text-gray-400">{game.date}</p>
                          <p className="text-gold-400 font-semibold mt-1">{game.headline}</p>
                          {game.topPerformer && (
                            <p className="text-sm text-gray-300 mt-2">
                              <span className="text-gold-400">★</span> {game.topPerformer.player}: {game.topPerformer.stats}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-400 mb-2">Season Starting Soon</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Game recaps will appear here as Season 18 games are played. 
                    Check back soon for the latest action!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Standings Section - Initially Hidden */}
        <div id="standings" className="mb-16">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-black text-gold-400 flex items-center gap-3">
                  <TrendingUp className="w-8 h-8" />
                  LEAGUE STANDINGS
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => setShowStandings(!showStandings)}
                  className="border-gold-500/50 text-gold-400 hover:bg-gold-500/20"
                >
                  {showStandings ? 'Hide Standings' : 'Show Standings'}
                </Button>
              </div>
              {!showStandings && (
                <p className="text-gray-400 mt-2">
                  Click "Show Standings" to view current league rankings
                </p>
              )}
            </CardHeader>
            {showStandings && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gold-500/30">
                        <th className="text-left py-3 px-2 text-gray-400 font-semibold">RK</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">TEAM</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold">W-L</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold">PCT</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold">GP</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold">HoF SCR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStandings.map((standing, idx) => (
                        <tr 
                          key={standing.team} 
                          className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${
                            idx < 16 ? 'bg-green-900/10' : ''
                          }`}
                        >
                          <td className="py-3 px-2 text-center">
                            <span className={`font-bold ${idx < 8 ? 'text-gold-400' : idx < 16 ? 'text-green-400' : 'text-gray-300'}`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={getTeamLogo(standing.team)} 
                                alt={standing.team}
                                className="w-8 h-8 object-contain"
                              />
                              <span className="text-white font-semibold">{standing.team}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center text-gray-300">
                            {standing.wins}-{standing.losses}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-300">
                            {standing.gp > 0 ? standing.pct.toFixed(3) : '—'}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-400">
                            {standing.gp}
                          </td>
                          <td className="py-3 px-2 text-center text-gold-400 font-semibold">
                            {standing.hofScr > 0 ? standing.hofScr.toFixed(1) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 text-center text-sm text-gray-400">
                  <span className="inline-block bg-gold-900/20 px-3 py-1 rounded mr-2">
                    Top 8 = Championship Contenders
                  </span>
                  <span className="inline-block bg-green-900/20 px-3 py-1 rounded">
                    Top 16 = Playoff Bound
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Season 17 Reference Link */}
        <div className="text-center">
          <Link href="/season17-wrapup">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Trophy className="w-4 h-4 mr-2" />
              View Season 17 Wrap-Up
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
