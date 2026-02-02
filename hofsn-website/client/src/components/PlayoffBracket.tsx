import { trpc } from "@/lib/trpc";
import { getTeamLogo } from "@/lib/playerImages";
import { Link } from "wouter";

const SEASON = "Season 17";

interface FirstRoundBoxProps {
  seed: number;
  team: string;
  score: number;
  isWinner: boolean;
}

const FirstRoundBox = ({ seed, team, score, isWinner }: FirstRoundBoxProps) => (
  <div className={`relative flex items-center gap-2 px-3 py-2.5 border-2 rounded-md ${
    isWinner 
      ? 'bg-gold-500/20 border-gold-500 shadow-lg shadow-gold-500/20' 
      : 'bg-gray-900/90 border-gold-500/40'
  }`}>
    <div className="w-7 h-7 rounded-full bg-gold-500/30 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-black text-gold-400">{seed}</span>
    </div>
    <img 
      src={getTeamLogo(team)} 
      alt={team}
      className="w-7 h-7 object-contain flex-shrink-0"
    />
    <span className={`text-sm font-black uppercase tracking-wide flex-1 ${
      isWinner ? 'text-gold-300' : 'text-white'
    }`}>
      {team.split(' ').slice(-1)[0]}
    </span>
    <span className="text-xl font-black text-gold-400 ml-2">{score}</span>
  </div>
);

interface AdvancementSlotProps {
  team?: string;
  seed?: number;
  isEmpty?: boolean;
}

const AdvancementSlot = ({ team, seed, isEmpty }: AdvancementSlotProps) => {
  if (isEmpty || !team) {
    return (
      <div className="h-16 border-2 border-gold-500/30 rounded-md bg-gradient-to-r from-blue-900/20 via-blue-800/30 to-blue-900/20" />
    );
  }
  
  return (
    <div className="h-16 flex items-center gap-2 px-4 border-2 border-gold-500 rounded-md bg-gradient-to-r from-gold-900/30 via-gold-800/40 to-gold-900/30 shadow-lg shadow-gold-500/20">
      <div className="w-8 h-8 rounded-full bg-gold-500/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-black text-gold-400">{seed}</span>
      </div>
      <img 
        src={getTeamLogo(team)} 
        alt={team}
        className="w-8 h-8 object-contain flex-shrink-0"
      />
      <span className="text-base font-black uppercase tracking-wide text-gold-300">
        {team.split(' ').slice(-1)[0]}
      </span>
    </div>
  );
};

export default function PlayoffBracket() {
  const { data: series = [] } = trpc.playoffs.getSeries.useQuery({ season: SEASON });

  // Split series into left (seeds 1-4) and right (seeds 5-8) brackets
  // Left bracket: #1 vs #16, #8 vs #9, #4 vs #13, #5 vs #12
  // Right bracket: #2 vs #15, #7 vs #10, #3 vs #14, #6 vs #11
  const leftBracket = series.filter(s => [1, 4, 5, 8].includes(s.seed1));
  const rightBracket = series.filter(s => [2, 3, 6, 7].includes(s.seed1));

  return (
    <Link href="/playoff-bracket">
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-gold-500/50 rounded-2xl p-6 md:p-10 hover:border-gold-500/70 transition-all cursor-pointer">
        
        {/* Main grid: Left bracket | Center | Right bracket */}
        <div className="relative grid grid-cols-[minmax(280px,1fr)_auto_minmax(280px,1fr)] gap-6 md:gap-12">
          
          {/* ========== LEFT BRACKET (Seeds 1-8) ========== */}
          <div className="space-y-6">
            {/* Top-left quadrant */}
            <div className="space-y-6">
              {/* Matchup: #1 vs #16 */}
              {leftBracket[0] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={leftBracket[0].seed1}
                      team={leftBracket[0].team1}
                      score={leftBracket[0].team1Wins}
                      isWinner={leftBracket[0].seriesWinner === leftBracket[0].team1}
                    />
                    <FirstRoundBox 
                      seed={leftBracket[0].seed2}
                      team={leftBracket[0].team2}
                      score={leftBracket[0].team2Wins}
                      isWinner={leftBracket[0].seriesWinner === leftBracket[0].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
              
              {/* Matchup: #8 vs #9 */}
              {leftBracket[1] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={leftBracket[1].seed1}
                      team={leftBracket[1].team1}
                      score={leftBracket[1].team1Wins}
                      isWinner={leftBracket[1].seriesWinner === leftBracket[1].team1}
                    />
                    <FirstRoundBox 
                      seed={leftBracket[1].seed2}
                      team={leftBracket[1].team2}
                      score={leftBracket[1].team2Wins}
                      isWinner={leftBracket[1].seriesWinner === leftBracket[1].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
            </div>

            {/* Semifinal advancement slot (top-left) */}
            <div className="relative ml-6">
              <AdvancementSlot 
                team={leftBracket[0]?.seriesWinner || leftBracket[1]?.seriesWinner || undefined}
                seed={leftBracket[0]?.seriesWinner === leftBracket[0]?.team1 ? leftBracket[0]?.seed1 : 
                      leftBracket[0]?.seriesWinner === leftBracket[0]?.team2 ? leftBracket[0]?.seed2 :
                      leftBracket[1]?.seriesWinner === leftBracket[1]?.team1 ? leftBracket[1]?.seed1 :
                      leftBracket[1]?.seriesWinner === leftBracket[1]?.team2 ? leftBracket[1]?.seed2 : undefined}
                isEmpty={!leftBracket[0]?.seriesWinner && !leftBracket[1]?.seriesWinner}
              />
            </div>

            {/* Bottom-left quadrant */}
            <div className="space-y-6">
              {/* Matchup: #4 vs #13 */}
              {leftBracket[2] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={leftBracket[2].seed1}
                      team={leftBracket[2].team1}
                      score={leftBracket[2].team1Wins}
                      isWinner={leftBracket[2].seriesWinner === leftBracket[2].team1}
                    />
                    <FirstRoundBox 
                      seed={leftBracket[2].seed2}
                      team={leftBracket[2].team2}
                      score={leftBracket[2].team2Wins}
                      isWinner={leftBracket[2].seriesWinner === leftBracket[2].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
              
              {/* Matchup: #5 vs #12 */}
              {leftBracket[3] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={leftBracket[3].seed1}
                      team={leftBracket[3].team1}
                      score={leftBracket[3].team1Wins}
                      isWinner={leftBracket[3].seriesWinner === leftBracket[3].team1}
                    />
                    <FirstRoundBox 
                      seed={leftBracket[3].seed2}
                      team={leftBracket[3].team2}
                      score={leftBracket[3].team2Wins}
                      isWinner={leftBracket[3].seriesWinner === leftBracket[3].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
            </div>

            {/* Semifinal advancement slot (bottom-left) */}
            <div className="relative ml-6">
              <AdvancementSlot 
                team={leftBracket[2]?.seriesWinner || leftBracket[3]?.seriesWinner || undefined}
                seed={leftBracket[2]?.seriesWinner === leftBracket[2]?.team1 ? leftBracket[2]?.seed1 : 
                      leftBracket[2]?.seriesWinner === leftBracket[2]?.team2 ? leftBracket[2]?.seed2 :
                      leftBracket[3]?.seriesWinner === leftBracket[3]?.team1 ? leftBracket[3]?.seed1 :
                      leftBracket[3]?.seriesWinner === leftBracket[3]?.team2 ? leftBracket[3]?.seed2 : undefined}
                isEmpty={!leftBracket[2]?.seriesWinner && !leftBracket[3]?.seriesWinner}
              />
            </div>
          </div>

          {/* ========== CENTER SECTION ========== */}
          <div className="flex flex-col items-center justify-center px-4 md:px-8">
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl lg:text-5xl font-black text-gold-400 tracking-wider">
                SZN 17
              </div>
              <div className="text-lg md:text-xl font-bold text-gold-400/80 tracking-wide">
                PLAYOFFS
              </div>
            </div>
          </div>

          {/* ========== RIGHT BRACKET (Seeds 9-16) ========== */}
          <div className="space-y-6">
            {/* Top-right quadrant */}
            <div className="space-y-6">
              {/* Matchup: #2 vs #15 */}
              {rightBracket[0] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={rightBracket[0].seed1}
                      team={rightBracket[0].team1}
                      score={rightBracket[0].team1Wins}
                      isWinner={rightBracket[0].seriesWinner === rightBracket[0].team1}
                    />
                    <FirstRoundBox 
                      seed={rightBracket[0].seed2}
                      team={rightBracket[0].team2}
                      score={rightBracket[0].team2Wins}
                      isWinner={rightBracket[0].seriesWinner === rightBracket[0].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -left-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
              
              {/* Matchup: #7 vs #10 */}
              {rightBracket[1] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={rightBracket[1].seed1}
                      team={rightBracket[1].team1}
                      score={rightBracket[1].team1Wins}
                      isWinner={rightBracket[1].seriesWinner === rightBracket[1].team1}
                    />
                    <FirstRoundBox 
                      seed={rightBracket[1].seed2}
                      team={rightBracket[1].team2}
                      score={rightBracket[1].team2Wins}
                      isWinner={rightBracket[1].seriesWinner === rightBracket[1].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -left-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
            </div>

            {/* Semifinal advancement slot (top-right) */}
            <div className="relative mr-6">
              <AdvancementSlot 
                team={rightBracket[0]?.seriesWinner || rightBracket[1]?.seriesWinner || undefined}
                seed={rightBracket[0]?.seriesWinner === rightBracket[0]?.team1 ? rightBracket[0]?.seed1 : 
                      rightBracket[0]?.seriesWinner === rightBracket[0]?.team2 ? rightBracket[0]?.seed2 :
                      rightBracket[1]?.seriesWinner === rightBracket[1]?.team1 ? rightBracket[1]?.seed1 :
                      rightBracket[1]?.seriesWinner === rightBracket[1]?.team2 ? rightBracket[1]?.seed2 : undefined}
                isEmpty={!rightBracket[0]?.seriesWinner && !rightBracket[1]?.seriesWinner}
              />
            </div>

            {/* Bottom-right quadrant */}
            <div className="space-y-6">
              {/* Matchup: #3 vs #14 */}
              {rightBracket[2] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={rightBracket[2].seed1}
                      team={rightBracket[2].team1}
                      score={rightBracket[2].team1Wins}
                      isWinner={rightBracket[2].seriesWinner === rightBracket[2].team1}
                    />
                    <FirstRoundBox 
                      seed={rightBracket[2].seed2}
                      team={rightBracket[2].team2}
                      score={rightBracket[2].team2Wins}
                      isWinner={rightBracket[2].seriesWinner === rightBracket[2].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -left-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
              
              {/* Matchup: #6 vs #11 */}
              {rightBracket[3] && (
                <div className="relative">
                  <div className="space-y-1.5">
                    <FirstRoundBox 
                      seed={rightBracket[3].seed1}
                      team={rightBracket[3].team1}
                      score={rightBracket[3].team1Wins}
                      isWinner={rightBracket[3].seriesWinner === rightBracket[3].team1}
                    />
                    <FirstRoundBox 
                      seed={rightBracket[3].seed2}
                      team={rightBracket[3].team2}
                      score={rightBracket[3].team2Wins}
                      isWinner={rightBracket[3].seriesWinner === rightBracket[3].team2}
                    />
                  </div>
                  {/* Connector to semifinal */}
                  <div className="absolute top-1/2 -left-6 w-6 h-0.5 bg-gold-500/60" />
                </div>
              )}
            </div>

            {/* Semifinal advancement slot (bottom-right) */}
            <div className="relative mr-6">
              <AdvancementSlot 
                team={rightBracket[2]?.seriesWinner || rightBracket[3]?.seriesWinner || undefined}
                seed={rightBracket[2]?.seriesWinner === rightBracket[2]?.team1 ? rightBracket[2]?.seed1 : 
                      rightBracket[2]?.seriesWinner === rightBracket[2]?.team2 ? rightBracket[2]?.seed2 :
                      rightBracket[3]?.seriesWinner === rightBracket[3]?.team1 ? rightBracket[3]?.seed1 :
                      rightBracket[3]?.seriesWinner === rightBracket[3]?.team2 ? rightBracket[3]?.seed2 : undefined}
                isEmpty={!rightBracket[2]?.seriesWinner && !rightBracket[3]?.seriesWinner}
              />
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-2 bg-gold-500/20 border border-gold-500/50 rounded-full">
            <span className="text-sm font-bold text-gold-400">
              FIRST ROUND: {series.filter(s => s.team1Wins > 0 || s.team2Wins > 0).length} of {series.length} series complete
            </span>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-6 text-center">
          <span className="text-gray-400 hover:text-gold-400 transition-colors text-sm font-medium">
            Click to view full bracket and track results →
          </span>
        </div>
      </div>
    </Link>
  );
}
