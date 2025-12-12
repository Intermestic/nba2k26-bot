import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Edit2, Plus, Save, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function TeamAliases() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAlias, setEditAlias] = useState("");
  const [editCanonical, setEditCanonical] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newCanonical, setNewCanonical] = useState("");

  const { data: aliases = [], refetch } = trpc.teamAliases.getAll.useQuery();
  const { data: validTeams = [] } = trpc.teamAliases.getValidTeams.useQuery();
  
  const createMutation = trpc.teamAliases.create.useMutation({
    onSuccess: () => {
      toast.success("Team alias created successfully");
      setNewAlias("");
      setNewCanonical("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.teamAliases.update.useMutation({
    onSuccess: () => {
      toast.success("Team alias updated successfully");
      setEditingId(null);
      setEditAlias("");
      setEditCanonical("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.teamAliases.delete.useMutation({
    onSuccess: () => {
      toast.success("Team alias deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    if (!newAlias.trim() || !newCanonical) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate({ alias: newAlias.trim(), canonicalName: newCanonical });
  };

  const handleUpdate = (id: number) => {
    if (!editAlias.trim() || !editCanonical) {
      toast.error("Please fill in all fields");
      return;
    }
    updateMutation.mutate({ id, alias: editAlias.trim(), canonicalName: editCanonical });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this alias?")) {
      deleteMutation.mutate({ id });
    }
  };

  const startEdit = (id: number, alias: string, canonical: string) => {
    setEditingId(id);
    setEditAlias(alias);
    setEditCanonical(canonical);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAlias("");
    setEditCanonical("");
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team Aliases</h1>
          <p className="text-muted-foreground">
            Manage global team name aliases for trade parsing. Add common abbreviations and variations to ensure trades are processed correctly.
          </p>
        </div>

        {/* Create New Alias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Alias
            </CardTitle>
            <CardDescription>
              Create a new team name alias that will be recognized in trade messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-alias">Alias</Label>
                <Input
                  id="new-alias"
                  placeholder="e.g., Cavs, Blazers"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-canonical">Canonical Team Name</Label>
                <Select value={newCanonical} onValueChange={setNewCanonical}>
                  <SelectTrigger id="new-canonical">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {validTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alias
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Aliases */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Aliases</CardTitle>
            <CardDescription>
              {aliases.length} alias{aliases.length !== 1 ? 'es' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aliases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No team aliases configured yet. Add one above to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alias</TableHead>
                    <TableHead>Canonical Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aliases.map((alias) => (
                    <TableRow key={alias.id}>
                      <TableCell>
                        {editingId === alias.id ? (
                          <Input
                            value={editAlias}
                            onChange={(e) => setEditAlias(e.target.value)}
                            className="max-w-xs"
                          />
                        ) : (
                          <span className="font-mono">{alias.alias}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === alias.id ? (
                          <Select value={editCanonical} onValueChange={setEditCanonical}>
                            <SelectTrigger className="max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {validTeams.map((team) => (
                                <SelectItem key={team} value={team}>
                                  {team}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="font-semibold">{alias.canonicalName}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(alias.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === alias.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdate(alias.id)}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(alias.id, alias.alias, alias.canonicalName)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(alias.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>How Team Aliases Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Team aliases</strong> allow the trade parser to recognize common abbreviations and variations of team names. When a trade message is posted, the system will automatically convert aliases to their canonical team names.
            </p>
            <p>
              <strong>Example:</strong> If you add an alias "Cavs" → "Cavaliers", then trade messages containing "Cavs" will be correctly processed as "Cavaliers".
            </p>
            <p>
              <strong>Case sensitivity:</strong> Aliases are case-insensitive, so "Cavs", "cavs", and "CAVS" will all match.
            </p>
            <p>
              <strong>Common use cases:</strong> Abbreviations (Cavs, Blazers), alternate spellings (Trailblazers vs Trail Blazers), and city names (Portland, Cleveland).
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
