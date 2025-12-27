import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, History, Upload, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function TeamAssignments() {
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [formData, setFormData] = useState({
    discordUserId: "",
    discordUsername: "",
    team: "",
    reason: "",
  });
  const [bulkImportText, setBulkImportText] = useState("");

  const { data: assignments, refetch } = trpc.teamAssignments.getAll.useQuery({ search });
  const { data: history } = trpc.teamAssignments.getHistory.useQuery(
    { discordUserId: selectedAssignment?.discordUserId },
    { enabled: !!selectedAssignment && historyDialogOpen }
  );

  const addMutation = trpc.teamAssignments.add.useMutation({
    onSuccess: () => {
      toast.success("Team assignment added successfully");
      refetch();
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to add assignment: ${error.message}`);
    },
  });

  const updateMutation = trpc.teamAssignments.update.useMutation({
    onSuccess: () => {
      toast.success("Team assignment updated successfully");
      refetch();
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update assignment: ${error.message}`);
    },
  });

  const deleteMutation = trpc.teamAssignments.delete.useMutation({
    onSuccess: () => {
      toast.success("Team assignment deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete assignment: ${error.message}`);
    },
  });

  const bulkImportMutation = trpc.teamAssignments.bulkImport.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Successfully imported ${data.successCount} assignments`);
      } else {
        toast.warning(`Imported ${data.successCount} assignments, ${data.errorCount} failed`);
      }
      refetch();
      setBulkImportDialogOpen(false);
      setBulkImportText("");
    },
    onError: (error) => {
      toast.error(`Bulk import failed: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      discordUserId: "",
      discordUsername: "",
      team: "",
      reason: "",
    });
    setSelectedAssignment(null);
  };

  const handleAdd = () => {
    addMutation.mutate(formData);
  };

  const handleEdit = (assignment: any) => {
    setSelectedAssignment(assignment);
    setFormData({
      discordUserId: assignment.discordUserId,
      discordUsername: assignment.discordUsername || "",
      team: assignment.team,
      reason: "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedAssignment) return;
    updateMutation.mutate({
      id: selectedAssignment.id,
      team: formData.team,
      discordUsername: formData.discordUsername,
      reason: formData.reason,
    });
  };

  const handleDelete = (assignment: any) => {
    if (confirm(`Are you sure you want to delete the team assignment for ${assignment.discordUserId}?`)) {
      deleteMutation.mutate({
        id: assignment.id,
        reason: "Deleted via admin UI",
      });
    }
  };

  const handleBulkImport = () => {
    try {
      // Parse CSV format: discordUserId,discordUsername,team
      const lines = bulkImportText.trim().split('\n');
      const assignments = lines
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
          const [discordUserId, discordUsername, team] = line.split(',').map(s => s.trim());
          if (!discordUserId || !team) {
            throw new Error(`Invalid line: ${line}`);
          }
          return { discordUserId, discordUsername, team };
        });

      if (assignments.length === 0) {
        toast.error("No valid assignments found in input");
        return;
      }

      bulkImportMutation.mutate({
        assignments,
        reason: "Bulk import via admin UI",
      });
    } catch (error) {
      toast.error(`Failed to parse input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleShowHistory = (assignment: any) => {
    setSelectedAssignment(assignment);
    setHistoryDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Team Assignments</h1>
            <p className="text-muted-foreground">Manage Discord user → team mappings</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setBulkImportDialogOpen(true)} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Discord ID, username, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Assignments Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Discord User ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments?.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-mono text-sm">{assignment.discordUserId}</TableCell>
                  <TableCell>{assignment.discordUsername || "-"}</TableCell>
                  <TableCell className="font-semibold">{assignment.team}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(assignment.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowHistory(assignment)}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(assignment)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!assignments || assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No team assignments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Assignment</DialogTitle>
              <DialogDescription>
                Assign a Discord user to a team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discordUserId">Discord User ID *</Label>
                <Input
                  id="discordUserId"
                  value={formData.discordUserId}
                  onChange={(e) => setFormData({ ...formData, discordUserId: e.target.value })}
                  placeholder="123456789012345678"
                />
              </div>
              <div>
                <Label htmlFor="discordUsername">Discord Username (optional)</Label>
                <Input
                  id="discordUsername"
                  value={formData.discordUsername}
                  onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="team">Team *</Label>
                <Input
                  id="team"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  placeholder="Jazz, Lakers, etc."
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why this assignment was made..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!formData.discordUserId || !formData.team}>
                Add Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Assignment</DialogTitle>
              <DialogDescription>
                Update team assignment for {selectedAssignment?.discordUserId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-discordUsername">Discord Username (optional)</Label>
                <Input
                  id="edit-discordUsername"
                  value={formData.discordUsername}
                  onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="edit-team">Team *</Label>
                <Input
                  id="edit-team"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  placeholder="Jazz, Lakers, etc."
                />
              </div>
              <div>
                <Label htmlFor="edit-reason">Reason for change (optional)</Label>
                <Textarea
                  id="edit-reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why this change was made..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.team}>
                Update Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Change History</DialogTitle>
              <DialogDescription>
                Assignment history for {selectedAssignment?.discordUserId}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Previous Team</TableHead>
                    <TableHead>New Team</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {new Date(entry.changedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{entry.previousTeam || "-"}</TableCell>
                      <TableCell className="font-semibold">{entry.newTeam}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {entry.changedByDiscordId || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!history || history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        No history found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Import Team Assignments</DialogTitle>
              <DialogDescription>
                Import multiple team assignments from CSV format
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-import">CSV Data</Label>
                <Textarea
                  id="bulk-import"
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="discordUserId,discordUsername,team&#10;123456789,username1,Jazz&#10;987654321,username2,Lakers"
                  className="font-mono text-sm h-64"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Format: discordUserId,discordUsername,team (one per line)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkImport} disabled={!bulkImportText.trim()}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
