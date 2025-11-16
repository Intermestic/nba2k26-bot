import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react";

export default function UpgradeSummary() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Fetch pending upgrades
  const { data: upgrades, isLoading, refetch } = trpc.upgrades.getAllUpgrades.useQuery({
    status: "pending",
    limit: 500,
  });

  // Bulk approve mutation
  const bulkApproveMutation = trpc.upgrades.bulkApprove.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = trpc.upgrades.bulkReject.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  // Group upgrades by team
  const upgradesByTeam = upgrades?.reduce((acc, upgrade) => {
    if (!acc[upgrade.team]) {
      acc[upgrade.team] = [];
    }
    acc[upgrade.team].push(upgrade);
    return acc;
  }, {} as Record<string, typeof upgrades>);

  const teams = upgradesByTeam ? Object.keys(upgradesByTeam).sort() : [];

  // Toggle team expansion
  const toggleTeam = (team: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(team)) {
      newExpanded.delete(team);
    } else {
      newExpanded.add(team);
    }
    setExpandedTeams(newExpanded);
  };

  // Toggle individual upgrade selection
  const toggleUpgrade = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle all upgrades for a team
  const toggleTeamUpgrades = (team: string) => {
    const teamUpgrades = upgradesByTeam?.[team] || [];
    const teamIds = teamUpgrades.map((u) => u.id);
    const allSelected = teamIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !teamIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...teamIds])));
    }
  };

  // Handle bulk approve
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      toast.error("No upgrades selected");
      return;
    }

    if (confirm(`Approve ${selectedIds.length} upgrade(s)?`)) {
      bulkApproveMutation.mutate({ requestIds: selectedIds });
    }
  };

  // Handle bulk reject
  const handleBulkReject = () => {
    if (selectedIds.length === 0) {
      toast.error("No upgrades selected");
      return;
    }

    if (confirm(`Reject ${selectedIds.length} upgrade(s)?`)) {
      bulkRejectMutation.mutate({ requestIds: selectedIds });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Upgrade Summary</h1>
        <p className="text-muted-foreground">
          Review and approve pending upgrade requests grouped by team
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <Button
          onClick={handleBulkApprove}
          disabled={selectedIds.length === 0 || bulkApproveMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {bulkApproveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Approve Selected ({selectedIds.length})
        </Button>
        <Button
          onClick={handleBulkReject}
          disabled={selectedIds.length === 0 || bulkRejectMutation.isPending}
          variant="destructive"
        >
          {bulkRejectMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4 mr-2" />
          )}
          Reject Selected ({selectedIds.length})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upgrades?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedIds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Groups */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending upgrades
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const teamUpgrades = upgradesByTeam![team];
            const teamIds = teamUpgrades.map((u) => u.id);
            const allSelected = teamIds.every((id) => selectedIds.includes(id));
            const someSelected = teamIds.some((id) => selectedIds.includes(id));
            const isExpanded = expandedTeams.has(team);

            return (
              <Card key={team}>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleTeam(team)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      <CardTitle className="text-lg">{team}</CardTitle>
                      <Badge variant="secondary">{teamUpgrades.length} upgrades</Badge>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => toggleTeamUpgrades(team)}
                        className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-3">
                      {teamUpgrades.map((upgrade) => (
                        <div
                          key={upgrade.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          <Checkbox
                            checked={selectedIds.includes(upgrade.id)}
                            onCheckedChange={() => toggleUpgrade(upgrade.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{upgrade.playerName}</span>
                              {upgrade.gameNumber && (
                                <Badge variant="outline" className="text-xs">
                                  Game {upgrade.gameNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">{upgrade.badgeName}</span>
                              {" "}
                              <span className="text-muted-foreground">
                                {upgrade.fromLevel} → {upgrade.toLevel}
                              </span>
                            </div>
                            {upgrade.attributes && (
                              <div className="text-xs text-muted-foreground">
                                {upgrade.attributes}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Requested by {upgrade.requestedByName || upgrade.requestedBy} •{" "}
                              {new Date(upgrade.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
