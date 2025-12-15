import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Download, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function CapCompliance() {
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: violations, isLoading: violationsLoading } = trpc.capViolations.getAll.useQuery({
    team: teamFilter !== "all" ? teamFilter : undefined,
    resolved: statusFilter === "active" ? false : statusFilter === "resolved" ? true : undefined,
    limit: 100
  });
  
  const { data: stats, isLoading: statsLoading } = trpc.capViolations.getStats.useQuery();
  
  // Get unique teams from violations
  const teams = violations
    ? Array.from(new Set(violations.map(v => v.team))).sort()
    : [];
  
  const exportToCSV = () => {
    if (!violations) return;
    
    const headers = ["Team", "Total OVR", "Over Cap", "Players", "Status", "Created", "Resolved"];
    const rows = violations.map(v => [
      v.team,
      v.totalOverall,
      v.overCap,
      v.playerCount,
      v.resolved ? "Resolved" : "Active",
      format(new Date(v.createdAt), "yyyy-MM-dd HH:mm"),
      v.resolvedAt ? format(new Date(v.resolvedAt), "yyyy-MM-dd HH:mm") : "N/A"
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cap-violations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (violationsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container max-w-7xl">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cap Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Track team cap violations, compliance status, and enforcement history
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">All-time violations recorded</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">Teams currently over cap</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</div>
              <p className="text-xs text-muted-foreground">Teams back under cap</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgResolutionHours || 0}h</div>
              <p className="text-xs text-muted-foreground">Average hours to comply</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Repeat Offenders */}
        {stats?.repeatOffenders && stats.repeatOffenders.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Repeat Offenders</CardTitle>
              <CardDescription>Teams with multiple cap violations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {stats.repeatOffenders.map(offender => (
                  <div key={offender.team} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{offender.team}</span>
                    <Badge variant="destructive">{offender.count} violations</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Filters and Export */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Violation History</CardTitle>
            <CardDescription>Filter and export cap violation records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Team</label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            
            {/* Violations Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Team</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Total OVR</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Over Cap</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Players</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Resolved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {violations && violations.length > 0 ? (
                      violations.map(violation => (
                        <tr key={violation.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{violation.team}</td>
                          <td className="px-4 py-3">{violation.totalOverall}</td>
                          <td className="px-4 py-3 text-destructive font-medium">+{violation.overCap}</td>
                          <td className="px-4 py-3">{violation.playerCount}/14</td>
                          <td className="px-4 py-3">
                            {violation.resolved ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Active</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(violation.createdAt), "MMM d, yyyy HH:mm")}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {violation.resolvedAt 
                              ? format(new Date(violation.resolvedAt), "MMM d, yyyy HH:mm")
                              : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No violations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
