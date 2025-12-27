import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Shield, Plus, Pencil, Trash2, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Player {
  id: string;
  name: string;
  overall: number;
  team?: string | null;
  photoUrl?: string | null;
  playerPageUrl?: string | null;
}

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [filterMissingPhotos, setFilterMissingPhotos] = useState(false);
  const [filterMissing2kRatings, setFilterMissing2kRatings] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerForm, setPlayerForm] = useState({
    id: "",
    name: "",
    overall: 75,
    team: "",
    photoUrl: "",
    playerPageUrl: "",
    badgeCount: null as number | null,
  });

  // Redirect if not admin
  if (isAuthenticated && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Fetch all players
  const { data: players = [], isLoading } = trpc.player.list.useQuery({
    limit: 1000,
  });

  // Get unique teams for dropdown
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

  // Sort players alphabetically and filter by search and team
  const sortedPlayers = useMemo(() => {
    return players
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTeam = selectedTeam === "all" || p.team === selectedTeam;
        const matchesMissingPhoto = !filterMissingPhotos || !p.photoUrl || p.photoUrl.trim() === "";
        const matchesMissing2kRatings = !filterMissing2kRatings || !p.playerPageUrl || p.playerPageUrl.trim() === "";
        return matchesSearch && matchesTeam && matchesMissingPhoto && matchesMissing2kRatings;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, searchTerm, selectedTeam, filterMissingPhotos, filterMissing2kRatings]);

  // Mutation to update player team
  const utils = trpc.useUtils();
  const updateTeam = trpc.player.updateTeam.useMutation({
    onSuccess: () => {
      toast.success("Player team updated successfully");
      utils.player.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update team: ${error.message}`);
    },
  });

  const handleTeamChange = (playerId: string, newTeam: string) => {
    updateTeam.mutate({ playerId, team: newTeam });
  };

  // Create player mutation
  const createPlayer = trpc.player.create.useMutation({
    onSuccess: () => {
      toast.success("Player created successfully");
      utils.player.list.invalidate();
      setShowAddPlayer(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create player: ${error.message}`);
    },
  });

  // Update player mutation
  const updatePlayer = trpc.player.update.useMutation({
    onSuccess: () => {
      toast.success("Player updated successfully");
      utils.player.list.invalidate();
      setEditingPlayer(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to update player: ${error.message}`);
    },
  });

  // Delete player mutation
  const deletePlayer = trpc.player.delete.useMutation({
    onSuccess: () => {
      toast.success("Player deleted successfully");
      utils.player.list.invalidate();
      setEditingPlayer(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete player: ${error.message}`);
    },
  });

  const resetForm = () => {
    setPlayerForm({
      id: "",
      name: "",
      overall: 75,
      team: "",
      photoUrl: "",
      playerPageUrl: "",
      badgeCount: null,
    });
  };

  const handleAddPlayer = () => {
    setShowAddPlayer(true);
    resetForm();
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({
      id: player.id,
      name: player.name,
      overall: player.overall,
      team: player.team || "",
      photoUrl: player.photoUrl || "",
      playerPageUrl: "",
      badgeCount: null,
    });
  };

  const handleSavePlayer = () => {
    if (editingPlayer) {
      updatePlayer.mutate({
        id: playerForm.id,
        name: playerForm.name,
        overall: playerForm.overall,
        photoUrl: playerForm.photoUrl || null,
        playerPageUrl: playerForm.playerPageUrl || null,
        badgeCount: playerForm.badgeCount,
      });
    } else {
      createPlayer.mutate({
        id: playerForm.id || `player-${Date.now()}`,
        name: playerForm.name,
        overall: playerForm.overall,
        team: playerForm.team,
        photoUrl: playerForm.photoUrl || null,
        playerPageUrl: playerForm.playerPageUrl || null,
        nbaId: null,
        source: "manual",
        badgeCount: playerForm.badgeCount,
      });
    }
  };

  const handleDeletePlayer = () => {
    if (editingPlayer && confirm(`Are you sure you want to delete ${editingPlayer.name}?`)) {
      deletePlayer.mutate({ id: editingPlayer.id });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-slate-400 mb-4">You must be logged in as an admin to access this page.</p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-12 md:h-16 w-auto" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">Team Management</h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1">Assign players to teams</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/transactions">
                  Bulk Transactions
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/history">
                  History
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/discord">
                  Discord
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/fa-management">
                  FA Management
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/match-logs">
                  Match Logs
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/bot-management">
                  Bot Config
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-green-900 border-green-700 hover:bg-green-800">
                <a href="/players.csv" download>
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/">
                  Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="w-full sm:w-[250px]">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by team" />
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
          
          {/* Data Quality Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterMissingPhotos ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMissingPhotos(!filterMissingPhotos)}
              className={filterMissingPhotos ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 border-slate-700 hover:bg-slate-700"}
            >
              Missing Photos
            </Button>
            <Button
              variant={filterMissing2kRatings ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMissing2kRatings(!filterMissing2kRatings)}
              className={filterMissing2kRatings ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 border-slate-700 hover:bg-slate-700"}
            >
              Missing 2KRatings Links
            </Button>
            {(filterMissingPhotos || filterMissing2kRatings) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterMissingPhotos(false);
                  setFilterMissing2kRatings(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Players Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                All Players ({sortedPlayers.length})
              </CardTitle>
              <Button onClick={handleAddPlayer} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading players...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Player Name</TableHead>
                      <TableHead className="text-slate-300 text-center hidden sm:table-cell">Overall</TableHead>
                      <TableHead className="text-slate-300">Team</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPlayers.map((player) => (
                      <TableRow 
                        key={player.id}
                        className="border-slate-700 hover:bg-slate-800/70"
                      >
                        <TableCell className="font-medium text-white">
                          <div>
                            <div>{player.name}</div>
                            <div className="text-xs text-slate-400 sm:hidden">OVR: {player.overall}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-slate-300 hidden sm:table-cell">
                          {player.overall}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={player.team || ""}
                            onValueChange={(value) => handleTeamChange(player.id, value)}
                          >
                            <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white text-sm">
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                              {teams.map((team) => (
                                <SelectItem key={team} value={team as string}>
                                  {team}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditPlayer(player)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Player Dialog */}
      <Dialog open={showAddPlayer || editingPlayer !== null} onOpenChange={(open) => {
        if (!open) {
          setShowAddPlayer(false);
          setEditingPlayer(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingPlayer ? "Update player information" : "Create a new player entry"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Player Name *</Label>
              <Input
                id="name"
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="LeBron James"
              />
            </div>
            <div>
              <Label htmlFor="overall" className="text-slate-300">Overall Rating *</Label>
              <Input
                id="overall"
                type="number"
                min="0"
                max="99"
                value={playerForm.overall}
                onChange={(e) => setPlayerForm({ ...playerForm, overall: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            {!editingPlayer && (
              <div>
                <Label htmlFor="team" className="text-slate-300">Team</Label>
                <Select value={playerForm.team} onValueChange={(value) => setPlayerForm({ ...playerForm, team: value })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                    {teams.map((team) => (
                      <SelectItem key={team} value={team as string}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="photoUrl" className="text-slate-300">Photo URL</Label>
              <Input
                id="photoUrl"
                value={playerForm.photoUrl}
                onChange={(e) => setPlayerForm({ ...playerForm, photoUrl: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingPlayer && (
              <Button
                variant="destructive"
                onClick={handleDeletePlayer}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowAddPlayer(false);
                setEditingPlayer(null);
                resetForm();
              }}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePlayer}
              disabled={!playerForm.name || playerForm.overall < 0 || playerForm.overall > 99}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingPlayer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
