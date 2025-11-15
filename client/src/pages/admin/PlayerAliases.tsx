import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PlayerAliases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedPlayerName, setSelectedPlayerName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: aliases, refetch: refetchAliases } = trpc.playerAliases.getAll.useQuery();
  const { data: failedSearches, refetch: refetchFailedSearches } = trpc.playerAliases.getFailedSearches.useQuery();
  const { data: players } = trpc.player.list.useQuery({ limit: 1000 });
  
  const addAliasMutation = trpc.playerAliases.add.useMutation({
    onSuccess: () => {
      toast.success("Alias added successfully");
      refetchAliases();
      setNewAlias("");
      setSelectedPlayerId("");
      setSelectedPlayerName("");
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add alias: ${error.message}`);
    },
  });

  const deleteAliasMutation = trpc.playerAliases.delete.useMutation({
    onSuccess: () => {
      toast.success("Alias deleted successfully");
      refetchAliases();
    },
    onError: (error) => {
      toast.error(`Failed to delete alias: ${error.message}`);
    },
  });

  const addFailedSearchAsAliasMutation = trpc.playerAliases.addFailedSearchAsAlias.useMutation({
    onSuccess: () => {
      toast.success("Failed search added as alias successfully");
      refetchAliases();
      refetchFailedSearches();
    },
    onError: (error) => {
      toast.error(`Failed to add alias: ${error.message}`);
    },
  });

  const markResolvedMutation = trpc.playerAliases.markFailedSearchResolved.useMutation({
    onSuccess: () => {
      toast.success("Failed search marked as resolved");
      refetchFailedSearches();
    },
    onError: (error) => {
      toast.error(`Failed to mark as resolved: ${error.message}`);
    },
  });

  const handleAddAlias = () => {
    if (!selectedPlayerId || !newAlias.trim()) {
      toast.error("Please select a player and enter an alias");
      return;
    }

    addAliasMutation.mutate({
      playerId: selectedPlayerId,
      playerName: selectedPlayerName,
      alias: newAlias.trim().toLowerCase(),
    });
  };

  const handleDeleteAlias = (id: number) => {
    if (confirm("Are you sure you want to delete this alias?")) {
      deleteAliasMutation.mutate({ id });
    }
  };

  const filteredAliases = aliases?.filter(alias =>
    alias.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alias.alias.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const totalAliases = aliases?.length || 0;
  const totalMatches = aliases?.reduce((sum, alias) => sum + alias.matchCount, 0) || 0;
  const topAliases = [...(aliases || [])]
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Player Name Aliases</h1>
          <p className="text-muted-foreground">
            Manage custom aliases and misspellings for player name matching
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Alias
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Alias</DialogTitle>
              <DialogDescription>
                Create a custom alias or misspelling that will match a specific player
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-select">Player</Label>
                <select
                  id="player-select"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedPlayerId}
                  onChange={(e) => {
                    setSelectedPlayerId(e.target.value);
                    const player = players?.find((p: any) => p.id === e.target.value);
                    setSelectedPlayerName(player?.name || "");
                  }}
                >
                  <option value="">Select a player...</option>
                  {players?.map((player: any) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.overall} OVR) - {player.team || "Free Agent"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alias-input">Alias / Misspelling</Label>
                <Input
                  id="alias-input"
                  placeholder="e.g., johnny murphy, vit kreji"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the misspelling or alternate name that should match this player
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAlias} disabled={addAliasMutation.isPending}>
                {addAliasMutation.isPending ? "Adding..." : "Add Alias"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Aliases</CardTitle>
            <CardDescription>Custom aliases in database</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalAliases}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Matches</CardTitle>
            <CardDescription>Times aliases have been used</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMatches}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Match Rate</CardTitle>
            <CardDescription>Average matches per alias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {totalAliases > 0 ? (totalMatches / totalAliases).toFixed(1) : "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Aliases */}
      {topAliases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Most Used Aliases</CardTitle>
            <CardDescription>Aliases with the highest match counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topAliases.map((alias, index) => (
                <div key={alias.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium">"{alias.alias}" → {alias.playerName}</p>
                      <p className="text-sm text-muted-foreground">
                        Added by {alias.addedByName || "System"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{alias.matchCount}</p>
                    <p className="text-xs text-muted-foreground">matches</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Searches Section */}
      {failedSearches && failedSearches.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-orange-600">🔍</span>
              Failed Player Searches
            </CardTitle>
            <CardDescription>
              These player names failed to match. Review and add them as aliases to improve future matching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search Term</TableHead>
                  <TableHead>Attempt Count</TableHead>
                  <TableHead>Last Attempted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedSearches.map((search: any) => (
                  <TableRow key={search.id}>
                    <TableCell>
                      <code className="bg-orange-100 px-2 py-1 rounded font-medium">
                        {search.searchTerm}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800">
                        {search.attemptCount} {search.attemptCount === 1 ? 'attempt' : 'attempts'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(search.lastAttempted).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="default">
                            <Plus className="mr-1 h-3 w-3" />
                            Add as Alias
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add "{search.searchTerm}" as Alias</DialogTitle>
                            <DialogDescription>
                              Select which player this search term should match
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`player-select-${search.id}`}>Player</Label>
                              <select
                                id={`player-select-${search.id}`}
                                className="w-full px-3 py-2 border rounded-md"
                                onChange={(e) => {
                                  const player = players?.find((p: any) => p.id === e.target.value);
                                  if (player) {
                                    addFailedSearchAsAliasMutation.mutate({
                                      failedSearchId: search.id,
                                      playerId: player.id,
                                      playerName: player.name,
                                      searchTerm: search.searchTerm,
                                    });
                                  }
                                }}
                              >
                                <option value="">Select a player...</option>
                                {players?.map((player: any) => (
                                  <option key={player.id} value={player.id}>
                                    {player.name} ({player.overall} OVR) - {player.team || "Free Agent"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markResolvedMutation.mutate({ id: search.id })}
                        disabled={markResolvedMutation.isPending}
                      >
                        Dismiss
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Aliases</CardTitle>
          <CardDescription>
            Search and manage all player name aliases
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by player name or alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player Name</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead>Match Count</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAliases?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No aliases found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAliases?.map((alias) => (
                  <TableRow key={alias.id}>
                    <TableCell className="font-medium">{alias.playerName}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded">{alias.alias}</code>
                    </TableCell>
                    <TableCell>{alias.matchCount}</TableCell>
                    <TableCell>{alias.addedByName || "System"}</TableCell>
                    <TableCell>{new Date(alias.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlias(alias.id)}
                        disabled={deleteAliasMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
