import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, Search, Flag, Trash2, Edit, FileDown, Upload, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface SwapFormData {
  oldPlayerName: string;
  newPlayerName: string;
  team: string;
  swapType: "dna_swap" | "player_replacement" | "other";
  swapDate: string;
  oldPlayerOvr: string;
  newPlayerOvr: string;
  notes: string;
  flagged: boolean;
  flagReason: string;
}

const initialFormData: SwapFormData = {
  oldPlayerName: "",
  newPlayerName: "",
  team: "",
  swapType: "dna_swap",
  swapDate: new Date().toLocaleDateString("en-US"),
  oldPlayerOvr: "",
  newPlayerOvr: "",
  notes: "",
  flagged: false,
  flagReason: "",
};

export default function PlayerSwaps() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFlagged, setFilterFlagged] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [formData, setFormData] = useState<SwapFormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [bulkImportData, setBulkImportData] = useState("");

  const utils = trpc.useUtils();

  // Build filter object
  const filters: any = {};
  if (searchTerm) filters.search = searchTerm;
  if (filterType !== "all") filters.swapType = filterType;
  if (filterFlagged === "flagged") filters.flagged = true;
  if (filterFlagged === "unflagged") filters.flagged = false;

  const { data: swaps, isLoading } = trpc.playerSwaps.getAll.useQuery(filters);
  const { data: stats } = trpc.playerSwaps.getStats.useQuery();

  const createMutation = trpc.playerSwaps.create.useMutation({
    onSuccess: () => {
      toast.success("Player swap created successfully");
      utils.playerSwaps.getAll.invalidate();
      utils.playerSwaps.getStats.invalidate();
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error(`Failed to create swap: ${error.message}`);
    },
  });

  const updateMutation = trpc.playerSwaps.update.useMutation({
    onSuccess: () => {
      toast.success("Player swap updated successfully");
      utils.playerSwaps.getAll.invalidate();
      setIsEditDialogOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error(`Failed to update swap: ${error.message}`);
    },
  });

  const deleteMutation = trpc.playerSwaps.delete.useMutation({
    onSuccess: () => {
      toast.success("Player swap deleted successfully");
      utils.playerSwaps.getAll.invalidate();
      utils.playerSwaps.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete swap: ${error.message}`);
    },
  });

  const toggleFlagMutation = trpc.playerSwaps.toggleFlag.useMutation({
    onSuccess: () => {
      toast.success("Flag status updated");
      utils.playerSwaps.getAll.invalidate();
      utils.playerSwaps.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update flag: ${error.message}`);
    },
  });

  const bulkImportMutation = trpc.playerSwaps.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.imported} swaps`);
      utils.playerSwaps.getAll.invalidate();
      utils.playerSwaps.getStats.invalidate();
      setIsBulkImportOpen(false);
      setBulkImportData("");
    },
    onError: (error) => {
      toast.error(`Failed to import swaps: ${error.message}`);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      oldPlayerName: formData.oldPlayerName,
      newPlayerName: formData.newPlayerName,
      team: formData.team || undefined,
      swapType: formData.swapType,
      swapDate: formData.swapDate,
      oldPlayerOvr: formData.oldPlayerOvr ? parseInt(formData.oldPlayerOvr) : undefined,
      newPlayerOvr: formData.newPlayerOvr ? parseInt(formData.newPlayerOvr) : undefined,
      notes: formData.notes || undefined,
      flagged: formData.flagged,
      flagReason: formData.flagReason || undefined,
    });
  };

  const handleEdit = (swap: any) => {
    setEditingId(swap.id);
    setFormData({
      oldPlayerName: swap.oldPlayerName,
      newPlayerName: swap.newPlayerName,
      team: swap.team || "",
      swapType: swap.swapType,
      swapDate: swap.swapDate,
      oldPlayerOvr: swap.oldPlayerOvr?.toString() || "",
      newPlayerOvr: swap.newPlayerOvr?.toString() || "",
      notes: swap.notes || "",
      flagged: swap.flagged === 1,
      flagReason: swap.flagReason || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      oldPlayerName: formData.oldPlayerName,
      newPlayerName: formData.newPlayerName,
      team: formData.team || undefined,
      swapType: formData.swapType,
      swapDate: formData.swapDate,
      oldPlayerOvr: formData.oldPlayerOvr ? parseInt(formData.oldPlayerOvr) : undefined,
      newPlayerOvr: formData.newPlayerOvr ? parseInt(formData.newPlayerOvr) : undefined,
      notes: formData.notes || undefined,
      flagged: formData.flagged,
      flagReason: formData.flagReason || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this swap?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleFlag = (swap: any) => {
    const newFlagged = swap.flagged === 0;
    let flagReason = swap.flagReason;

    if (newFlagged && !flagReason) {
      flagReason = prompt("Enter reason for flagging:");
      if (!flagReason) return;
    }

    toggleFlagMutation.mutate({
      id: swap.id,
      flagged: newFlagged,
      flagReason: newFlagged ? flagReason : undefined,
    });
  };

  const handleBulkImport = () => {
    try {
      const lines = bulkImportData.trim().split("\n");
      const swaps = lines.map((line) => {
        const [oldPlayerName, newPlayerName, team, swapType, swapDate, oldPlayerOvr, newPlayerOvr, notes] = line.split(",").map((s) => s.trim());

        return {
          oldPlayerName,
          newPlayerName,
          team: team || undefined,
          swapType: (swapType as "dna_swap" | "player_replacement" | "other") || "dna_swap",
          swapDate: swapDate || new Date().toLocaleDateString("en-US"),
          oldPlayerOvr: oldPlayerOvr ? parseInt(oldPlayerOvr) : undefined,
          newPlayerOvr: newPlayerOvr ? parseInt(newPlayerOvr) : undefined,
          notes: notes || undefined,
        };
      });

      bulkImportMutation.mutate({ swaps });
    } catch (error) {
      toast.error("Failed to parse CSV data. Please check format.");
    }
  };

  const exportToCSV = () => {
    if (!swaps || swaps.length === 0) {
      toast.error("No swaps to export");
      return;
    }

    const headers = ["Old Player", "New Player", "Team", "Swap Type", "Date", "Old OVR", "New OVR", "Notes", "Flagged", "Flag Reason", "Added By"];
    const rows = swaps.map((swap) => [
      swap.oldPlayerName,
      swap.newPlayerName,
      swap.team || "",
      swap.swapType,
      swap.swapDate,
      swap.oldPlayerOvr || "",
      swap.newPlayerOvr || "",
      swap.notes || "",
      swap.flagged === 1 ? "Yes" : "No",
      swap.flagReason || "",
      swap.addedByName || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `player-swaps-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ArrowLeftRight className="w-8 h-8 text-amber-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">Player Swaps</h1>
                <p className="text-sm text-slate-400 mt-1">Track DNA swaps and player replacements for Season 17</p>
              </div>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Swaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">DNA Swaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats?.dnaSwaps || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Replacements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats?.playerReplacements || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Other</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats?.other || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats?.flagged || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by player name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Filters */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Swap Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dna_swap">DNA Swap</SelectItem>
                  <SelectItem value="player_replacement">Replacement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterFlagged} onValueChange={setFilterFlagged}>
                <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Flag Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Swaps</SelectItem>
                  <SelectItem value="flagged">Flagged Only</SelectItem>
                  <SelectItem value="unflagged">Unflagged Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Action Buttons */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Swap
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Player Swap</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Record a DNA swap or player replacement for Season 17
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="oldPlayerName">Old Player Name *</Label>
                        <Input
                          id="oldPlayerName"
                          value={formData.oldPlayerName}
                          onChange={(e) => setFormData({ ...formData, oldPlayerName: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="e.g., LeBron James"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPlayerName">New Player Name *</Label>
                        <Input
                          id="newPlayerName"
                          value={formData.newPlayerName}
                          onChange={(e) => setFormData({ ...formData, newPlayerName: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="e.g., Kevin Durant"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="team">Team</Label>
                        <Input
                          id="team"
                          value={formData.team}
                          onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="e.g., Lakers"
                        />
                      </div>
                      <div>
                        <Label htmlFor="swapType">Swap Type *</Label>
                        <Select value={formData.swapType} onValueChange={(value: any) => setFormData({ ...formData, swapType: value })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dna_swap">DNA Swap</SelectItem>
                            <SelectItem value="player_replacement">Player Replacement</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="swapDate">Swap Date *</Label>
                        <Input
                          id="swapDate"
                          value={formData.swapDate}
                          onChange={(e) => setFormData({ ...formData, swapDate: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="MM/DD/YYYY"
                        />
                      </div>
                      <div>
                        <Label htmlFor="oldPlayerOvr">Old OVR</Label>
                        <Input
                          id="oldPlayerOvr"
                          type="number"
                          value={formData.oldPlayerOvr}
                          onChange={(e) => setFormData({ ...formData, oldPlayerOvr: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="e.g., 95"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPlayerOvr">New OVR</Label>
                        <Input
                          id="newPlayerOvr"
                          type="number"
                          value={formData.newPlayerOvr}
                          onChange={(e) => setFormData({ ...formData, newPlayerOvr: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="e.g., 96"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="Additional notes about this swap..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="flagged"
                        checked={formData.flagged}
                        onCheckedChange={(checked) => setFormData({ ...formData, flagged: checked as boolean })}
                      />
                      <Label htmlFor="flagged" className="cursor-pointer">Flag for review</Label>
                    </div>

                    {formData.flagged && (
                      <div>
                        <Label htmlFor="flagReason">Flag Reason</Label>
                        <Input
                          id="flagReason"
                          value={formData.flagReason}
                          onChange={(e) => setFormData({ ...formData, flagReason: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="Why is this swap flagged?"
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!formData.oldPlayerName || !formData.newPlayerName || !formData.swapDate}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Swap
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button onClick={exportToCSV} variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>

              <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Player Swaps</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Paste CSV data (one swap per line): OldPlayer,NewPlayer,Team,SwapType,Date,OldOVR,NewOVR,Notes
                    </DialogDescription>
                  </DialogHeader>

                  <Textarea
                    value={bulkImportData}
                    onChange={(e) => setBulkImportData(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                    placeholder="LeBron James,Kevin Durant,Lakers,dna_swap,11/30/2025,95,96,Approved by GM"
                    rows={10}
                  />

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkImport} className="bg-blue-600 hover:bg-blue-700">
                      Import Swaps
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Swaps Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Player Swaps ({swaps?.length || 0})</CardTitle>
            <CardDescription className="text-slate-400">All recorded player swaps for Season 17</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 bg-slate-700" />
                ))}
              </div>
            ) : !swaps || swaps.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No player swaps found</p>
                <p className="text-sm mt-2">Add your first swap to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 font-medium">Old Player</th>
                      <th className="text-left p-3 text-slate-400 font-medium">New Player</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Team</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Date</th>
                      <th className="text-left p-3 text-slate-400 font-medium">OVR Change</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swaps.map((swap) => (
                      <tr key={swap.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="p-3 text-white">{swap.oldPlayerName}</td>
                        <td className="p-3 text-white">{swap.newPlayerName}</td>
                        <td className="p-3 text-slate-300">{swap.team || "-"}</td>
                        <td className="p-3">
                          <Badge
                            className={
                              swap.swapType === "dna_swap"
                                ? "bg-blue-600"
                                : swap.swapType === "player_replacement"
                                ? "bg-green-600"
                                : "bg-purple-600"
                            }
                          >
                            {swap.swapType.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-300">{swap.swapDate}</td>
                        <td className="p-3 text-slate-300">
                          {swap.oldPlayerOvr && swap.newPlayerOvr
                            ? `${swap.oldPlayerOvr} → ${swap.newPlayerOvr}`
                            : "-"}
                        </td>
                        <td className="p-3">
                          {swap.flagged === 1 ? (
                            <Badge className="bg-red-600">
                              <Flag className="w-3 h-3 mr-1" />
                              Flagged
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-700">Normal</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleFlag(swap)}
                              title={swap.flagged === 1 ? "Unflag" : "Flag"}
                            >
                              <Flag className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(swap)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(swap.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Player Swap</DialogTitle>
            <DialogDescription className="text-slate-400">Update swap details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-oldPlayerName">Old Player Name *</Label>
                <Input
                  id="edit-oldPlayerName"
                  value={formData.oldPlayerName}
                  onChange={(e) => setFormData({ ...formData, oldPlayerName: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-newPlayerName">New Player Name *</Label>
                <Input
                  id="edit-newPlayerName"
                  value={formData.newPlayerName}
                  onChange={(e) => setFormData({ ...formData, newPlayerName: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-team">Team</Label>
                <Input
                  id="edit-team"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-swapType">Swap Type *</Label>
                <Select value={formData.swapType} onValueChange={(value: any) => setFormData({ ...formData, swapType: value })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dna_swap">DNA Swap</SelectItem>
                    <SelectItem value="player_replacement">Player Replacement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-swapDate">Swap Date *</Label>
                <Input
                  id="edit-swapDate"
                  value={formData.swapDate}
                  onChange={(e) => setFormData({ ...formData, swapDate: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-oldPlayerOvr">Old OVR</Label>
                <Input
                  id="edit-oldPlayerOvr"
                  type="number"
                  value={formData.oldPlayerOvr}
                  onChange={(e) => setFormData({ ...formData, oldPlayerOvr: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-newPlayerOvr">New OVR</Label>
                <Input
                  id="edit-newPlayerOvr"
                  type="number"
                  value={formData.newPlayerOvr}
                  onChange={(e) => setFormData({ ...formData, newPlayerOvr: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-flagged"
                checked={formData.flagged}
                onCheckedChange={(checked) => setFormData({ ...formData, flagged: checked as boolean })}
              />
              <Label htmlFor="edit-flagged" className="cursor-pointer">Flag for review</Label>
            </div>

            {formData.flagged && (
              <div>
                <Label htmlFor="edit-flagReason">Flag Reason</Label>
                <Input
                  id="edit-flagReason"
                  value={formData.flagReason}
                  onChange={(e) => setFormData({ ...formData, flagReason: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.oldPlayerName || !formData.newPlayerName || !formData.swapDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Swap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
