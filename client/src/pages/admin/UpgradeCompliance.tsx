import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Info, PlayCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function UpgradeCompliance() {
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  const { data: stats, refetch: refetchStats } = trpc.upgradeCompliance.getViolationStats.useQuery();
  const { data: violations, refetch: refetchViolations } = trpc.upgradeCompliance.getViolations.useQuery({
    resolved: false,
    limit: 100,
  });
  const { data: auditHistory } = trpc.upgradeCompliance.getAuditHistory.useQuery({ limit: 10 });
  const { data: rulesData } = trpc.upgradeCompliance.getRules.useQuery();

  const runAuditMutation = trpc.upgradeCompliance.runFullAudit.useMutation({
    onSuccess: (data) => {
      setIsRunningAudit(false);
      toast.success(`Audit complete! Found ${data.violationsFound} violations in ${data.totalChecked} upgrades.`);
      refetchStats();
      refetchViolations();
    },
    onError: (error) => {
      setIsRunningAudit(false);
      toast.error(`Audit failed: ${error.message}`);
    },
  });

  const resolveViolationMutation = trpc.upgradeCompliance.resolveViolation.useMutation({
    onSuccess: () => {
      toast.success("Violation resolved");
      setSelectedViolation(null);
      setResolveNotes("");
      refetchStats();
      refetchViolations();
    },
    onError: (error) => {
      toast.error(`Failed to resolve violation: ${error.message}`);
    },
  });

  const handleRunAudit = () => {
    setIsRunningAudit(true);
    runAuditMutation.mutate({ createdBy: "Admin" });
  };

  const handleResolveViolation = () => {
    if (!selectedViolation) return;
    resolveViolationMutation.mutate({
      id: selectedViolation.id,
      resolvedBy: "Admin",
      notes: resolveNotes,
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>;
      case "WARNING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
      case "INFO":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upgrade Compliance</h1>
          <p className="text-muted-foreground mt-2">
            Audit and validate all player upgrades against the official upgrade rules
          </p>
        </div>
        <Button
          onClick={handleRunAudit}
          disabled={isRunningAudit}
          size="lg"
        >
          {isRunningAudit ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Audit...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Full Audit
            </>
          )}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.bySeverity.ERROR || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats?.bySeverity.WARNING || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats?.resolved || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="history">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Violations</CardTitle>
              <CardDescription>
                Unresolved compliance violations found in upgrade logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!violations || violations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No violations found</p>
                  <p className="text-sm">All upgrades are compliant with the rules</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Upgrade Type</TableHead>
                      <TableHead>Violation</TableHead>
                      <TableHead>Rule Violated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(violation.severity)}
                            {getSeverityBadge(violation.severity)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{violation.playerName || "Unknown"}</TableCell>
                        <TableCell>{violation.upgradeType}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {violation.violationType}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate" title={violation.ruleViolated}>
                            {violation.ruleViolated}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{violation.details}</p>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedViolation(violation)}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Rules</CardTitle>
              <CardDescription>
                All upgrade rules loaded from the rules database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesData?.grouped && Object.entries(rulesData.grouped).map(([upgradeType, rules]) => (
                <div key={upgradeType} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">{upgradeType}</h3>
                  <div className="space-y-2">
                    {rules.map((rule: any) => (
                      <div key={rule.id} className="border-l-2 border-primary pl-4 py-2">
                        <Badge variant="outline" className="mb-2">{rule.category}</Badge>
                        <p className="text-sm">{rule.ruleText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>
                Previous audit runs and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!auditHistory || auditHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">No audits run yet</p>
                  <p className="text-sm">Click "Run Full Audit" to start your first audit</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Checked</TableHead>
                      <TableHead>Violations</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditHistory.map((audit) => {
                      const duration = audit.completedAt && audit.startedAt
                        ? Math.round((new Date(audit.completedAt).getTime() - new Date(audit.startedAt).getTime()) / 1000)
                        : null;

                      return (
                        <TableRow key={audit.id}>
                          <TableCell>{new Date(audit.startedAt).toLocaleString()}</TableCell>
                          <TableCell>{audit.auditType}</TableCell>
                          <TableCell>
                            <Badge variant={audit.status === "COMPLETED" ? "default" : audit.status === "FAILED" ? "destructive" : "secondary"}>
                              {audit.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{audit.totalChecked}</TableCell>
                          <TableCell>{audit.violationsFound}</TableCell>
                          <TableCell>{duration ? `${duration}s` : "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Violation Dialog */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Violation</DialogTitle>
            <DialogDescription>
              Mark this violation as resolved and add notes about the resolution
            </DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Player: {selectedViolation.playerName}</p>
                <p className="text-sm text-muted-foreground">Upgrade Type: {selectedViolation.upgradeType}</p>
                <p className="text-sm text-muted-foreground mt-2">{selectedViolation.ruleViolated}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Explain why this violation is being resolved..."
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedViolation(null)}>
              Cancel
            </Button>
            <Button onClick={handleResolveViolation}>
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
