import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UpgradeHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: upgrades, isLoading } = trpc.upgrades.getAllUpgrades.useQuery();

  const filteredUpgrades = upgrades?.filter((upgrade) => {
    const matchesSearch = 
      upgrade.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upgrade.badgeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upgrade.team?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || upgrade.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Upgrade History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Badge Upgrade Requests</CardTitle>
          <CardDescription>
            View complete history of all badge upgrade requests and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by player, badge, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{upgrades?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {upgrades?.filter((u) => u.status === "pending").length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {upgrades?.filter((u) => u.status === "approved").length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {upgrades?.filter((u) => u.status === "rejected").length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredUpgrades && filteredUpgrades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUpgrades.map((upgrade) => (
                  <TableRow key={upgrade.id}>
                    <TableCell className="font-medium">{upgrade.playerName}</TableCell>
                    <TableCell>{upgrade.team || "—"}</TableCell>
                    <TableCell>{upgrade.badgeName}</TableCell>
                    <TableCell className="capitalize">{upgrade.toLevel}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {upgrade.attributes || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(upgrade.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(upgrade.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No upgrade requests found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
