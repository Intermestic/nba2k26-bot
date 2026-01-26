import { useMemo, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Search, Filter, Shield, Check, History, ArrowLeftRight } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { FreeAgentBadge } from "@/components/FreeAgentBadge";
import { TeamLogoBadge } from "@/components/TeamLogoBadge";
import { getTeamLogo } from "@/lib/teamLogos";
import { TeamRosterSummary } from "@/components/TeamRosterSummary";
import { TeamSummariesTable } from "@/components/TeamSummariesTable";
import RosterCard from "@/components/RosterCard";
import { TeamAssignmentDialog } from "@/components/TeamAssignmentDialog";
import { PlayerUpgradeHistoryDialog } from "@/components/PlayerUpgradeHistoryDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  overall: number;
  team?: string | null;
  photoUrl?: string | null;
  playerPageUrl?: string | null;
  badgeCount?: number | null;
  salaryCap?: number | null;
  isRookie?: number;
  draftYear?: number | null;
  height?: string | null;
}

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading: authLoading, error, isAuthenticated, logout } = useAuth();
  const searchParams = useSearch();
  
  // Get team from URL query params if present
  const teamFromUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.get('team') || null;
  }, [searchParams]);

  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [selectedTeam, setSelectedTeam] = useState(teamFromUrl || "all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [showRosterCard, setShowRosterCard] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [playerForm, setPlayerForm] = useState({
    id: "",
    name: "",
    overall: 75,
    photoUrl: "",
    team: "",
    playerPageUrl: "",
  });

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

  // Fetch team coins (public read-only)
  const { data: teamCoins = [] } = trpc.coins.getTeamCoins.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
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
    const summaries = new Map<string, { playerCount: number; totalOverall: number; totalCap: number; coinsRemaining?: number; isFreeAgent?: boolean }>();
    
    players.forEach(player => {
      const team = player.team;
      if (!team || team === "Free Agents") return;
      
      const current = summaries.get(team) || { playerCount: 0, totalOverall: 0, totalCap: 0 };
      summaries.set(team, {
        playerCount: current.playerCount + 1,
        totalOverall: current.totalOverall + player.overall,
        totalCap: current.totalCap + (player.salaryCap || 0)
      });
    });
    
    // Merge with team coins data
    teamCoins.forEach((coinData: any) => {
      const existing = summaries.get(coinData.team);
      if (existing) {
        existing.coinsRemaining = coinData.coinsRemaining;
      } else {
        // Team has no players but has coins
        summaries.set(coinData.team, {
          playerCount: 0,
          totalOverall: 0,
          totalCap: 0,
          coinsRemaining: coinData.coinsRemaining
        });
      }
    });
    
    return Array.from(summaries.entries())
      .map(([team, data]) => ({ team, ...data }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [players, teamCoins]);

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

  // Selection handlers
  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPlayers(new Set(filteredPlayers.map(p => p.id)));
  };

  // Player edit/delete mutations
  const utils = trpc.useUtils();
  const updatePlayer = trpc.player.update.useMutation({
    onSuccess: () => {
      toast.success("Player updated successfully");
      utils.player.list.invalidate();
      setEditingPlayer(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update player: ${error.message}`);
    },
  });

  const deletePlayer = trpc.player.delete.useMutation({
    onSuccess: () => {
      toast.success("Player deleted successfully");
      utils.player.list.invalidate();
      setEditingPlayer(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete player: ${error.message}`);
    },
  });

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({
      id: player.id,
      name: player.name,
      overall: player.overall,
      photoUrl: player.photoUrl || "",
      team: player.team || "",
      playerPageUrl: player.playerPageUrl || "",
    });
  };

  const handleSavePlayer = () => {
    updatePlayer.mutate({
      id: playerForm.id,
      name: playerForm.name,
      overall: playerForm.overall,
      photoUrl: playerForm.photoUrl || null,
      team: playerForm.team || null,
      playerPageUrl: playerForm.playerPageUrl || null,
      badgeCount: null,
    });
  };

  const handleDeletePlayer = () => {
    if (editingPlayer && confirm(`Are you sure you want to delete ${editingPlayer.name}?`)) {
      deletePlayer.mutate({ id: editingPlayer.id });
    }
  };

  const clearSelection = () => {
    setSelectedPlayers(new Set());
  };

  const selectedPlayersList = players.filter(p => selectedPlayers.has(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-16 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Hall of Fame Basketball Association</h1>
                <p className="text-xl md:text-2xl font-semibold text-yellow-400 mt-1">SZN 17 Roster</p>
                <p className="text-slate-400 mt-2">Complete player database with ratings and photos</p>
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
              <Button asChild variant="outline" className="bg-green-900 border-green-700 hover:bg-green-800">
                <Link href="/trade-machine">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Trade Machine
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-purple-900 border-purple-700 hover:bg-purple-800">
                <a href="https://tinyurl.com/hof2ksn" target="_blank" rel="noopener noreferrer">
                  📺 HoFSN
                </a>
              </Button>

            </div>
          </div>
        </div>
      </header>

      {/* Stats - Admin Only */}
      {user?.role === 'admin' && (
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
        </div>
      )}

      {/* All Teams Overview Table */}
      <div className="container mx-auto px-4 py-8">
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
            <TeamRosterSummary
              team={selectedTeamSummary.team}
              playerCount={selectedTeamSummary.playerCount}
              totalOverall={selectedTeamSummary.totalOverall}
              isFreeAgent={selectedTeamSummary.isFreeAgent}
            />
          </div>
        )}

        {/* Selection Controls */}
        {selectedPlayers.size > 0 && (
          <div className="mb-4 flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-white">
              <span className="font-bold">{selectedPlayers.size}</span> player{selectedPlayers.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button
                onClick={clearSelection}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                Clear
              </Button>
              <Button
                onClick={() => setShowRosterCard(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Generate Roster Card
              </Button>
              {user?.role === 'admin' && (
                <Button
                  onClick={() => setShowTeamAssignment(true)}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Assign Team
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Player Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading players...</div>
        ) : (
          <div>
            {/* Select All Button */}
            <div className="mb-4 flex justify-end">
              <Button
                onClick={selectAll}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                <Check className="w-4 h-4 mr-2" />
                Select All ({filteredPlayers.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPlayers.map((player) => (
              <Card
                key={player.id}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors overflow-hidden group"
              >
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden flex items-center justify-center">
                    {/* Checkbox */}
                    <button
                      onClick={() => togglePlayer(player.id)}
                      className="absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 border-white bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      {selectedPlayers.has(player.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
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
                    {/* Rookie Badge */}
                    {player.isRookie === 1 && (
                      <div className="absolute top-14 right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-black px-2 py-1 rounded text-xs font-bold shadow-lg">
                        R
                      </div>
                    )}
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
                    <div className="flex gap-2 mt-2">
                      {player.playerPageUrl && (
                        <a
                          href={player.playerPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 inline-block"
                        >
                          View Details →
                        </a>
                      )}

                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleEditPlayer(player)}
                          className="text-xs text-green-400 hover:text-green-300 inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </div>
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

      {/* Roster Card Modal */}
      {showRosterCard && (
        <RosterCard
          players={selectedPlayersList}
          teamName={selectedTeam || 'Selected Players'}
          teamLogo={selectedTeam ? getTeamLogo(selectedTeam) || undefined : undefined}
          onClose={() => setShowRosterCard(false)}
        />
      )}

      {/* Team Assignment Dialog */}
      <TeamAssignmentDialog
        open={showTeamAssignment}
        onClose={() => setShowTeamAssignment(false)}
        selectedPlayerIds={Array.from(selectedPlayers)}
        players={players}
        onSuccess={() => {
          setSelectedPlayers(new Set());
          // Refetch players to show updated teams
        }}
      />

      {/* Edit Player Dialog */}
      <Dialog open={editingPlayer !== null} onOpenChange={(open) => {
        if (!open) setEditingPlayer(null);
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update player information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name" className="text-slate-300">Player Name *</Label>
              <Input
                id="edit-name"
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-overall" className="text-slate-300">Overall Rating *</Label>
              <Input
                id="edit-overall"
                type="number"
                min="0"
                max="99"
                value={playerForm.overall}
                onChange={(e) => setPlayerForm({ ...playerForm, overall: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-team" className="text-slate-300">Team</Label>
              <Select
                value={playerForm.team}
                onValueChange={(value) => setPlayerForm({ ...playerForm, team: value })}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[300px]">
                  <SelectItem value="Free Agents">Free Agents</SelectItem>
                  <SelectItem value="76ers">76ers</SelectItem>
                  <SelectItem value="Bucks">Bucks</SelectItem>
                  <SelectItem value="Bulls">Bulls</SelectItem>
                  <SelectItem value="Cavaliers">Cavaliers</SelectItem>
                  <SelectItem value="Celtics">Celtics</SelectItem>
                  <SelectItem value="Grizzlies">Grizzlies</SelectItem>
                  <SelectItem value="Hawks">Hawks</SelectItem>
                  <SelectItem value="Heat">Heat</SelectItem>
                  <SelectItem value="Hornets">Hornets</SelectItem>
                  <SelectItem value="Jazz">Jazz</SelectItem>
                  <SelectItem value="Kings">Kings</SelectItem>
                  <SelectItem value="Knicks">Knicks</SelectItem>
                  <SelectItem value="Lakers">Lakers</SelectItem>
                  <SelectItem value="Magic">Magic</SelectItem>
                  <SelectItem value="Mavs">Mavs</SelectItem>
                  <SelectItem value="Nets">Nets</SelectItem>
                  <SelectItem value="Nuggets">Nuggets</SelectItem>
                  <SelectItem value="Pacers">Pacers</SelectItem>
                  <SelectItem value="Pelicans">Pelicans</SelectItem>
                  <SelectItem value="Pistons">Pistons</SelectItem>
                  <SelectItem value="Raptors">Raptors</SelectItem>
                  <SelectItem value="Rockets">Rockets</SelectItem>
                  <SelectItem value="Spurs">Spurs</SelectItem>
                  <SelectItem value="Suns">Suns</SelectItem>
                  <SelectItem value="Timberwolves">Timberwolves</SelectItem>
                  <SelectItem value="Trailblazers">Trailblazers</SelectItem>
                  <SelectItem value="Warriors">Warriors</SelectItem>
                  <SelectItem value="Wizards">Wizards</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-photoUrl" className="text-slate-300">Photo URL</Label>
              <Input
                id="edit-photoUrl"
                value={playerForm.photoUrl}
                onChange={(e) => setPlayerForm({ ...playerForm, photoUrl: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="edit-playerPageUrl" className="text-slate-300">2KRatings Player Page URL</Label>
              <Input
                id="edit-playerPageUrl"
                value={playerForm.playerPageUrl}
                onChange={(e) => setPlayerForm({ ...playerForm, playerPageUrl: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="https://www.2kratings.com/..."
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDeletePlayer}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditingPlayer(null)}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePlayer}
              disabled={!playerForm.name || playerForm.overall < 0 || playerForm.overall > 99}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



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
