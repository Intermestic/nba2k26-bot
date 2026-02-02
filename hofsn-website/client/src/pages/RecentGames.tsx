import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Trophy, Calendar, ChevronRight, ArrowLeft } from "lucide-react";

// Recent playoff games with links to their summaries
const recentGames = [
  {
    id: 1,
    homeTeam: "Houston Rockets",
    awayTeam: "Cleveland Cavaliers",
    homeScore: 96,
    awayScore: 93,
    homeSeed: 5,
    awaySeed: 4,
    gameNumber: 1,
    seriesStatus: "Rockets lead 1-0",
    isOvertime: true,
    link: "/playoffs/cavs-rockets-game1",
    date: "Round 1 - Game 1",
  },
  {
    id: 2,
    homeTeam: "Sacramento Kings",
    awayTeam: "Chicago Bulls",
    homeScore: 93,
    awayScore: 70,
    homeSeed: 4,
    awaySeed: 5,
    gameNumber: 2,
    seriesStatus: "Kings win series 2-0",
    isOvertime: false,
    link: "/playoffs/kings-bulls-series",
    date: "Round 1 - Game 2",
  },
  {
    id: 3,
    homeTeam: "Sacramento Kings",
    awayTeam: "Chicago Bulls",
    homeScore: 93,
    awayScore: 79,
    homeSeed: 4,
    awaySeed: 5,
    gameNumber: 1,
    seriesStatus: "Kings lead 1-0",
    isOvertime: false,
    link: "/playoffs/kings-bulls-series",
    date: "Round 1 - Game 1",
  },
  {
    id: 4,
    homeTeam: "Denver Nuggets",
    awayTeam: "Utah Jazz",
    homeScore: 144,
    awayScore: 117,
    homeSeed: 7,
    awaySeed: 10,
    gameNumber: 2,
    seriesStatus: "Nuggets win series 2-0",
    isOvertime: false,
    link: "/playoffs/jazz-nuggets-series",
    date: "Round 1 - Game 2",
  },
  {
    id: 5,
    homeTeam: "Denver Nuggets",
    awayTeam: "Utah Jazz",
    homeScore: 113,
    awayScore: 98,
    homeSeed: 7,
    awaySeed: 10,
    gameNumber: 1,
    seriesStatus: "Nuggets lead 1-0",
    isOvertime: false,
    link: "/playoffs/jazz-nuggets-series",
    date: "Round 1 - Game 1",
  },
  {
    id: 6,
    homeTeam: "Toronto Raptors",
    awayTeam: "Indiana Pacers",
    homeScore: 128,
    awayScore: 63,
    homeSeed: 1,
    awaySeed: 8,
    gameNumber: 2,
    seriesStatus: "Raptors win series 2-0",
    isOvertime: false,
    link: "/playoffs/raptors-pacers-series",
    date: "Round 1 - Game 2",
  },
  {
    id: 7,
    homeTeam: "Toronto Raptors",
    awayTeam: "Indiana Pacers",
    homeScore: 87,
    awayScore: 77,
    homeSeed: 1,
    awaySeed: 8,
    gameNumber: 1,
    seriesStatus: "Raptors lead 1-0",
    isOvertime: false,
    link: "/playoffs/raptors-pacers-series",
    date: "Round 1 - Game 1",
  },
];

export default function RecentGames() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-900 to-background py-12">
        <div className="container">
          <Link href="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </Link>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="w-10 h-10 text-gold-400" />
            <h1 className="text-4xl md:text-5xl font-black text-gold-400 text-center">
              RECENT GAMES
            </h1>
            <Trophy className="w-10 h-10 text-gold-400" />
          </div>
          <p className="text-center text-gray-400 text-lg">
            Season 17 Playoff Game Scores & Recaps
          </p>
        </div>
      </section>

      {/* Games List */}
      <section className="container py-8">
        <div className="space-y-4 max-w-4xl mx-auto">
          {recentGames.map((game) => (
            <Link key={game.id} href={game.link}>
              <Card className="bg-card border border-border hover:border-gold-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Game Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{game.date}</span>
                        {game.isOvertime && (
                          <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">
                            OT
                          </span>
                        )}
                      </div>
                      
                      {/* Teams and Scores */}
                      <div className="space-y-2">
                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-6">
                              ({game.homeSeed})
                            </span>
                            <span className={`font-bold ${game.homeScore > game.awayScore ? 'text-gold-400' : 'text-foreground'}`}>
                              {game.homeTeam}
                            </span>
                          </div>
                          <span className={`text-2xl font-black ${game.homeScore > game.awayScore ? 'text-gold-400' : 'text-foreground'}`}>
                            {game.homeScore}
                          </span>
                        </div>
                        
                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-6">
                              ({game.awaySeed})
                            </span>
                            <span className={`font-bold ${game.awayScore > game.homeScore ? 'text-gold-400' : 'text-foreground'}`}>
                              {game.awayTeam}
                            </span>
                          </div>
                          <span className={`text-2xl font-black ${game.awayScore > game.homeScore ? 'text-gold-400' : 'text-foreground'}`}>
                            {game.awayScore}
                          </span>
                        </div>
                      </div>
                      
                      {/* Series Status */}
                      <div className="mt-2 text-sm text-muted-foreground">
                        {game.seriesStatus}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="ml-4">
                      <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-gold-400 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/season17-wrapup">
            <button className="px-6 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-all">
              ← Back to Season 17 Wrap-Up
            </button>
          </Link>
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
