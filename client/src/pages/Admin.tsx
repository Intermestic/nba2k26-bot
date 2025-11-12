import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  overall: number;
  team?: string | null;
  photoUrl?: string | null;
}

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Sort players alphabetically and filter by search
  const sortedPlayers = useMemo(() => {
    return players
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, searchTerm]);

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
                <Link href="/admin/players">
                  Player Management
                </Link>
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
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Players Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              All Players ({sortedPlayers.length})
            </CardTitle>
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
                            <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-white text-sm">
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
