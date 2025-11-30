import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowUpDown, Flag, FileText, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UpgradeLogEntry {
  id: number;
  playerName: string;
  userName: string;
  date: string;
  sourceType: string;
  sourceDetail: string | null;
  upgradeType: "Badge" | "Attribute";
  badgeOrAttribute: string;
  fromValue: string | null;
  toValue: string;
  notes: string | null;
  flagged: number;
  flagReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type SortField = "playerName" | "userName" | "date" | "upgradeType" | "badgeOrAttribute";
type SortDirection = "asc" | "desc";

export default function UpgradeLog() {
  const [searchPlayer, setSearchPlayer] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Badge" | "Attribute">("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [showFlagged, setShowFlagged] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<UpgradeLogEntry | null>(null);
  const [notesText, setNotesText] = useState("");
  const [flagReason, setFlagReason] = useState("");

  const { data: upgrades, isLoading, refetch } = trpc.upgradeLog.getAll.useQuery();

  const updateNotesMutation = trpc.upgradeLog.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes updated successfully");
      setNotesDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update notes: ${error.message}`);
    },
  });

  const toggleFlagMutation = trpc.upgradeLog.toggleFlag.useMutation({
    onSuccess: () => {
      toast.success("Flag status updated");
      setFlagDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update flag: ${error.message}`);
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleOpenNotes = (entry: UpgradeLogEntry) => {
    setSelectedEntry(entry);
    setNotesText(entry.notes || "");
    setNotesDialogOpen(true);
  };

  const handleOpenFlag = (entry: UpgradeLogEntry) => {
    setSelectedEntry(entry);
    setFlagReason(entry.flagReason || "");
    setFlagDialogOpen(true);
  };

  const handleSaveNotes = () => {
    if (selectedEntry) {
      updateNotesMutation.mutate({
        id: selectedEntry.id,
        notes: notesText || null,
      });
    }
  };

  const handleToggleFlag = (flagged: boolean) => {
    if (selectedEntry) {
      toggleFlagMutation.mutate({
        id: selectedEntry.id,
        flagged,
        flagReason: flagged ? flagReason || null : null,
      });
    }
  };

  const filteredAndSortedUpgrades = useMemo(() => {
    if (!upgrades) return [];

    let filtered = upgrades.filter((upgrade) => {
      const matchesPlayer = searchPlayer === "" || 
        upgrade.playerName.toLowerCase().includes(searchPlayer.toLowerCase());
      const matchesUser = searchUser === "" || 
        upgrade.userName.toLowerCase().includes(searchUser.toLowerCase());
      const matchesType = filterType === "all" || upgrade.upgradeType === filterType;
      const matchesSource = filterSource === "all" || upgrade.sourceType === filterSource;
      const matchesFlagged = !showFlagged || upgrade.flagged === 1;

      return matchesPlayer && matchesUser && matchesType && matchesSource && matchesFlagged;
    });

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle date sorting specially
      if (sortField === "date") {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [upgrades, searchPlayer, searchUser, filterType, filterSource, showFlagged, sortField, sortDirection]);

  const uniqueSources = useMemo(() => {
    if (!upgrades) return [];
    const sources = new Set(upgrades.map((u) => u.sourceType));
    return Array.from(sources).sort();
  }, [upgrades]);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 font-semibold"
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Log</CardTitle>
          <CardDescription>
            View and manage all player badge and attribute upgrades with notes and flags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search-player">Player Name</Label>
              <Input
                id="search-player"
                placeholder="Search player..."
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="search-user">User Name</Label>
              <Input
                id="search-user"
                placeholder="Search user..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter-type">Upgrade Type</Label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger id="filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Badge">Badge</SelectItem>
                  <SelectItem value="Attribute">Attribute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-source">Source Type</Label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger id="filter-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant={showFlagged ? "default" : "outline"}
                onClick={() => setShowFlagged(!showFlagged)}
                className="w-full"
              >
                <Flag className="mr-2 h-4 w-4" />
                {showFlagged ? "Show All" : "Flagged Only"}
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedUpgrades.length} of {upgrades?.length || 0} upgrades
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">
                    <SortButton field="playerName" label="Player" />
                  </th>
                  <th className="text-left p-2">
                    <SortButton field="userName" label="User" />
                  </th>
                  <th className="text-left p-2">
                    <SortButton field="date" label="Date" />
                  </th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">
                    <SortButton field="upgradeType" label="Type" />
                  </th>
                  <th className="text-left p-2">
                    <SortButton field="badgeOrAttribute" label="Badge/Attribute" />
                  </th>
                  <th className="text-left p-2">From</th>
                  <th className="text-left p-2">To</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUpgrades.map((upgrade) => (
                  <tr
                    key={upgrade.id}
                    className={`border-t hover:bg-muted/50 ${upgrade.flagged ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                  >
                    <td className="p-2 font-medium">{upgrade.playerName}</td>
                    <td className="p-2">{upgrade.userName}</td>
                    <td className="p-2">{upgrade.date}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {upgrade.sourceType}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={upgrade.upgradeType === "Badge" ? "default" : "secondary"}>
                        {upgrade.upgradeType}
                      </Badge>
                    </td>
                    <td className="p-2">{upgrade.badgeOrAttribute}</td>
                    <td className="p-2">{upgrade.fromValue || "—"}</td>
                    <td className="p-2 font-semibold">{upgrade.toValue}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenNotes(upgrade)}
                          title="Add/Edit Notes"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={upgrade.flagged ? "destructive" : "ghost"}
                          size="sm"
                          onClick={() => handleOpenFlag(upgrade)}
                          title={upgrade.flagged ? "Unflag" : "Flag for Review"}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogDescription>
              Add or edit notes for {selectedEntry?.playerName}'s upgrade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upgrade Details</Label>
              <div className="text-sm text-muted-foreground mt-1">
                <div><strong>Player:</strong> {selectedEntry?.playerName}</div>
                <div><strong>Type:</strong> {selectedEntry?.upgradeType}</div>
                <div><strong>Badge/Attribute:</strong> {selectedEntry?.badgeOrAttribute}</div>
                <div><strong>Change:</strong> {selectedEntry?.fromValue || "—"} → {selectedEntry?.toValue}</div>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add any notes about this upgrade..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateNotesMutation.isPending}>
              {updateNotesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEntry?.flagged ? "Unflag" : "Flag"} Upgrade</DialogTitle>
            <DialogDescription>
              {selectedEntry?.flagged 
                ? "Remove flag from this upgrade record"
                : "Flag this upgrade for review"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upgrade Details</Label>
              <div className="text-sm text-muted-foreground mt-1">
                <div><strong>Player:</strong> {selectedEntry?.playerName}</div>
                <div><strong>Type:</strong> {selectedEntry?.upgradeType}</div>
                <div><strong>Badge/Attribute:</strong> {selectedEntry?.badgeOrAttribute}</div>
                <div><strong>Change:</strong> {selectedEntry?.fromValue || "—"} → {selectedEntry?.toValue}</div>
              </div>
            </div>
            {!selectedEntry?.flagged && (
              <div>
                <Label htmlFor="flag-reason">Reason for Flagging</Label>
                <Textarea
                  id="flag-reason"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Why is this upgrade being flagged?"
                  rows={3}
                />
              </div>
            )}
            {selectedEntry?.flagged && selectedEntry.flagReason && (
              <div>
                <Label>Current Flag Reason</Label>
                <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                  {selectedEntry.flagReason}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            {selectedEntry?.flagged ? (
              <Button
                variant="default"
                onClick={() => handleToggleFlag(false)}
                disabled={toggleFlagMutation.isPending}
              >
                {toggleFlagMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" />
                Unflag
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleToggleFlag(true)}
                disabled={toggleFlagMutation.isPending}
              >
                {toggleFlagMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Flag className="mr-2 h-4 w-4" />
                Flag for Review
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
