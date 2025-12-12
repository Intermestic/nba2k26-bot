import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, Edit, History, Search, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function UpgradeManagement() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUpgrade, setSelectedUpgrade] = useState<any>(null);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  
  // Correction form fields
  const [correctedBadgeName, setCorrectedBadgeName] = useState("");
  const [correctedFromLevel, setCorrectedFromLevel] = useState<string>("");
  const [correctedToLevel, setCorrectedToLevel] = useState<string>("");
  const [correctedStatName, setCorrectedStatName] = useState("");
  const [correctedStatIncrease, setCorrectedStatIncrease] = useState("");
  const [correctedNewStatValue, setCorrectedNewStatValue] = useState("");

  const { data: allUpgrades, isLoading, refetch } = trpc.upgrades.getAllUpgrades.useQuery();
  const rollbackMutation = trpc.upgrades.rollbackUpgrade.useMutation();
  const correctionMutation = trpc.upgrades.correctUpgrade.useMutation();
  const { data: auditTrail, refetch: refetchAudit } = trpc.upgrades.getAuditTrail.useQuery(
    { upgradeId: selectedUpgrade?.id || 0 },
    { enabled: !!selectedUpgrade && auditDialogOpen }
  );

  // Filter only approved upgrades (completed upgrades that can be rolled back or corrected)
  const approvedUpgrades = useMemo(() => {
    return allUpgrades?.filter((u: any) => u.status === "approved") || [];
  }, [allUpgrades]);

  // Search filter
  const filteredUpgrades = useMemo(() => {
    if (!searchQuery) return approvedUpgrades;
    const query = searchQuery.toLowerCase();
    return approvedUpgrades.filter((u: any) =>
      u.playerName.toLowerCase().includes(query) ||
      u.badgeName?.toLowerCase().includes(query) ||
      u.team?.toLowerCase().includes(query)
    );
  }, [approvedUpgrades, searchQuery]);

  const openRollbackDialog = (upgrade: any) => {
    setSelectedUpgrade(upgrade);
    setRollbackReason("");
    setRollbackDialogOpen(true);
  };

  const openCorrectionDialog = (upgrade: any) => {
    setSelectedUpgrade(upgrade);
    setCorrectionReason("");
    setCorrectedBadgeName(upgrade.badgeName || "");
    setCorrectedFromLevel(upgrade.fromLevel || "");
    setCorrectedToLevel(upgrade.toLevel || "");
    setCorrectedStatName(upgrade.statName || "");
    setCorrectedStatIncrease(upgrade.statIncrease?.toString() || "");
    setCorrectedNewStatValue(upgrade.newStatValue?.toString() || "");
    setCorrectionDialogOpen(true);
  };

  const openAuditDialog = (upgrade: any) => {
    setSelectedUpgrade(upgrade);
    setAuditDialogOpen(true);
    refetchAudit();
  };

  const handleRollback = async () => {
    if (!selectedUpgrade) return;

    try {
      await rollbackMutation.mutateAsync({
        upgradeId: selectedUpgrade.id,
        reason: rollbackReason,
        performedBy: 1, // TODO: Get from auth context
        performedByName: "Admin", // TODO: Get from auth context
      });
      toast.success("Upgrade rolled back successfully");
      setRollbackDialogOpen(false);
      setSelectedUpgrade(null);
      refetch();
    } catch (error) {
      toast.error("Failed to rollback upgrade");
      console.error(error);
    }
  };

  const handleCorrection = async () => {
    if (!selectedUpgrade) return;

    try {
      const correctionData: any = {
        upgradeId: selectedUpgrade.id,
        reason: correctionReason,
        performedBy: 1, // TODO: Get from auth context
        performedByName: "Admin", // TODO: Get from auth context
      };

      // Only include changed fields
      if (correctedBadgeName !== selectedUpgrade.badgeName) {
        correctionData.badgeName = correctedBadgeName;
      }
      if (correctedFromLevel !== selectedUpgrade.fromLevel) {
        correctionData.fromLevel = correctedFromLevel;
      }
      if (correctedToLevel !== selectedUpgrade.toLevel) {
        correctionData.toLevel = correctedToLevel;
      }
      if (correctedStatName !== selectedUpgrade.statName) {
        correctionData.statName = correctedStatName;
      }
      if (correctedStatIncrease && parseInt(correctedStatIncrease) !== selectedUpgrade.statIncrease) {
        correctionData.statIncrease = parseInt(correctedStatIncrease);
      }
      if (correctedNewStatValue && parseInt(correctedNewStatValue) !== selectedUpgrade.newStatValue) {
        correctionData.newStatValue = parseInt(correctedNewStatValue);
      }

      await correctionMutation.mutateAsync(correctionData);
      toast.success("Upgrade corrected successfully");
      setCorrectionDialogOpen(false);
      setSelectedUpgrade(null);
      refetch();
    } catch (error) {
      toast.error("Failed to correct upgrade");
      console.error(error);
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString();
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upgrade Management</h1>
            <p className="text-slate-400">Rollback or correct completed upgrades</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Approved Upgrades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{approvedUpgrades.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Badge Upgrades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {approvedUpgrades.filter((u: any) => u.badgeName).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Attribute Upgrades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {approvedUpgrades.filter((u: any) => u.statName).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by player name, badge, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upgrades Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Completed Upgrades</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Player</TableHead>
                  <TableHead className="text-slate-400">Team</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Details</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUpgrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                      No approved upgrades found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUpgrades.map((upgrade: any) => (
                    <TableRow key={upgrade.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">{upgrade.playerName}</TableCell>
                      <TableCell className="text-slate-300">{upgrade.team}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-900/30 border-blue-700 text-blue-300">
                          {upgrade.upgradeType || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {upgrade.badgeName ? (
                          <span>
                            {upgrade.badgeName} ({upgrade.fromLevel} → {upgrade.toLevel})
                          </span>
                        ) : upgrade.statName ? (
                          <span>
                            {upgrade.statName}: +{upgrade.statIncrease} (→ {upgrade.newStatValue})
                          </span>
                        ) : (
                          <span className="text-slate-500">No details</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(upgrade.completedAt || upgrade.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCorrectionDialog(upgrade)}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            title="Edit upgrade details"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRollbackDialog(upgrade)}
                            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                            title="Completely undo this upgrade"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Rollback
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAuditDialog(upgrade)}
                            className="text-slate-400 hover:text-white"
                            title="View audit trail"
                          >
                            <History className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rollback Confirmation Dialog */}
        <AlertDialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Rollback Upgrade</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will completely undo the upgrade for <strong>{selectedUpgrade?.playerName}</strong>.
                The original request will be reverted to pending status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
              <Label htmlFor="rollback-reason" className="text-slate-300">
                Reason for rollback (optional)
              </Label>
              <Textarea
                id="rollback-reason"
                placeholder="Explain why this upgrade is being rolled back..."
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                className="mt-2 bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRollback}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Rollback Upgrade
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Correction Dialog */}
        <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Correct Upgrade</DialogTitle>
              <DialogDescription className="text-slate-400">
                Edit the details of this upgrade for <strong>{selectedUpgrade?.playerName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <div>
                <Label htmlFor="correction-reason" className="text-slate-300">
                  Reason for correction (optional)
                </Label>
                <Textarea
                  id="correction-reason"
                  placeholder="Explain what is being corrected..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="mt-2 bg-slate-900 border-slate-700 text-white"
                />
              </div>

              {selectedUpgrade?.badgeName && (
                <>
                  <div>
                    <Label htmlFor="badge-name" className="text-slate-300">Badge Name</Label>
                    <Input
                      id="badge-name"
                      value={correctedBadgeName}
                      onChange={(e) => setCorrectedBadgeName(e.target.value)}
                      className="mt-2 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-level" className="text-slate-300">From Level</Label>
                      <Select value={correctedFromLevel} onValueChange={setCorrectedFromLevel}>
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="bronze">Bronze</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="to-level" className="text-slate-300">To Level</Label>
                      <Select value={correctedToLevel} onValueChange={setCorrectedToLevel}>
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="bronze">Bronze</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {selectedUpgrade?.statName && (
                <>
                  <div>
                    <Label htmlFor="stat-name" className="text-slate-300">Attribute Name</Label>
                    <Input
                      id="stat-name"
                      value={correctedStatName}
                      onChange={(e) => setCorrectedStatName(e.target.value)}
                      className="mt-2 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stat-increase" className="text-slate-300">Increase Amount</Label>
                      <Input
                        id="stat-increase"
                        type="number"
                        value={correctedStatIncrease}
                        onChange={(e) => setCorrectedStatIncrease(e.target.value)}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-stat-value" className="text-slate-300">New Value</Label>
                      <Input
                        id="new-stat-value"
                        type="number"
                        value={correctedNewStatValue}
                        onChange={(e) => setCorrectedNewStatValue(e.target.value)}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCorrectionDialogOpen(false)}
                className="bg-slate-700 text-white hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCorrection}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Correction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audit Trail Dialog */}
        <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Audit Trail</DialogTitle>
              <DialogDescription className="text-slate-400">
                History of changes for {selectedUpgrade?.playerName}'s upgrade
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              {!auditTrail || auditTrail.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No audit trail entries found</p>
              ) : (
                <div className="space-y-4">
                  {auditTrail.map((entry: any) => (
                    <Card key={entry.id} className="bg-slate-900 border-slate-700">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={entry.actionType === "rollback" ? "destructive" : "default"}
                            className={entry.actionType === "rollback" ? "bg-orange-600" : "bg-blue-600"}
                          >
                            {entry.actionType}
                          </Badge>
                          <span className="text-sm text-slate-400">{formatDate(entry.createdAt)}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-slate-400">Performed by:</span>{" "}
                            <span className="text-white">{entry.performedByName}</span>
                          </div>
                          {entry.reason && (
                            <div className="text-sm">
                              <span className="text-slate-400">Reason:</span>{" "}
                              <span className="text-white">{entry.reason}</span>
                            </div>
                          )}
                          {entry.actionType === "correction" && (
                            <div className="text-sm mt-3">
                              <div className="font-semibold text-slate-300 mb-2">Changes:</div>
                              <div className="space-y-1 pl-4 border-l-2 border-slate-700">
                                {entry.originalBadgeName !== entry.correctedBadgeName && (
                                  <div>
                                    <span className="text-slate-400">Badge:</span>{" "}
                                    <span className="text-red-400 line-through">{entry.originalBadgeName}</span>
                                    {" → "}
                                    <span className="text-green-400">{entry.correctedBadgeName}</span>
                                  </div>
                                )}
                                {entry.originalFromLevel !== entry.correctedFromLevel && (
                                  <div>
                                    <span className="text-slate-400">From Level:</span>{" "}
                                    <span className="text-red-400 line-through">{entry.originalFromLevel}</span>
                                    {" → "}
                                    <span className="text-green-400">{entry.correctedFromLevel}</span>
                                  </div>
                                )}
                                {entry.originalToLevel !== entry.correctedToLevel && (
                                  <div>
                                    <span className="text-slate-400">To Level:</span>{" "}
                                    <span className="text-red-400 line-through">{entry.originalToLevel}</span>
                                    {" → "}
                                    <span className="text-green-400">{entry.correctedToLevel}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAuditDialogOpen(false)}
                className="bg-slate-700 text-white hover:bg-slate-600"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
