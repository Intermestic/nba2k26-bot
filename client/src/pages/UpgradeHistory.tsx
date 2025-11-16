import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const VALID_TEAMS = [
  "Hawks", "Celtics", "Nets", "Hornets", "Bulls", "Cavaliers", "Mavs",
  "Nuggets", "Pistons", "Warriors", "Rockets", "Pacers", "Grizzlies",
  "Heat", "Bucks", "Timberwolves", "Pelicans", "Knicks", "Jazz",
  "Kings", "Lakers", "Magic", "Sixers", "Suns", "Trail Blazers",
  "Raptors", "Spurs", "Wizards"
];

export default function UpgradeHistory() {
  const [searchPlayer, setSearchPlayer] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: upgrades = [], isLoading } = trpc.upgrades.getAllUpgrades.useQuery({
    player: searchPlayer || undefined,
    team: filterTeam || undefined,
    status: filterStatus as any || undefined,
    limit: 200,
  });

  const { data: stats } = trpc.upgrades.getUpgradeStats.useQuery();

  const exportToCSV = () => {
    const headers = ["Player", "Team", "Badge", "From Level", "To Level", "Status", "Requested By", "Date", "Approved By"];
    const rows = upgrades.map(u => [
      u.playerName,
      u.team,
      u.badgeName,
      u.fromLevel,
      u.toLevel,
      u.status,
      u.requestedBy,
      u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd HH:mm") : "",
      u.approvedBy || ""
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upgrade-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
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
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Upgrade History</h1>
            <p className="text-muted-foreground mt-1">
              Track all badge upgrade requests and approvals
            </p>
          </div>
          <Button onClick={exportToCSV} disabled={upgrades.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Upgrades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Badges */}
        {stats && stats.byBadge.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top 10 Most Upgraded Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {stats.byBadge.map((badge, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium truncate">{badge.badge}</span>
                    <span className="text-sm text-muted-foreground ml-2">{badge.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by player name..."
                  value={searchPlayer}
                  onChange={(e) => setSearchPlayer(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Teams</SelectItem>
                  {VALID_TEAMS.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Upgrades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Requests ({upgrades.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : upgrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No upgrades found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Player</th>
                      <th className="text-left p-3 font-medium">Team</th>
                      <th className="text-left p-3 font-medium">Badge</th>
                      <th className="text-left p-3 font-medium">Upgrade</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Requested By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upgrades.map((upgrade) => (
                      <tr key={upgrade.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">
                          {upgrade.createdAt ? format(new Date(upgrade.createdAt), "MMM d, yyyy HH:mm") : "N/A"}
                        </td>
                        <td className="p-3 font-medium">{upgrade.playerName}</td>
                        <td className="p-3 text-sm">{upgrade.team}</td>
                        <td className="p-3 text-sm">{upgrade.badgeName}</td>
                        <td className="p-3 text-sm">
                          <span className="capitalize">{upgrade.fromLevel}</span>
                          {" → "}
                          <span className="capitalize font-medium">{upgrade.toLevel}</span>
                        </td>
                        <td className="p-3">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(upgrade.status)}`}>
                            {getStatusIcon(upgrade.status)}
                            <span className="capitalize">{upgrade.status}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{upgrade.requestedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
