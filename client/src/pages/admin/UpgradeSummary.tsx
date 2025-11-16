import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";

export default function UpgradeSummary() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const { data: upgrades, isLoading, refetch } = trpc.upgrades.getAllUpgrades.useQuery();
  const bulkApproveMutation = trpc.upgrades.bulkApprove.useMutation();
  const bulkRejectMutation = trpc.upgrades.bulkReject.useMutation();

  // Group upgrades by team
  const upgradesByTeam = upgrades?.reduce((acc: any, upgrade: any) => {
    if (!acc[upgrade.team]) {
      acc[upgrade.team] = [];
    }
    acc[upgrade.team].push(upgrade);
    return acc;
  }, {} as Record<string, typeof upgrades>);

  const pendingCount = upgrades?.filter((u: any) => u.status === "pending").length || 0;
  const teamCount = upgradesByTeam ? Object.keys(upgradesByTeam).length : 0;

  const toggleTeam = (team: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(team)) {
      newExpanded.delete(team);
    } else {
      newExpanded.add(team);
    }
    setExpandedTeams(newExpanded);
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleTeamSelection = (team: string) => {
    const teamUpgrades = upgradesByTeam?.[team] || [];
    const teamIds = teamUpgrades.filter((u: any) => u.status === "pending").map((u: any) => u.id);
    const allSelected = teamIds.every((id: number) => selectedIds.has(id));

    const newSelected = new Set(selectedIds);
    if (allSelected) {
      teamIds.forEach((id: number) => newSelected.delete(id));
    } else {
      teamIds.forEach((id: number) => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) {
      toast.error("No upgrades selected");
      return;
    }

    try {
      const ids = Array.from(selectedIds);
      if (action === "approve") {
        const result = await bulkApproveMutation.mutateAsync({ requestIds: ids });
        toast.success(`Approved ${result.successCount} upgrades`);
      } else {
        const result = await bulkRejectMutation.mutateAsync({ requestIds: ids });
        toast.success(`Rejected ${result.successCount} upgrades`);
      }
      setSelectedIds(new Set());
      setConfirmAction(null);
      refetch();
    } catch (error) {
      toast.error(`Failed to ${action} upgrades`);
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading upgrades...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upgrade Summary</h1>
          <p className="text-slate-400">
            {pendingCount} pending upgrades across {teamCount} teams
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{teamCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{selectedIds.size}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mb-6 flex gap-4">
            <Button
              onClick={() => setConfirmAction("approve")}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Selected ({selectedIds.size})
            </Button>
            <Button
              onClick={() => setConfirmAction("reject")}
              variant="destructive"
            >
              Reject Selected ({selectedIds.size})
            </Button>
          </div>
        )}

        {/* Team Groups */}
        <div className="space-y-4">
          {upgradesByTeam && Object.entries(upgradesByTeam)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([team, teamUpgrades]: [string, any]) => {
              const teamPendingCount = teamUpgrades.filter((u: any) => u.status === "pending").length;
              const isExpanded = expandedTeams.has(team);
              const teamIds = teamUpgrades.filter((u: any) => u.status === "pending").map((u: any) => u.id);
              const allSelected = teamIds.length > 0 && teamIds.every((id: number) => selectedIds.has(id));

              return (
                <Card key={team} className="bg-slate-800 border-slate-700">
                  <CardHeader
                    className="cursor-pointer hover:bg-slate-750"
                    onClick={() => toggleTeam(team)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        <CardTitle className="text-white">{team}</CardTitle>
                        <Badge variant="outline">{teamUpgrades.length} upgrades</Badge>
                        {teamPendingCount > 0 && (
                          <Badge className="bg-yellow-600">{teamPendingCount} pending</Badge>
                        )}
                      </div>
                      {teamPendingCount > 0 && (
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleTeamSelection(team)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-3">
                        {teamUpgrades.map((upgrade: any) => {
                          let attributesDisplay = "";
                          if (upgrade.attributes) {
                            try {
                              const attrs = JSON.parse(upgrade.attributes as string);
                              attributesDisplay = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(", ");
                            } catch (e) {
                              attributesDisplay = "Invalid attributes";
                            }
                          }

                          return (
                            <div
                              key={upgrade.id}
                              className="flex items-start gap-4 p-4 bg-slate-900 rounded-lg"
                            >
                              {upgrade.status === "pending" && (
                                <Checkbox
                                  checked={selectedIds.has(upgrade.id)}
                                  onCheckedChange={() => toggleSelection(upgrade.id)}
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getStatusIcon(upgrade.status)}
                                  <span className="font-semibold text-white">{upgrade.playerName}</span>
                                  {getStatusBadge(upgrade.status)}
                                </div>
                                <div className="text-sm text-slate-400">
                                  <span className="font-mono">{upgrade.badgeName}</span>
                                  {" → "}
                                  <span className="capitalize">{upgrade.toLevel}</span>
                                  {attributesDisplay && (
                                    <span className="ml-2">({attributesDisplay})</span>
                                  )}
                                  {upgrade.gameNumber && (
                                    <span className="ml-2">• {upgrade.gameNumber}GM</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Requested by {upgrade.requestedByName || "Unknown"}
                                </div>
                              </div>
                              {upgrade.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                                    onClick={() => {
                                      setSelectedIds(new Set([upgrade.id]));
                                      setConfirmAction("approve");
                                    }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                    onClick={() => {
                                      setSelectedIds(new Set([upgrade.id]));
                                      setConfirmAction("reject");
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve" ? "Approve" : "Reject"} {selectedIds.size} Upgrades?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will {confirmAction === "approve" ? "approve" : "reject"} the selected upgrade requests.
              {confirmAction === "approve" && " Approved upgrades will be posted to the Discord log channel."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction && handleBulkAction(confirmAction)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
