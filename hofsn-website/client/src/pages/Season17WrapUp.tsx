import { Link } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, Award, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { season17FinalStandings } from "@/../../shared/season17FinalStandings";
import { season17Top10Stats } from "@/../../shared/season17Stats";
import { getTeamLogo, getPlayerHeadshot } from "@/lib/playerImages";
import { playerNameToSlug } from "@/../../shared/playerProfiles";
import PlayoffBracket from "@/components/PlayoffBracket";

export default function Season17WrapUp() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
                SEASON 17 WRAP-UP
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12">
        <div className="text-center mb-12">
          <Trophy className="w-16 h-16 text-gold-400 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Regular Season Complete
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore the final standings, statistical leaders, and playoff bracket for Season 17
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <a href="#standings">
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-600/20 border-2 border-blue-500/50 hover:border-blue-400 transition-all cursor-pointer h-full">
              <CardContent className="pt-8 pb-8 text-center">
                <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-blue-400 mb-2">FINAL STANDINGS</h3>
                <p className="text-gray-300">Complete season rankings</p>
              </CardContent>
            </Card>
          </a>

          <a href="#top10">
            <Card className="bg-gradient-to-br from-gold-900/20 to-gold-600/20 border-2 border-gold-500/50 hover:border-gold-400 transition-all cursor-pointer h-full">
              <CardContent className="pt-8 pb-8 text-center">
                <Award className="w-12 h-12 text-gold-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-gold-400 mb-2">TOP 10 LEADERS</h3>
                <p className="text-gray-300">Statistical champions</p>
              </CardContent>
            </Card>
          </a>

          <a href="#bracket">
            <Card className="bg-gradient-to-br from-red-900/20 to-red-600/20 border-2 border-red-500/50 hover:border-red-400 transition-all cursor-pointer h-full">
              <CardContent className="pt-8 pb-8 text-center">
                <Target className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-red-400 mb-2">PLAYOFF BRACKET</h3>
                <p className="text-gray-300">Road to the championship</p>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Final Standings Section */}
        <div id="standings" className="mb-16">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/50">
            <CardHeader>
              <CardTitle className="text-3xl font-black text-gold-400 text-center flex items-center justify-center gap-3">
                <TrendingUp className="w-8 h-8" />
                FINAL STANDINGS
              </CardTitle>
            </CardHeader>
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
                    </tr>
                  </thead>
                  <tbody>
                    {season17FinalStandings.slice(0, 16).map((standing, idx) => (
                      <tr 
                        key={standing.rank} 
                        className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${
                          idx < 16 ? 'bg-green-900/10' : ''
                        }`}
                      >
                        <td className="py-3 px-2 text-center">
                          <span className={`font-bold ${idx < 8 ? 'text-gold-400' : 'text-gray-300'}`}>
                            {standing.rank}
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
                          {standing.pct.toFixed(3)}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-400">
                          {standing.gp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-center text-sm text-gray-400">
                <span className="inline-block bg-green-900/10 px-3 py-1 rounded mr-2">
                  Top 16 teams advance to playoffs
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 Leaders Section with Accordions */}
        <div id="top10" className="mb-16">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/50">
            <CardHeader>
              <CardTitle className="text-3xl font-black text-gold-400 text-center flex items-center justify-center gap-3">
                <Award className="w-8 h-8" />
                TOP 10 STATISTICAL LEADERS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {season17Top10Stats.map((category) => (
                  <AccordionItem 
                    key={category.id} 
                    value={category.id}
                    className="bg-gradient-to-br from-gold-900/10 to-gold-600/10 border border-gold-500/30 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gold-500/10 transition-colors">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                          <h3 className="text-xl font-black text-gold-400">{category.title}</h3>
                          <p className="text-sm text-gray-400">{category.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-400">Leader: </span>
                          <span className="text-gold-400 font-bold">{category.leaders[0].player}</span>
                          <span className="text-gold-400 font-bold ml-2">{category.leaders[0].value}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-3 mt-4">
                        {category.leaders.map((leader) => (
                          <Link key={leader.rank} href={`/player/${playerNameToSlug(leader.player)}`}>
                            <div 
                              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer hover:scale-[1.02] ${
                                leader.rank === 1 ? 'bg-gold-500/20 border border-gold-500/30 hover:border-gold-500' :
                                leader.rank === 2 ? 'bg-gray-700/30 hover:bg-gray-700/40' :
                                leader.rank === 3 ? 'bg-amber-900/20 hover:bg-amber-900/30' :
                                'bg-gray-800/20 hover:bg-gray-800/30'
                              }`}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <span className={`text-lg font-bold w-8 ${
                                  leader.rank === 1 ? 'text-gold-400' :
                                  leader.rank === 2 ? 'text-gray-300' :
                                  leader.rank === 3 ? 'text-amber-600' :
                                  'text-gray-400'
                                }`}>
                                  {leader.rank}
                                </span>
                                <img 
                                  src={getPlayerHeadshot(leader.player)} 
                                  alt={leader.player}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gold-500/30 hover:border-gold-500 transition-all"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <img 
                                  src={getTeamLogo(leader.team)} 
                                  alt={leader.team}
                                  className="w-8 h-8 object-contain"
                                />
                                <div className="flex-1">
                                  <div className="text-white font-semibold group-hover:text-gold-400 transition-colors">{leader.player}</div>
                                  <div className="text-sm text-gray-400">{leader.team}</div>
                                </div>
                              </div>
                            <div className="text-right">
                              <div className={`text-2xl font-black ${
                                leader.rank === 1 ? 'text-gold-400' : 'text-gray-300'
                              }`}>
                                {leader.value}
                              </div>
                              {leader.gp && (
                                <div className="text-xs text-gray-500">
                                  {leader.gp} GP{leader.total && ` • ${leader.total} Total`}
                                </div>
                              )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Playoff Bracket Section */}
        <div id="bracket" className="mb-16">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/50">
            <CardHeader>
              <CardTitle className="text-3xl font-black text-gold-400 text-center flex items-center justify-center gap-3">
                <Target className="w-8 h-8" />
                SEASON 17 PLAYOFF BRACKET
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlayoffBracket />
              <div className="mt-6 text-center">
                <Link href="/recent-games">
                  <button className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl">
                    View Recent Game Scores & Recaps →
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
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
