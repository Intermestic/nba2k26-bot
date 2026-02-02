import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Home } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getTeamLogo } from "@/lib/playerImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SEASON = "Season 17";

export default function PlayoffBracketPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: series = [], refetch: refetchSeries } = trpc.playoffs.getSeries.useQuery({ season: SEASON });
  const { data: games = [], refetch: refetchGames } = trpc.playoffs.getGames.useQuery({ season: SEASON });

  const initializePlayoffs = trpc.playoffs.initializeFirstRound.useMutation({
    onSuccess: () => {
      toast.success("Playoffs initialized!");
      refetchSeries();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const addGameMutation = trpc.playoffs.addGame.useMutation({
    onSuccess: () => {
      toast.success("Game added successfully!");
      refetchSeries();
      refetchGames();
      // Reset form
      setSelectedMatchup("");
      setGameNumber(1);
      setTeam1Score("");
      setTeam2Score("");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Form state
  const [selectedMatchup, setSelectedMatchup] = useState("");
  const [gameNumber, setGameNumber] = useState(1);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");

  const handleInitialize = () => {
    const teams = [
      { seed: 1, name: "Toronto Raptors" },
      { seed: 2, name: "Atlanta Hawks" },
      { seed: 3, name: "Sacramento Kings" },
      { seed: 4, name: "Washington Wizards" },
      { seed: 5, name: "Houston Rockets" },
      { seed: 6, name: "Detroit Pistons" },
      { seed: 7, name: "Denver Nuggets" },
      { seed: 8, name: "San Antonio Spurs" },
      { seed: 9, name: "Milwaukee Bucks" },
      { seed: 10, name: "Utah Jazz" },
      { seed: 11, name: "Dallas Mavericks" },
      { seed: 12, name: "Cleveland Cavaliers" },
      { seed: 13, name: "Portland Trail Blazers" },
      { seed: 14, name: "Chicago Bulls" },
      { seed: 15, name: "Charlotte Hornets" },
      { seed: 16, name: "Indiana Pacers" }
    ];
    initializePlayoffs.mutate({ season: SEASON, teams });
  };

  const handleAddGame = () => {
    if (!selectedMatchup || !team1Score || !team2Score) {
      toast.error("Please fill in all fields");
      return;
    }

    const matchup = series.find(s => s.matchupId === selectedMatchup);
    if (!matchup) {
      toast.error("Invalid matchup selected");
      return;
    }

    // Team1 is always the higher seed, team2 is the lower seed
    addGameMutation.mutate({
      season: SEASON,
      round: matchup.round,
      matchupId: selectedMatchup,
      gameNumber,
      homeTeam: matchup.team1,
      awayTeam: matchup.team2,
      homeScore: parseInt(team1Score),
      awayScore: parseInt(team2Score)
    });
  };

  // Group series by round
  const firstRound = series.filter(s => s.round === "first");
  const secondRound = series.filter(s => s.round === "second");
  const leftBracket = firstRound.filter((_, idx) => idx < 4);
  const rightBracket = firstRound.filter((_, idx) => idx >= 4);
  const secondLeftBracket = secondRound.filter((_, idx) => idx < 2);
  const secondRightBracket = secondRound.filter((_, idx) => idx >= 2);

  // Matchup component with NBA 2K26 style
  const MatchupCard = ({ matchup, position }: { matchup: any; position: "left" | "right" }) => {
    const winner = matchup.seriesWinner;
    const team1Won = winner === matchup.team1;
    const team2Won = winner === matchup.team2;

    return (
      <div className="relative">
        {/* Matchup container */}
        <div className="flex flex-col gap-1 bg-card/50 border-2 border-gold-500/30 rounded-lg overflow-hidden">
          {/* Team 1 */}
          <div className={`flex items-center justify-between p-3 transition-colors ${
            team1Won ? 'bg-gold-500/20' : team2Won ? 'bg-muted/30' : 'bg-card'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-400">
                {matchup.seed1}
              </div>
              <img src={getTeamLogo(matchup.team1)} alt={matchup.team1} className="w-6 h-6 flex-shrink-0" />
              <span className="font-bold text-sm truncate">{matchup.team1.split(' ').pop()}</span>
              {team1Won && <span className="text-xs text-gold-400">▲</span>}
            </div>
            <div className="text-xl font-black text-gold-400 ml-2">{matchup.team1Wins}</div>
          </div>

          {/* Team 2 */}
          <div className={`flex items-center justify-between p-3 transition-colors ${
            team2Won ? 'bg-gold-500/20' : team1Won ? 'bg-muted/30' : 'bg-card'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-400">
                {matchup.seed2}
              </div>
              <img src={getTeamLogo(matchup.team2)} alt={matchup.team2} className="w-6 h-6 flex-shrink-0" />
              <span className="font-bold text-sm truncate">{matchup.team2.split(' ').pop()}</span>
              {team2Won && <span className="text-xs text-gold-400">▲</span>}
            </div>
            <div className="text-xl font-black text-gold-400 ml-2">{matchup.team2Wins}</div>
          </div>
        </div>

        {/* Connector line to next round */}
        {winner && (
          <div className={`absolute top-1/2 -translate-y-1/2 w-8 h-0.5 bg-gold-500/50 ${
            position === "left" ? "right-0 translate-x-full" : "left-0 -translate-x-full"
          }`} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gold-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container py-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-400 hover:text-gold-400 transition-colors mb-4">
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </Link>
          
          {/* Title with logo */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-black text-gold-400 mb-2" style={{
                textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)'
              }}>
                SZN 17 PLAYOFFS
              </h1>
              <p className="text-gray-400 text-lg">The road to the championship</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* Admin Controls */}
        {isAdmin && (
          <Card className="mb-8 bg-card/50 border-gold-500/30">
            <CardHeader>
              <CardTitle className="text-gold-400">Admin Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Initialize Button */}
              {series.length === 0 && (
                <div>
                  <Button 
                    onClick={handleInitialize} 
                    disabled={initializePlayoffs.isPending}
                    className="bg-gold-500 hover:bg-gold-600 text-black font-bold"
                  >
                    {initializePlayoffs.isPending ? "Initializing..." : "Initialize First Round"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will create all first-round matchups based on final standings
                  </p>
                </div>
              )}

              {/* Add Game Form */}
              {series.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-gold-400">Add Game Result</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="matchup">Matchup</Label>
                      <Select value={selectedMatchup} onValueChange={setSelectedMatchup}>
                        <SelectTrigger id="matchup">
                          <SelectValue placeholder="Select matchup" />
                        </SelectTrigger>
                        <SelectContent>
                          {series.filter(s => !s.isComplete).map(s => (
                            <SelectItem key={s.matchupId} value={s.matchupId}>
                              #{s.seed1} {s.team1} vs #{s.seed2} {s.team2} ({s.team1Wins}-{s.team2Wins})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="gameNumber">Game Number</Label>
                      <Input
                        id="gameNumber"
                        type="number"
                        min="1"
                        max="7"
                        value={gameNumber}
                        onChange={(e) => setGameNumber(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="team1Score">
                        {selectedMatchup ? 
                          `${series.find(s => s.matchupId === selectedMatchup)?.team1 || 'Team 1'} Score` : 
                          'Higher Seed Score'
                        }
                      </Label>
                      <Input
                        id="team1Score"
                        type="number"
                        min="0"
                        value={team1Score}
                        onChange={(e) => setTeam1Score(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="team2Score">
                        {selectedMatchup ? 
                          `${series.find(s => s.matchupId === selectedMatchup)?.team2 || 'Team 2'} Score` : 
                          'Lower Seed Score'
                        }
                      </Label>
                      <Input
                        id="team2Score"
                        type="number"
                        min="0"
                        value={team2Score}
                        onChange={(e) => setTeam2Score(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleAddGame} 
                    disabled={addGameMutation.isPending}
                    className="bg-gold-500 hover:bg-gold-600 text-black font-bold"
                  >
                    {addGameMutation.isPending ? "Adding..." : "Add Game"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bracket Display */}
        {series.length > 0 ? (
          <div className="relative">
            {/* Bracket container with NBA 2K26 style */}
            <div className="relative bg-gradient-to-br from-blue-950/30 via-blue-900/20 to-blue-950/30 border-2 border-gold-500/30 rounded-2xl p-8 md:p-12">
              
              {/* Center text only - logos already in header */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="text-center">
                  <div className="text-gold-400 font-black text-3xl md:text-4xl">SZN 17</div>
                  <div className="text-gold-400/80 font-bold text-lg md:text-xl">PLAYOFFS</div>
                </div>
              </div>

              {/* Bracket grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
                {/* Left side - First round */}
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gold-400 text-center mb-6">FIRST ROUND</h2>
                  {leftBracket.map((matchup, idx) => (
                    <MatchupCard key={matchup.matchupId} matchup={matchup} position="left" />
                  ))}
                </div>

                {/* Left side - Second round */}
                <div className="space-y-6 lg:mt-16">
                  <h2 className="text-xl font-black text-gold-400 text-center mb-6">SECOND ROUND</h2>
                  {secondLeftBracket.map((matchup, idx) => (
                    <div key={matchup.matchupId} className="mb-24">
                      <MatchupCard matchup={matchup} position="left" />
                    </div>
                  ))}
                </div>

                {/* Right side - Second round */}
                <div className="space-y-6 lg:mt-16">
                  <h2 className="text-xl font-black text-gold-400 text-center mb-6">SECOND ROUND</h2>
                  {secondRightBracket.map((matchup, idx) => (
                    <div key={matchup.matchupId} className="mb-24">
                      <MatchupCard matchup={matchup} position="right" />
                    </div>
                  ))}
                </div>

                {/* Right side - First round */}
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gold-400 text-center mb-6">FIRST ROUND</h2>
                  {rightBracket.map((matchup, idx) => (
                    <MatchupCard key={matchup.matchupId} matchup={matchup} position="right" />
                  ))}
                </div>
              </div>

              {/* Series status text at bottom */}
              <div className="mt-12 text-center space-y-3">
                {firstRound.length > 0 && (
                  <div className="inline-block bg-black/60 border border-gold-500/30 rounded-lg px-6 py-3 mr-4">
                    <p className="text-gold-400 font-bold">
                      FIRST ROUND: {firstRound.filter(s => s.isComplete).length} of {firstRound.length} series complete
                    </p>
                  </div>
                )}
                {secondRound.length > 0 && (
                  <div className="inline-block bg-black/60 border border-gold-500/30 rounded-lg px-6 py-3">
                    <p className="text-gold-400 font-bold">
                      SECOND ROUND: {secondRound.filter(s => s.isComplete).length} of {secondRound.length} series complete
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* HoFSN branding */}
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Presented by <span className="text-gold-400 font-bold">HoFSN</span> - Hall of Fame Sports Network
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block bg-card/50 border-2 border-gold-500/30 rounded-lg px-8 py-6">
              <p className="text-gray-400 text-lg">
                {isAdmin ? "Click 'Initialize First Round' to create the playoff bracket" : "Playoff bracket coming soon"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
