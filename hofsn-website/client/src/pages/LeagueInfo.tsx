import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, DollarSign, Calendar, Users, TrendingUp, Gamepad2, Shield, Trophy } from "lucide-react";
import { useEffect } from "react";

export default function LeagueInfo() {
  // Scroll to top when component mounts
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
                LEAGUE RULES & INFO
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Team Logos */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Hall of Fame Basketball Association - Season 17
          </h2>
          <p className="text-xl text-gray-300">
            Xbox Next Gen • Hall of Fame Difficulty • 82 Games • 8 Min Quarters
          </p>
        </div>
        
        {/* Team Logos Grid */}
        <div className="mb-12 rounded-xl overflow-hidden border-2 border-gold-500/30">
          <img 
            src="/nba-team-logos.jpg" 
            alt="All NBA Team Logos" 
            className="w-full h-auto"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gold-500/30">
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">640</div>
              <div className="text-sm text-gray-400">Total Players</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gold-500/30">
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">1098</div>
              <div className="text-sm text-gray-400">Attribute Cap</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gold-500/30">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">75.4</div>
              <div className="text-sm text-gray-400">Avg Rating</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gold-500/30">
            <CardContent className="pt-6 text-center">
              <Calendar className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">82</div>
              <div className="text-sm text-gray-400">Games</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Rosters & Transactions Section */}
      <section className="container py-8">
        <h2 className="text-3xl font-black text-gold-400 mb-6 text-center">📝 ROSTERS & TRANSACTIONS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Roster Caps */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-gold-400 flex items-center gap-2">
                <Users className="w-6 h-6" />
                ROSTER REQUIREMENTS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="p-4 bg-black/40 rounded-lg border border-gold-500/20">
                <h3 className="text-lg font-bold text-white mb-2">Roster Size: 14 Players</h3>
                <p className="text-sm">
                  Each team must maintain exactly <strong className="text-gold-400">14 rostered players</strong>.
                </p>
              </div>
              
              <div className="p-4 bg-black/40 rounded-lg border border-gold-500/20">
                <h3 className="text-lg font-bold text-white mb-2">Attribute Cap: 1098</h3>
                <p className="text-sm">
                  Total team overall rating cannot exceed <strong className="text-gold-400">1098</strong>. 
                  This ensures competitive balance across the league.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-lg border border-blue-500/20">
                <h3 className="text-lg font-bold text-blue-400 mb-2">Minimum Overall: 70</h3>
                <p className="text-sm">
                  All players must be rated <strong>70 OVR or higher</strong>.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-lg border border-purple-500/20">
                <h3 className="text-lg font-bold text-purple-400 mb-2">Badge Restrictions</h3>
                <p className="text-sm">
                  <strong>No Hall of Fame badge upgrades</strong> allowed (except award-based upgrades).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trade & Free Agency */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-gold-400 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                TRADES & FREE AGENCY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="p-4 bg-black/40 rounded-lg border border-red-500/20">
                <h3 className="text-lg font-bold text-red-400 mb-2">Trade Approval Required</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>All trades need <strong>committee approval</strong></li>
                  <li>Cannot trade for 90+ player if you already have 2× 90+ players</li>
                  <li>Commissioner may veto if deal breaks competitive balance</li>
                  <li>New users: play 10 games + write 10 summaries before trading 85+ OVR player</li>
                </ul>
              </div>
              
              <div className="p-4 bg-black/40 rounded-lg border border-green-500/20">
                <h3 className="text-lg font-bold text-green-400 mb-2">Free Agency Requirements</h3>
                <p className="text-sm">
                  Must play <strong>4 games + write 4 summaries</strong> before free agency opens for your team.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-lg border border-yellow-500/20">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Upgrade Rules</h3>
                <p className="text-sm">
                  Player upgrades only allowed if under attribute cap. If over 1098 → FA signings void / upgrades removed until compliant.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Gameplay Rules Section */}
      <section className="container py-8">
        <h2 className="text-3xl font-black text-gold-400 mb-6 text-center">🎮 GAMEPLAY RULES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Points in Paint */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-gold-400 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6" />
                POINTS IN THE PAINT (PIP)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="p-4 bg-black/40 rounded-lg border border-gold-500/20">
                <h3 className="text-lg font-bold text-white mb-2">Maximum: 60 PIP in Regulation</h3>
                <p className="text-sm mb-2">
                  NBA PIP leader 24-25 = 54, so we're keeping it realistic at <strong className="text-gold-400">60 max</strong>.
                </p>
                <p className="text-sm text-gray-400">
                  If opponent goes over: reset or take the W.
                </p>
              </div>
              <div className="p-3 bg-blue-900/20 rounded border border-blue-500/30 text-sm">
                <strong>Intent:</strong> To make sure gameplay stays realistic, skill-based, and fun for everyone. Prevents paint spamming and encourages diverse scoring styles.
              </div>
            </CardContent>
          </Card>

          {/* On-Ball Defense */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-gold-400 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                ON-BALL DEFENSE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="p-4 bg-black/40 rounded-lg border border-gold-500/20">
                <h3 className="text-lg font-bold text-white mb-2">On-Ball Required</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Zone must ALWAYS control the man closest to the ball</li>
                  <li>No full-game zone defense</li>
                  <li>Press/trap only if down 10+ or in 4Q</li>
                  <li>Inbound steals: only on made-basket inbounds if pass target is beyond own FT line</li>
                </ul>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-red-500/20">
                <h3 className="text-lg font-bold text-red-400 mb-2">No CPU Bailouts</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Late switch so CPU guards ball (≥1-2 sec) = violation</li>
                  <li>Camping lanes off ball = violation</li>
                  <li>Backdown defense → must stay on-ball</li>
                  <li>Pre-rotate: must control defender in drive path</li>
                </ul>
              </div>
              <div className="p-3 bg-blue-900/20 rounded border border-blue-500/30 text-sm">
                <strong>Intent:</strong> To reward user skill on defense instead of CPU exploits.
              </div>
            </CardContent>
          </Card>

          {/* Bench Usage */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-gold-400 flex items-center gap-2">
                <Users className="w-6 h-6" />
                BENCH USAGE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="p-4 bg-black/40 rounded-lg border border-gold-500/20">
                <h3 className="text-lg font-bold text-white mb-2">84+ OVR Players</h3>
                <p className="text-sm mb-2">
                  Can only come off bench if they did so <strong className="text-gold-400">40%+ IRL</strong> last season or career (check Basketball Reference).
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-blue-500/20">
                <h3 className="text-lg font-bold text-blue-400 mb-2">Starter Minutes</h3>
                <p className="text-sm">
                  Starters must play <strong>4 min in 1Q</strong> before subbing (except if 2+ fouls early).
                </p>
              </div>
              <div className="p-3 bg-blue-900/20 rounded border border-blue-500/30 text-sm">
                <strong>Intent:</strong> To mirror realistic NBA rotations and avoid stacked benches with star players.
              </div>
            </CardContent>
          </Card>

          {/* Quitting Policy */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-gold-400 flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                QUITTING POLICY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div className="p-4 bg-black/40 rounded-lg border border-green-500/20">
                <h3 className="text-lg font-bold text-green-400 mb-2">✅ Allowed</h3>
                <p className="text-sm">
                  Quitting with no penalty <strong>once the 3rd quarter is completed</strong>.
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-red-500/20">
                <h3 className="text-lg font-bold text-red-400 mb-2">❌ Otherwise = 1 Strike</h3>
                <p className="text-sm">
                  Quitting before 3Q ends = 1 strike. <strong>4 strikes = removal from league</strong>.
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-gold-500/20">
                <h3 className="text-lg font-bold text-gold-400 mb-2">Auto-Win Condition</h3>
                <p className="text-sm">
                  If opponent uses 3 full pause timers (continue/quit screen pops 3×), you get the auto-win.
                </p>
              </div>
              <div className="p-3 bg-blue-900/20 rounded border border-blue-500/30 text-sm">
                <strong>Intent:</strong> To give members a fair way to exit games without drama while protecting against abuse and allowing for realistic stats.
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Playoffs Section */}
      <section className="container py-8">
        <h2 className="text-3xl font-black text-gold-400 mb-6 text-center">🏆 PLAYOFFS</h2>
        <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-gold-500/30 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-gold-400 flex items-center gap-2 justify-center">
              <Trophy className="w-6 h-6" />
              PLAYOFF FORMAT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <div className="p-4 bg-black/40 rounded-lg border border-gold-500/20">
              <h3 className="text-lg font-bold text-white mb-2">Qualification Formula</h3>
              <p className="text-sm mb-2">
                <strong className="text-gold-400">60% activity + 40% record</strong>
              </p>
              <p className="text-sm text-gray-400">
                16 teams total (8 per conference, then seeded 1–16 regardless of conference).
              </p>
            </div>
            <div className="p-4 bg-black/40 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-bold text-purple-400 mb-2">Cross-Conference Seeding</h3>
              <p className="text-sm">
                Focus: Beat the opponent in front of you — <strong>no East/West barriers</strong>.
              </p>
            </div>
            <div className="p-3 bg-blue-900/20 rounded border border-blue-500/30 text-sm">
              <strong>Intent:</strong> To reward both activity and performance, making sure the most engaged and skilled teams get in.
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Roster Database Link */}
      <section className="container py-12">
        <Card className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border-2 border-gold-500/30">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
              EXPLORE FULL ROSTERS
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Access the complete Season 17 roster database with player ratings, badges, 
              team compositions, and detailed statistics for all 640 players across 30 teams.
            </p>
            <div className="flex justify-center">
              <a 
                href="https://hof17roster.manus.space" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-lg rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
              >
                📊 View Full Rosters
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold-500/30 py-8 mt-12">
        <div className="container text-center text-gray-400 text-sm">
          <p>© 2024 Hall of Fame Basketball Association. All rights reserved.</p>
          <p className="mt-2">HoFSN - Your source for NBA 2K26 league coverage</p>
        </div>
      </footer>
    </div>
  );
}
