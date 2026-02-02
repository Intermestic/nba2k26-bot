import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { playerNameToSlug } from "@shared/playerProfiles";
import { ArrowLeft, Trophy, Shield, Award, Star } from "lucide-react";
import { useEffect } from "react";
import { getPlayerHeadshot, getTeamLogo } from "@/lib/playerImages";
import { getPlayerTrophyCase, getTotalAwards } from "@/data/trophyCase";
import { getAllPlayersSortedByAwards } from "@/data/comprehensiveTrophyCase";

export default function Awards() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Season 17 Award Winners
  const season17Awards = {
    mvp: { name: "Brandon Ingram", team: "DET", stats: "38.80 PPG | FG 60.7% | 3P 50.4% | FT 90.9%", votes: "9 votes (47.4%)" },
    dpoy: { name: "Jalen Suggs", team: "WAS", stats: "DIS 88.00 | OppFG 43.97% | 2.07 SPG", votes: "10 votes (52.6%)", backToBack: true },
    sixthMan: { name: "Kentavious Caldwell-Pope", team: "DEN", stats: "17.23 PPG | FG 62.0% | 3P 62.0%", votes: "9 votes (47.4%)" },
    roy: { name: "Jamir Watkins", team: "DET", stats: "13.69 PPG | 2.73 APG | +/- 502", votes: "12 votes (66.7%)" }
  };

  const leagueHistory = [
    { season: 17, champion: "TBD (Playoffs in progress)", mvp: "Brandon Ingram (DET)", dpoy: "Jalen Suggs (WAS)", sixthMan: "Kentavious Caldwell-Pope (DEN)", roy: "Jamir Watkins (DET)" },
    { season: 16, champion: "Pistons", mvp: "Luka Dončić (TOR) / Stephen Curry (DAL)", dpoy: "Jalen Suggs (WAS)", sixthMan: "Brandin Podziemski (TOR)", roy: "Ace Bailey (NOP)" },
    { season: 15, champion: "Nuggets (Kuroko)", mvp: "Collin Sexton (Kings, gsjayy3)", dpoy: "Dyson Daniels (Pacers, Mel3hun)", sixthMan: "Devin Carter (Nuggets, Kuroko)", roy: "Devin Carter (Nuggets, Kuroko)" },
    { season: 14, champion: "Nuggets (Kuroko) def. Kings 4-0", mvp: "Tyrese Haliburton (Raptors, Melofreeplay)", dpoy: "Amen Thompson (Warriors, 216goat)", sixthMan: "Immanuel Quickley (Pacers, Mel3hun)", roy: "Isaiah Collier (76ers, iShotCheese)" },
    { season: 13, champion: "Nuggets (Kuroko) def. Nets 4-0", mvp: "Jalen Suggs (Wizards, 2kleague)", dpoy: "Jalen Suggs (Wizards, 2kleague)", sixthMan: "Miles Bridges (Raptors, Melofreeplay)", roy: "Matas Buzelis (Wolves, CheeseGotShot)" },
    { season: 12, champion: "Nuggets (Kuroko) def. Kings 4-1", mvp: "Anthony Edwards (Clippers, Wilstunna)", dpoy: "Anthony Edwards (Clippers, Wilstunna)", sixthMan: "Russell Westbrook (Nuggets, Kuroko)", roy: "Alex Sarr (Grizzlies, L3–FranZeloVille)" },
    { season: 11, champion: "Nuggets (Kuroko) def. Pacers 4-0", mvp: "Nikola Jokic (Nuggets, Kuroko)", dpoy: "Alex Caruso (Wizards, 2kleague)", sixthMan: "Shaedon Sharpe (Knicks, Postesitilo)", roy: "Matas Buzelis (Kings, gsjayy3)" },
    { season: 10, champion: "Wizards (2kleague) def. Hawks 4-1", mvp: "Donovan Mitchell (Wizards, 2kleague)", dpoy: "Alex Caruso (Wizards, 2kleague)", sixthMan: "Cam Thomas (Hawks, xpolohawkboy)", roy: "Ausar Thompson (imxdaking)" },
    { season: 9, champion: "Blazers (Stizzo/Breezy) def. Raptors 4-1", mvp: "Kevin Durant (Blazers, Stizzo/Breezy)", dpoy: "Nic Claxton (Warriors, ant3482)", sixthMan: "Obi Toppin (Blazers, bigjokic_S8728)", roy: "Ausar Thompson (imxdaking)" },
    { season: 8, champion: "Thunder (jayyyyyy7108) def. Raptors 4-1", mvp: "Tyrese Haliburton (Wizards, 2kleague)", dpoy: "Ausar Thompson (imxdaking)", sixthMan: "Bol Bol (Hornets, jayyyyyy7108)", roy: "Victor Wembanyama (Heat, Jota0620)" },
    { season: 7, champion: "Nuggets (Kuroko) def. Wizards 4-2", mvp: "Joel Embiid (Nuggets, Kuroko)", dpoy: "Joel Embiid (Nuggets, Kuroko)", sixthMan: "Tobias Harris (Wizards, 2kleague)", roy: "Ausar Thompson (imxdaking)" },
    { season: 6, champion: "Hawks (xpolohawkboy) def. Lakers 4-2", mvp: "None", dpoy: "None", sixthMan: "None", roy: "None" },
    { season: 5, champion: "Unfinished (Lakers vs Nuggets)", mvp: "De'Aaron Fox (Wizards) / DeMar DeRozan (Nets)", dpoy: "Caruso (Nuggets, Kuroko)", sixthMan: "Tobias Harris (Wizards, 2kleague)", roy: "Ausar Thompson (imxdaking)" },
    { season: 4, champion: "Hawks (xpolohawkboy) def. Lakers 4-1", mvp: "LeBron (Lakers, jayguwop)", dpoy: "Anthony Davis (Pacers, Mel3hun)", sixthMan: "Tobias Harris (Wizards, 2kleague)", roy: "Victor Wembanyama (Heat, Jota0620)" },
    { season: 3, champion: "League switched to non-progression", mvp: "—", dpoy: "—", sixthMan: "—", roy: "—" },
    { season: 2, champion: "Wizards (2kleague) def. Hawks 4-0", mvp: "None", dpoy: "None", sixthMan: "None", roy: "None" },
    { season: 1, champion: "Heat (Jota0620) — playoffs simmed", mvp: "None", dpoy: "None", sixthMan: "None", roy: "None" }
  ];

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
                AWARDS & HISTORY
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hall of Champions Hero */}
      <section className="container py-12">
        <div className="text-center mb-12">
          <img 
            src="/hall-of-champions-logo.png" 
            alt="Hall of Champions" 
            className="w-64 md:w-96 mx-auto mb-6"
          />
          <div className="max-w-4xl mx-auto space-y-4 text-gray-300">
            <p className="text-xl font-bold text-gold-400">
              🔥 Out of the wasteland of dead leagues and power-tripping admins, we rose.
            </p>
            <p className="text-lg">
              When others folded, when toxicity ruled, we carried one dream: <strong className="text-white">team-building and pure, competitive hoops.</strong>
            </p>
            <p className="text-lg">
              What they called the "B League" became <strong className="text-gold-400">THE League.</strong>
            </p>
            <p className="text-lg">
              For over two years — and soon four NBA 2Ks — we've gone toe-to-toe, season after season, proving we don't just play the game… <strong className="text-white">we ARE the game.</strong>
            </p>
            <p className="text-lg italic text-gray-400 mt-6">
              You have to know where you come from to know where you're going.
            </p>
            <p className="text-2xl font-bold text-gold-400 mt-4">
              This is our story. This is our legacy. This… is the 🏆 Hall of Champions.
            </p>
          </div>
        </div>
      </section>

      {/* Season 17 Awards Spotlight */}
      <section className="container py-12">
        <h2 className="text-4xl font-black text-gold-400 mb-8 text-center flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10" />
          SEASON 17 AWARDS
          <Trophy className="w-10 h-10" />
        </h2>



        <div className="max-w-6xl mx-auto space-y-6">
          {/* MVP */}
          <Card className="bg-gradient-to-br from-yellow-900/30 to-black border-2 border-gold-500">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gold-400 flex items-center gap-4">
                <img src="/trophies/mvp.png" alt="MVP Trophy" className="w-24 h-24 object-contain" />
                Most Valuable Player
                <span className="text-lg font-normal text-gray-400 ml-2">The Michael Jordan Trophy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/player/${playerNameToSlug(season17Awards.mvp.name)}`}>
                <div className="p-6 bg-black/60 rounded-lg border border-gold-500/30 hover:border-gold-500 transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={getPlayerHeadshot(season17Awards.mvp.name)} 
                        alt={season17Awards.mvp.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gold-500/50 hover:border-gold-500 transition-all"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/96x96/1f2937/fbbf24?text=MVP";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 hover:text-gold-400 transition-colors">{season17Awards.mvp.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                          src={getTeamLogo(season17Awards.mvp.team)} 
                          alt={season17Awards.mvp.team}
                          className="w-6 h-6 object-contain"
                        />
                        <p className="text-gold-400 font-semibold">{season17Awards.mvp.team === "DET" ? "Detroit Pistons" : season17Awards.mvp.team}</p>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{season17Awards.mvp.stats}</p>
                      <p className="text-gold-400/70 text-xs">{season17Awards.mvp.votes}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* DPOY */}
          <Card className="bg-gradient-to-br from-blue-900/30 to-black border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-blue-400 flex items-center gap-3">
                <img src="/trophies/dpoy.png" alt="DPOY Trophy" className="w-12 h-12 object-contain" />
                Defensive Player of the Year
                <span className="text-lg font-normal text-gray-400 ml-2">The Hakeem Olajuwon Trophy</span>
                {season17Awards.dpoy.backToBack && (
                  <span className="ml-3 px-3 py-1 bg-gold-500/20 text-gold-400 text-sm font-bold rounded-full border border-gold-500/50">
                    🔥 BACK-TO-BACK
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/player/${playerNameToSlug(season17Awards.dpoy.name)}`}>
                <div className="p-6 bg-black/60 rounded-lg border border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={getPlayerHeadshot(season17Awards.dpoy.name)} 
                        alt={season17Awards.dpoy.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500/50 hover:border-blue-500 transition-all"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/96x96/1f2937/3b82f6?text=DPOY";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 hover:text-blue-400 transition-colors">{season17Awards.dpoy.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                          src={getTeamLogo(season17Awards.dpoy.team)} 
                          alt={season17Awards.dpoy.team}
                          className="w-6 h-6 object-contain"
                        />
                        <p className="text-blue-400 font-semibold">{season17Awards.dpoy.team === "WAS" ? "Washington Wizards" : season17Awards.dpoy.team}</p>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{season17Awards.dpoy.stats}</p>
                      <p className="text-blue-400/70 text-xs">{season17Awards.dpoy.votes}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* ROY */}
          <Card className="bg-gradient-to-br from-green-900/30 to-black border-2 border-green-500">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-green-400 flex items-center gap-3">
                <img src="/trophies/roy.png" alt="ROY Trophy" className="w-12 h-12 object-contain" />
                Rookie of the Year
                <span className="text-lg font-normal text-gray-400 ml-2">The Wilt Chamberlain Trophy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/player/${playerNameToSlug(season17Awards.roy.name)}`}>
                <div className="p-6 bg-black/60 rounded-lg border border-green-500/30 hover:border-green-500 transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={getPlayerHeadshot(season17Awards.roy.name)} 
                        alt={season17Awards.roy.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-green-500/50 hover:border-green-500 transition-all"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/96x96/1f2937/22c55e?text=ROY";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 hover:text-green-400 transition-colors">{season17Awards.roy.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                          src={getTeamLogo(season17Awards.roy.team)} 
                          alt={season17Awards.roy.team}
                          className="w-6 h-6 object-contain"
                        />
                        <p className="text-green-400 font-semibold">{season17Awards.roy.team === "DET" ? "Detroit Pistons" : season17Awards.roy.team}</p>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{season17Awards.roy.stats}</p>
                      <p className="text-green-400/70 text-xs">{season17Awards.roy.votes}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* 6th Man */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-black border-2 border-purple-500">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-purple-400 flex items-center gap-3">
                <img src="/trophies/sixth-man.png" alt="6th Man Trophy" className="w-12 h-12 object-contain" />
                Sixth Man of the Year
                <span className="text-lg font-normal text-gray-400 ml-2">The John Havlicek Trophy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/player/${playerNameToSlug(season17Awards.sixthMan.name)}`}>
                <div className="p-6 bg-black/60 rounded-lg border border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={getPlayerHeadshot(season17Awards.sixthMan.name)} 
                        alt={season17Awards.sixthMan.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/50 hover:border-purple-500 transition-all"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/96x96/1f2937/a855f7?text=6MOY";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 hover:text-purple-400 transition-colors">{season17Awards.sixthMan.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                          src={getTeamLogo(season17Awards.sixthMan.team)} 
                          alt={season17Awards.sixthMan.team}
                          className="w-6 h-6 object-contain"
                        />
                        <p className="text-purple-400 font-semibold">{season17Awards.sixthMan.team === "DEN" ? "Denver Nuggets" : season17Awards.sixthMan.team}</p>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{season17Awards.sixthMan.stats}</p>
                      <p className="text-purple-400/70 text-xs">{season17Awards.sixthMan.votes}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trophy Case Section */}
      <section className="container py-12 border-t border-gold-500/20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-gold-400" />
            <h2 className="text-4xl font-black text-gold-400">TROPHY CASE</h2>
            <Trophy className="w-12 h-12 text-gold-400" />
          </div>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Every legend who left their mark on the Hall of Fame Basketball Association
          </p>
        </div>

        {/* Trophy Legend */}
        <div className="max-w-4xl mx-auto mb-8 p-6 bg-black/60 rounded-lg border border-gold-500/30">
          <h3 className="text-xl font-bold text-gold-400 mb-4 text-center">Trophy Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2">
              <img src="/trophies/mvp.png" alt="MVP" className="w-16 h-16 object-contain" />
              <span className="text-gold-400 font-semibold text-sm">MVP</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img src="/trophies/dpoy.png" alt="DPOY" className="w-16 h-16 object-contain" />
              <span className="text-blue-400 font-semibold text-sm">DPOY</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img src="/trophies/sixth-man.png" alt="6MOY" className="w-16 h-16 object-contain" />
              <span className="text-purple-400 font-semibold text-sm">6th Man</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img src="/trophies/roy.png" alt="ROY" className="w-16 h-16 object-contain" />
              <span className="text-green-400 font-semibold text-sm">ROY</span>
            </div>
          </div>
        </div>

        {/* Player Trophy Rows */}
        <div className="max-w-6xl mx-auto space-y-4 mb-12">
          {getAllPlayersSortedByAwards().map((player, idx) => {
            const totalAwards = player.mvpSeasons.length + player.dpoySeasons.length + 
                               player.sixthManSeasons.length + player.roySeasons.length;
            
            return (
              <Link key={idx} href={`/player/${playerNameToSlug(player.playerName)}`}>
                <div className="bg-gradient-to-r from-black/80 via-gray-900/60 to-black/80 border border-gold-500/20 rounded-lg p-4 hover:border-gold-500/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-6">
                    {/* Player Info */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                      <img 
                        src={getPlayerHeadshot(player.playerName)} 
                        alt={player.playerName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gold-500/50 hover:border-gold-500 transition-all"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/64x64/1f2937/fbbf24?text=Player";
                        }}
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white hover:text-gold-400 transition-colors">{player.playerName}</h3>
                        <p className="text-sm text-gray-400">{totalAwards} Total Award{totalAwards !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Trophy Display */}
                    <div className="flex-1 flex items-center gap-3 flex-wrap">
                      {/* MVP Trophies */}
                      {player.mvpSeasons.map((season, i) => (
                        <div key={`mvp-${i}`} className="relative group flex flex-col items-center gap-1">
                          <img 
                            src="/trophies/mvp.png" 
                            alt={`MVP Season ${season}`}
                            className="w-20 h-20 object-contain hover:scale-110 transition-transform"
                          />
                          <span className="text-gold-400 text-sm font-bold">MVP</span>
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/95 text-gold-400 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-gold-500/30">
                            Season {season}
                          </div>
                        </div>
                      ))}

                      {/* DPOY Trophies */}
                      {player.dpoySeasons.map((season, i) => (
                        <div key={`dpoy-${i}`} className="relative group flex flex-col items-center gap-1">
                          <img 
                            src="/trophies/dpoy.png" 
                            alt={`DPOY Season ${season}`}
                            className="w-12 h-12 object-contain hover:scale-110 transition-transform"
                          />
                          <span className="text-blue-400 text-xs font-bold">DPOY</span>
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/95 text-blue-400 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-blue-500/30">
                            Season {season}
                          </div>
                        </div>
                      ))}

                      {/* 6th Man Trophies */}
                      {player.sixthManSeasons.map((season, i) => (
                        <div key={`6moy-${i}`} className="relative group flex flex-col items-center gap-1">
                          <img 
                            src="/trophies/sixth-man.png" 
                            alt={`6MOY Season ${season}`}
                            className="w-12 h-12 object-contain hover:scale-110 transition-transform"
                          />
                          <span className="text-purple-400 text-xs font-bold">6MOY</span>
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/95 text-purple-400 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-purple-500/30">
                            Season {season}
                          </div>
                        </div>
                      ))}

                      {/* ROY Trophies */}
                      {player.roySeasons.map((season, i) => (
                        <div key={`roy-${i}`} className="relative group flex flex-col items-center gap-1">
                          <img 
                            src="/trophies/roy.png" 
                            alt={`ROY Season ${season}`}
                            className="w-12 h-12 object-contain hover:scale-110 transition-transform"
                          />
                          <span className="text-green-400 text-xs font-bold">ROY</span>
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/95 text-green-400 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-green-500/30">
                            Season {season}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Summary */}
        <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gold-900/20 to-black border border-gold-500/30 rounded-lg">
          <h3 className="text-2xl font-bold text-gold-400 mb-4 text-center">Trophy Case Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-black text-gold-400">{getAllPlayersSortedByAwards().length}</p>
              <p className="text-sm text-gray-400">Award Winners</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gold-400">
                {getAllPlayersSortedByAwards().reduce((sum, p) => sum + p.mvpSeasons.length, 0)}
              </p>
              <p className="text-sm text-gray-400">MVP Awards</p>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-400">
                {getAllPlayersSortedByAwards().reduce((sum, p) => sum + p.dpoySeasons.length, 0)}
              </p>
              <p className="text-sm text-gray-400">DPOY Awards</p>
            </div>
            <div>
              <p className="text-3xl font-black text-purple-400">
                {getAllPlayersSortedByAwards().reduce((sum, p) => sum + p.sixthManSeasons.length, 0)}
              </p>
              <p className="text-sm text-gray-400">6MOY Awards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete League History */}
      <section className="container py-12">
        <h2 className="text-4xl font-black text-gold-400 mb-8 text-center">
          📜 COMPLETE LEAGUE HISTORY
        </h2>

        <div className="max-w-6xl mx-auto space-y-4">
          {leagueHistory.map((season) => (
            <Card key={season.season} className="bg-gradient-to-br from-gray-900 to-black border border-gold-500/30 hover:border-gold-500/60 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gold-400">
                    Season {season.season}
                  </CardTitle>
                  <Trophy className="w-6 h-6 text-gold-400" />
                </div>
                <p className="text-white font-semibold mt-2">
                  🏆 Champion: {season.champion}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-black/40 rounded border border-gold-500/20">
                    <span className="text-gold-400 font-semibold">⭐ MVP:</span>
                    <span className="text-gray-300 ml-2">{season.mvp}</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded border border-blue-500/20">
                    <span className="text-blue-400 font-semibold">🛡️ DPOY:</span>
                    <span className="text-gray-300 ml-2">{season.dpoy}</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded border border-purple-500/20">
                    <span className="text-purple-400 font-semibold">🔧 6MOY:</span>
                    <span className="text-gray-300 ml-2">{season.sixthMan}</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded border border-green-500/20">
                    <span className="text-green-400 font-semibold">👶 ROY:</span>
                    <span className="text-gray-300 ml-2">{season.roy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Hall of Fame Basketball Association. All rights reserved.</p>
          <p className="mt-2">HoFSN - Your source for NBA 2K26 league coverage</p>
          <p className="mt-4 text-gold-400 font-semibold">Est. August 2023</p>
        </div>
      </footer>
    </div>
  );
}
