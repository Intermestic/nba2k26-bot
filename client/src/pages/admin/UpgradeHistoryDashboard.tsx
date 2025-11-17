import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Download, Calendar, Filter, BarChart3, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function UpgradeHistoryDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [upgradeTypeFilter, setUpgradeTypeFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [playerFilter, setPlayerFilter] = useState<string>("");

  const { data: upgrades, isLoading } = trpc.upgrades.getAllUpgrades.useQuery();

  // Filter upgrades
  const filteredUpgrades = useMemo(() => {
    return upgrades?.filter((upgrade) => {
      const matchesSearch = 
        upgrade.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        upgrade.badgeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        upgrade.team?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || upgrade.status === statusFilter;
      const matchesType = upgradeTypeFilter === "all" || upgrade.upgradeType === upgradeTypeFilter;
      const matchesPlayer = !playerFilter || upgrade.playerName.toLowerCase().includes(playerFilter.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesType && matchesPlayer;
    });
  }, [upgrades, searchQuery, statusFilter, upgradeTypeFilter, playerFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredUpgrades) return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byType: {} as Record<string, number>,
      byPlayer: {} as Record<string, number>,
      plus6Violations: 0,
      backToBackCount: 0,
    };

    const byType: Record<string, number> = {};
    const byPlayer: Record<string, number> = {};
    let plus6Violations = 0;
    let backToBackCount = 0;

    filteredUpgrades.forEach((upgrade) => {
      // Count by type
      const type = upgrade.upgradeType || "Unknown";
      byType[type] = (byType[type] || 0) + 1;

      // Count by player
      byPlayer[upgrade.playerName] = (byPlayer[upgrade.playerName] || 0) + 1;

      // Check for +6 violations (if ruleViolations contains "+6")
      if (upgrade.ruleViolations) {
        try {
          const violations = JSON.parse(upgrade.ruleViolations as string);
          if (violations.some((v: string) => v.includes("+6") || v.includes("six"))) {
            plus6Violations++;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Check for back-to-back (if ruleViolations contains "back-to-back")
      if (upgrade.ruleViolations) {
        try {
          const violations = JSON.parse(upgrade.ruleViolations as string);
          if (violations.some((v: string) => v.toLowerCase().includes("back-to-back"))) {
            backToBackCount++;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    return {
      total: filteredUpgrades.length,
      pending: filteredUpgrades.filter((u) => u.status === "pending").length,
      approved: filteredUpgrades.filter((u) => u.status === "approved").length,
      rejected: filteredUpgrades.filter((u) => u.status === "rejected").length,
      byType,
      byPlayer,
      plus6Violations,
      backToBackCount,
    };
  }, [filteredUpgrades]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredUpgrades || filteredUpgrades.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Player", "Team", "Badge", "From", "To", "Type", "Status", "Game #", "Requested By", "Requested At", "Approved At"];
    const rows = filteredUpgrades.map((u) => [
      u.playerName,
      u.team,
      u.badgeName,
      u.fromLevel,
      u.toLevel,
      u.upgradeType || "Unknown",
      u.status,
      u.gameNumber || "",
      u.requestedByName || "",
      new Date(u.createdAt).toLocaleString(),
      u.approvedAt ? new Date(u.approvedAt).toLocaleString() : "",
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upgrade-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export successful");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string | null) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    return <Badge variant="outline" className="bg-blue-900/30 border-blue-700 text-blue-300">{type}</Badge>;
  };

  // Get top 5 players by upgrade count
  const topPlayers = Object.entries(stats.byPlayer)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Upgrade History Dashboard</h1>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Upgrades</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.plus6Violations}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              +6 Violations
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.backToBackCount}</div>
            <div className="text-sm text-muted-foreground">Back-to-Back</div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Type Breakdown */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upgrades by Type</CardTitle>
            <CardDescription>Distribution across upgrade categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(type)}
                    </div>
                    <div className="text-sm font-semibold">{count} upgrades</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Players</CardTitle>
            <CardDescription>Most upgrades requested</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPlayers.map(([player, count], index) => (
                <div key={player} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{player}</span>
                  </div>
                  <div className="text-sm font-semibold">{count} upgrades</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              placeholder="Filter by player..."
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={upgradeTypeFilter} onValueChange={setUpgradeTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Upgrade Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
                <SelectItem value="Welcome">Welcome</SelectItem>
                <SelectItem value="5-Game Badge">5-Game Badge</SelectItem>
                <SelectItem value="7-Game Attribute">7-Game Attribute</SelectItem>
                <SelectItem value="Rookie">Rookie</SelectItem>
                <SelectItem value="OG">OG</SelectItem>
                <SelectItem value="Superstar Pack">Superstar Pack</SelectItem>
                <SelectItem value="Activity Bonus">Activity Bonus</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setPlayerFilter("");
                setStatusFilter("all");
                setUpgradeTypeFilter("all");
                setSeasonFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade History</CardTitle>
          <CardDescription>
            {filteredUpgrades?.length || 0} upgrades found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredUpgrades && filteredUpgrades.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Upgrade</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Game #</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Approved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUpgrades.map((upgrade) => (
                    <TableRow key={upgrade.id}>
                      <TableCell className="font-medium">{upgrade.playerName}</TableCell>
                      <TableCell>{upgrade.team}</TableCell>
                      <TableCell className="font-mono text-sm">{upgrade.badgeName}</TableCell>
                      <TableCell>
                        <span className="capitalize">{upgrade.fromLevel}</span>
                        {" → "}
                        <span className="capitalize font-semibold">{upgrade.toLevel}</span>
                      </TableCell>
                      <TableCell>{getTypeBadge(upgrade.upgradeType)}</TableCell>
                      <TableCell>{getStatusBadge(upgrade.status)}</TableCell>
                      <TableCell>
                        {upgrade.gameNumber ? `${upgrade.gameNumber}GM` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(upgrade.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {upgrade.approvedAt ? new Date(upgrade.approvedAt).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No upgrades found matching your filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
