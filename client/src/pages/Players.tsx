import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit, Loader2, Trash2, Users, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Players() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<any>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    overall: "70",
    team: "Free Agents",
    photoUrl: "",
    playerPageUrl: "",
  });

  // Normalize name for fuzzy search (same as Home page)
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Check owner status
  const { data: ownerStatus } = trpc.player.checkOwner.useQuery();

  // Fetch all players and filter client-side with fuzzy search
  const { data: allPlayers, isLoading, refetch } = trpc.player.list.useQuery({
    limit: 1000,
  });

  // Filter players with fuzzy search
  const players = useMemo(() => {
    if (!allPlayers) return [];
    if (!searchTerm) return allPlayers.slice(0, 100); // Show first 100 if no search
    
    const normalizedSearch = normalizeName(searchTerm);
    return allPlayers
      .filter(p => normalizeName(p.name).includes(normalizedSearch))
      .slice(0, 100); // Limit to 100 results
  }, [allPlayers, searchTerm]);

  // Update player mutation
  const updateMutation = trpc.player.update.useMutation({
    onSuccess: () => {
      toast.success("Player updated successfully!");
      setIsDialogOpen(false);
      setEditingPlayer(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update player: ${error.message}`);
    },
  });

  // Create player mutation (admin only)
  const createMutation = trpc.player.create.useMutation({
    onSuccess: () => {
      toast.success("Player added successfully!");
      setAddDialogOpen(false);
      setNewPlayer({
        name: "",
        overall: "70",
        team: "Free Agents",
        photoUrl: "",
        playerPageUrl: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add player: ${error.message}`);
    },
  });

  // Delete player mutation (admin only)
  const deleteMutation = trpc.player.delete.useMutation({
    onSuccess: () => {
      toast.success("Player deleted successfully!");
      setDeleteDialogOpen(false);
      setPlayerToDelete(null);
      setDeleteCode("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete player: ${error.message}`);
    },
  });

  const handleDeleteClick = (player: any) => {
    setPlayerToDelete(player);
    setDeleteCode("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteCode.length !== 4 || !/^\d{4}$/.test(deleteCode)) {
      toast.error("Please enter a 4-digit code");
      return;
    }
    if (playerToDelete) {
      deleteMutation.mutate({ id: playerToDelete.id });
    }
  };

  // Check if user is admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You must be an admin to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEdit = (player: any) => {
    setEditingPlayer({
      id: player.id,
      name: player.name,
      overall: player.overall,
      photoUrl: player.photoUrl || "",
      playerPageUrl: player.playerPageUrl || "",
      badgeCount: player.badgeCount || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPlayer) return;

    updateMutation.mutate({
      id: editingPlayer.id,
      name: editingPlayer.name,
      overall: parseInt(editingPlayer.overall),
      photoUrl: editingPlayer.photoUrl || null,
      playerPageUrl: editingPlayer.playerPageUrl || null,
      badgeCount: editingPlayer.badgeCount ? parseInt(editingPlayer.badgeCount) : null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="container mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Admin Panel - Player Management</CardTitle>
                {ownerStatus && (
                  <p className={`text-sm mt-2 ${ownerStatus.isOwner ? 'text-green-400' : 'text-yellow-400'}`}>
                    {ownerStatus.message}
                  </p>
                )}
              </div>
              <Button asChild variant="outline" className="bg-blue-900 border-blue-700 hover:bg-blue-800">
                <Link href="/admin">
                  <Users className="w-4 h-4 mr-2" />
                  Team Management
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-blue-900 border-blue-700 hover:bg-blue-800">
                <Link href="/admin/transactions">
                  <Users className="w-4 h-4 mr-2" />
                  Bulk Transactions
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-blue-900 border-blue-700 hover:bg-blue-800">
                <Link href="/admin/history">
                  History
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-blue-900 border-blue-700 hover:bg-blue-800">
                <Link href="/">
                  Home
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => refetch()}>Refresh</Button>
              <Button onClick={() => setAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {players?.map((player) => (
              <Card key={player.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                        {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Overall: {player.overall} | Badges: {player.badgeCount || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(player)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(player)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
            </DialogHeader>
            {editingPlayer && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingPlayer.name}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="overall">Overall Rating</Label>
                  <Input
                    id="overall"
                    type="number"
                    min="0"
                    max="99"
                    value={editingPlayer.overall}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, overall: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="badgeCount">Badge Count</Label>
                  <Input
                    id="badgeCount"
                    type="number"
                    min="0"
                    value={editingPlayer.badgeCount}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, badgeCount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="photoUrl">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    value={editingPlayer.photoUrl}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, photoUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="playerPageUrl">2kratings URL</Label>
                  <Input
                    id="playerPageUrl"
                    value={editingPlayer.playerPageUrl}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        playerPageUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-500">Delete Player</DialogTitle>
            </DialogHeader>
            {playerToDelete && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are about to delete <strong>{playerToDelete.name}</strong> (Overall: {playerToDelete.overall}).
                  This action cannot be undone.
                </p>
                <div>
                  <Label htmlFor="deleteCode">Enter a 4-digit code to confirm</Label>
                  <Input
                    id="deleteCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="Enter 4 digits"
                    value={deleteCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setDeleteCode(value);
                    }}
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose any 4-digit code (e.g., 1234)
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setPlayerToDelete(null);
                      setDeleteCode("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                    disabled={deleteMutation.isPending || deleteCode.length !== 4}
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Player"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Player Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newName">Name *</Label>
                <Input
                  id="newName"
                  value={newPlayer.name}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, name: e.target.value })
                  }
                  placeholder="Player name"
                />
              </div>
              <div>
                <Label htmlFor="newOverall">Overall Rating *</Label>
                <Input
                  id="newOverall"
                  type="number"
                  min="0"
                  max="99"
                  value={newPlayer.overall}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, overall: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="newTeam">Team *</Label>
                <Input
                  id="newTeam"
                  value={newPlayer.team}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, team: e.target.value })
                  }
                  placeholder="Team name or 'Free Agents'"
                />
              </div>
              <div>
                <Label htmlFor="newPhotoUrl">Photo URL (optional)</Label>
                <Input
                  id="newPhotoUrl"
                  value={newPlayer.photoUrl}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, photoUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="newPlayerPageUrl">2kratings URL (optional)</Label>
                <Input
                  id="newPlayerPageUrl"
                  value={newPlayer.playerPageUrl}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, playerPageUrl: e.target.value })
                  }
                  placeholder="https://www.2kratings.com/..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!newPlayer.name || !newPlayer.overall) {
                      toast.error("Name and Overall Rating are required");
                      return;
                    }
                    const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    createMutation.mutate({
                      id,
                      name: newPlayer.name,
                      overall: parseInt(newPlayer.overall),
                      team: newPlayer.team || "Free Agents",
                      photoUrl: newPlayer.photoUrl || null,
                      playerPageUrl: newPlayer.playerPageUrl || null,
                      nbaId: null,
                      source: "manual",
                    });
                  }}
                  disabled={createMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Player"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
