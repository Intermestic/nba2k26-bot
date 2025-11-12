import { useMemo, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Search, Filter, Shield, Camera, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { FreeAgentBadge } from "@/components/FreeAgentBadge";
import { TeamLogoBadge } from "@/components/TeamLogoBadge";
import { TeamRosterSummary } from "@/components/TeamRosterSummary";
import { TeamSummariesTable } from "@/components/TeamSummariesTable";

interface Player {
  id: string;
  name: string;
  overall: number;
  team?: string | null;
  photoUrl?: string | null;
  playerPageUrl?: string | null;
  badgeCount?: number | null;
  salaryCap?: number | null;
}

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading: authLoading, error, isAuthenticated, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const rosterRef = useRef<HTMLDivElement>(null);

  // Normalize name for fuzzy search (remove special chars, lowercase)
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars (hyphens, apostrophes, etc)
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Fetch players from database API
  const { data: players = [], isLoading: loading } = trpc.player.list.useQuery({
    limit: 1000,
  });

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const normalizedPlayerName = normalizeName(p.name);
        const normalizedSearch = normalizeName(searchTerm);
        const matchesSearch = normalizedPlayerName.includes(normalizedSearch);
        const matchesRating = p.overall >= parseInt(minRating);
        const matchesTeam = selectedTeam === "all" || p.team === selectedTeam;
        return matchesSearch && matchesRating && matchesTeam;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [players, searchTerm, minRating, selectedTeam]);

  // Autocomplete suggestions (top 10 matches)
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const normalizedSearch = normalizeName(searchTerm);
    return players
      .filter((p) => normalizeName(p.name).includes(normalizedSearch))
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 10);
  }, [players, searchTerm]);

  // Get unique teams for filter (Free Agents at the end)
  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set(players.map(p => p.team).filter(Boolean)));
    const sorted = uniqueTeams.sort();
    // Move "Free Agents" to the end
    const freeAgentIndex = sorted.indexOf("Free Agents");
    if (freeAgentIndex > -1) {
      sorted.splice(freeAgentIndex, 1);
      sorted.push("Free Agents");
    }
    return sorted;
  }, [players]);

  const stats = useMemo(() => {
    const withPhotos = players.filter((p) => p.photoUrl).length;
    const avgRating = players.length > 0 ? players.reduce((sum, p) => sum + p.overall, 0) / players.length : 0;
    return {
      total: players.length,
      withPhotos,
      photoPercent: players.length > 0 ? ((withPhotos / players.length) * 100).toFixed(1) : "0.0",
      avgRating: avgRating.toFixed(1),
    };
  }, [players]);

  // Calculate team roster summaries (only for NBA teams, not Free Agents)
  const teamSummaries = useMemo(() => {
    const summaries = new Map<string, { playerCount: number; totalOverall: number; isFreeAgent?: boolean }>();
    
    players.forEach(player => {
      const team = player.team;
      if (!team || team === "Free Agents") return;
      
      const current = summaries.get(team) || { playerCount: 0, totalOverall: 0 };
      summaries.set(team, {
        playerCount: current.playerCount + 1,
        totalOverall: current.totalOverall + player.overall
      });
    });
    
    return Array.from(summaries.entries())
      .map(([team, data]) => ({ team, ...data }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [players]);

  // Get Free Agents count
  const freeAgentCount = useMemo(() => {
    return players.filter(p => p.team === "Free Agents").length;
  }, [players]);

  // Show team summary when a specific team is selected
  const selectedTeamSummary = useMemo(() => {
    if (selectedTeam === "all") return null;
    if (selectedTeam === "Free Agents") {
      return { team: "Free Agents", playerCount: freeAgentCount, totalOverall: 0, isFreeAgent: true };
    }
    return teamSummaries.find(t => t.team === selectedTeam);
  }, [selectedTeam, teamSummaries, freeAgentCount]);

  // Screenshot functionality
  const captureRoster = async (): Promise<Blob | null> => {
    if (!rosterRef.current) return null;
    
    try {
      const canvas = await html2canvas(rosterRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } catch (error) {
      console.error('Screenshot failed:', error);
      return null;
    }
  };

  const handleScreenshot = async () => {
    setIsCapturing(true);
    const blob = await captureRoster();
    setIsCapturing(false);
    
    if (!blob) return;
    
    const link = document.createElement('a');
    link.download = `${selectedTeam}-roster.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback to download if share API not available
      handleScreenshot();
      return;
    }
    
    setIsCapturing(true);
    const blob = await captureRoster();
    setIsCapturing(false);
    
    if (!blob) return;
    
    try {
      const file = new File([blob], `${selectedTeam}-roster.png`, { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: `${selectedTeam} Roster`,
        text: `Check out the ${selectedTeam} roster!`,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-16 md:h-20 w-auto" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Hall of Fame Basketball Association - SZN 17 Roster</h1>
                <p className="text-slate-400 mt-1">Complete player database with ratings and photos</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <Button asChild variant="outline" className="bg-blue-900 border-blue-700 hover:bg-blue-800">
                      <Link href="/admin">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button onClick={logout} variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                    Logout
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                  <a href={getLoginUrl()}>
                    Login
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <a href="/players.csv" download>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </a>
              </Button>
              <Button asChild variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <a href="/players.json" download>
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Players</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.photoPercent}%</div>
              <div className="text-sm text-slate-400">With Photos</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.avgRating}</div>
              <div className="text-sm text-slate-400">Avg Rating</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{filteredPlayers.length}</div>
              <div className="text-sm text-slate-400">Filtered</div>
            </CardContent>
          </Card>
        </div>

        {/* All Teams Overview Table */}
        <div className="mb-8">
          <TeamSummariesTable 
            summaries={teamSummaries} 
            onTeamClick={(team) => setSelectedTeam(team)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                {suggestions.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSearchTerm(player.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors text-left"
                  >
                    {player.photoUrl && player.photoUrl.includes('cdn.nba.com') ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">
                        {player.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-white font-medium">{player.name}</div>
                    </div>
                    <div className="text-slate-400 font-bold">{player.overall}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="0">All Ratings</SelectItem>
                <SelectItem value="90">90+ Elite</SelectItem>
                <SelectItem value="85">85+ All-Star</SelectItem>
                <SelectItem value="80">80+ Starter</SelectItem>
                <SelectItem value="75">75+ Rotation</SelectItem>
                <SelectItem value="70">70+ Bench</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team} value={team as string}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team Roster Summary (shown when filtering by team) */}
        {selectedTeamSummary && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <TeamRosterSummary
                team={selectedTeamSummary.team}
                playerCount={selectedTeamSummary.playerCount}
                totalOverall={selectedTeamSummary.totalOverall}
                isFreeAgent={selectedTeamSummary.isFreeAgent}
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleShare}
                  disabled={isCapturing}
                  variant="outline"
                  size="sm"
                  className="bg-blue-900 border-blue-700 hover:bg-blue-800 flex-1 sm:flex-none"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {isCapturing ? "Capturing..." : "Share"}
                </Button>
                <Button
                  onClick={handleScreenshot}
                  disabled={isCapturing}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700 flex-1 sm:flex-none"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isCapturing ? "Capturing..." : "Download"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Player Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading players...</div>
        ) : (
          <div ref={rosterRef}>
            {/* Screenshot Header (only visible in screenshots when team is selected) */}
            {selectedTeam !== "all" && (
              <div className="bg-slate-800/90 rounded-lg p-6 mb-6 flex items-center gap-4">
                {selectedTeam !== "Free Agents" && (
                  <TeamLogoBadge team={selectedTeam} size="xl" className="!w-16 !h-16" />
                )}
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedTeam}</h2>
                  <p className="text-slate-400 mt-1">
                    {selectedTeamSummary?.playerCount} Players
                    {!selectedTeamSummary?.isFreeAgent && ` • Total Overall: ${selectedTeamSummary?.totalOverall}`}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPlayers.map((player) => (
              <Card
                key={player.id}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors overflow-hidden group"
              >
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden flex items-center justify-center">
                    <PlayerAvatar 
                      name={player.name}
                      photoUrl={player.photoUrl}
                      team={player.team || "Free Agents"}
                      size="lg"
                      className="w-full h-full rounded-none group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-bold">
                      {player.overall}
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <TeamLogoBadge team={player.team} size="xl" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 flex-1">{player.name}</h3>
                      <FreeAgentBadge team={player.team || ""} className="text-xs shrink-0" />
                    </div>
                    {player.team && player.team !== "Free Agents" && (
                      <p className="text-xs text-slate-400 mt-1">{player.team}</p>
                    )}
                    {player.playerPageUrl && (
                      <a
                        href={player.playerPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        )}

        {filteredPlayers.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">No players found matching your criteria.</div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>
            HoF NBA 2K26 Player Database • {stats.total} Players • {stats.photoPercent}% Photo Coverage
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Database: {stats.total} players | Photos: {stats.photoPercent}% | Avg Rating: {stats.avgRating}
          </p>
          <p className="mt-2">
            Data from{" "}
            <a href="https://www.2kratings.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              2K Ratings
            </a>{" "}
            • Photos from{" "}
            <a href="https://www.nba.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              NBA.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
