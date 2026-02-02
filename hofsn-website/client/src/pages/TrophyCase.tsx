import { Link } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { useEffect } from "react";
import { getAllPlayersSortedByAwards } from "@/data/comprehensiveTrophyCase";
import { getPlayerHeadshot } from "@/lib/playerImages";

export default function TrophyCase() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const allPlayers = getAllPlayersSortedByAwards();

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
                TROPHY CASE
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Trophy Case Hero */}
      <section className="container py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-gold-400" />
            <h2 className="text-4xl font-black text-gold-400">HALL OF LEGENDS</h2>
            <Trophy className="w-12 h-12 text-gold-400" />
          </div>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Every award. Every champion. Every legend who left their mark on the Hall of Fame Basketball Association.
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
        <div className="max-w-6xl mx-auto space-y-4">
          {allPlayers.map((player, idx) => {
            const totalAwards = player.mvpSeasons.length + player.dpoySeasons.length + 
                               player.sixthManSeasons.length + player.roySeasons.length;
            
            return (
              <div 
                key={idx}
                className="bg-gradient-to-r from-black/80 via-gray-900/60 to-black/80 border border-gold-500/20 rounded-lg p-4 hover:border-gold-500/40 transition-all"
              >
                <div className="flex items-center gap-6">
                  {/* Player Info */}
                  <div className="flex items-center gap-4 min-w-[280px]">
                    <img 
                      src={getPlayerHeadshot(player.playerName)} 
                      alt={player.playerName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gold-500/50"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/64x64/1f2937/fbbf24?text=Player";
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white">{player.playerName}</h3>
                      <p className="text-sm text-gray-400">{totalAwards} Total Award{totalAwards !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Trophy Display */}
                  <div className="flex-1 flex items-center gap-3 flex-wrap">
                    {/* MVP Trophies */}
                    {player.mvpSeasons.map((season, i) => (
                      <div key={`mvp-${i}`} className="relative group">
                        <img 
                          src="/trophies/mvp.png" 
                          alt={`MVP Season ${season}`}
                          className="w-10 h-10 object-contain hover:scale-110 transition-transform"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 text-gold-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          MVP S{season}
                        </div>
                      </div>
                    ))}

                    {/* DPOY Trophies */}
                    {player.dpoySeasons.map((season, i) => (
                      <div key={`dpoy-${i}`} className="relative group">
                        <img 
                          src="/trophies/dpoy.png" 
                          alt={`DPOY Season ${season}`}
                          className="w-10 h-10 object-contain hover:scale-110 transition-transform"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 text-blue-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          DPOY S{season}
                        </div>
                      </div>
                    ))}

                    {/* 6th Man Trophies */}
                    {player.sixthManSeasons.map((season, i) => (
                      <div key={`6moy-${i}`} className="relative group">
                        <img 
                          src="/trophies/sixth-man.png" 
                          alt={`6MOY Season ${season}`}
                          className="w-10 h-10 object-contain hover:scale-110 transition-transform"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 text-purple-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          6MOY S{season}
                        </div>
                      </div>
                    ))}

                    {/* ROY Trophies */}
                    {player.roySeasons.map((season, i) => (
                      <div key={`roy-${i}`} className="relative group">
                        <img 
                          src="/trophies/roy.png" 
                          alt={`ROY Season ${season}`}
                          className="w-10 h-10 object-contain hover:scale-110 transition-transform"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 text-green-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ROY S{season}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Summary */}
        <div className="max-w-4xl mx-auto mt-12 p-6 bg-gradient-to-br from-gold-900/20 to-black border border-gold-500/30 rounded-lg">
          <h3 className="text-2xl font-bold text-gold-400 mb-4 text-center">Trophy Case Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-black text-gold-400">{allPlayers.length}</p>
              <p className="text-sm text-gray-400">Award Winners</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gold-400">
                {allPlayers.reduce((sum, p) => sum + p.mvpSeasons.length, 0)}
              </p>
              <p className="text-sm text-gray-400">MVP Awards</p>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-400">
                {allPlayers.reduce((sum, p) => sum + p.dpoySeasons.length, 0)}
              </p>
              <p className="text-sm text-gray-400">DPOY Awards</p>
            </div>
            <div>
              <p className="text-3xl font-black text-purple-400">
                {allPlayers.reduce((sum, p) => sum + p.sixthManSeasons.length, 0)}
              </p>
              <p className="text-sm text-gray-400">6MOY Awards</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
