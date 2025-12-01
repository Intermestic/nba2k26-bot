import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Activity, Award, BarChart3 } from "lucide-react";

export default function UpgradeLogDashboard() {
  const [searchPlayer, setSearchPlayer] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string | undefined>();
  const [upgradeTypeFilter, setUpgradeTypeFilter] = useState<"Badge" | "Attribute" | undefined>();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: statistics, isLoading: statsLoading } = trpc.upgradeLog.getStatistics.useQuery();
  
  const { data: upgrades, isLoading: upgradesLoading } = trpc.upgradeLog.getAll.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    playerName: searchPlayer || undefined,
    userName: searchUser || undefined,
    sourceType: sourceTypeFilter,
    upgradeType: upgradeTypeFilter,
  });

  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
  };

  const handleReset = () => {
    setSearchPlayer("");
    setSearchUser("");
    setSourceTypeFilter(undefined);
    setUpgradeTypeFilter(undefined);
    setPage(0);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upgrade Log Dashboard</h1>
        <p className="text-muted-foreground">
          Complete history of all player upgrades from various sources (Voting, Welcome, Game, Rookie, OG, etc.)
        </p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : statistics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Upgrades</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overall.totalUpgrades.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Players</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overall.uniquePlayers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Players with upgrades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Badge Upgrades</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overall.badgeUpgrades.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {((statistics.overall.badgeUpgrades / statistics.overall.totalUpgrades) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attribute Upgrades</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overall.attributeUpgrades.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {((statistics.overall.attributeUpgrades / statistics.overall.totalUpgrades) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Source Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Upgrades by Source
              </CardTitle>
              <CardDescription>Breakdown of upgrades by source type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {statistics.bySource.map((source) => (
                  <div key={source.sourceType} className="flex flex-col items-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{source.count}</div>
                    <div className="text-sm text-muted-foreground text-center">{source.sourceType}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Players */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Players by Upgrade Count</CardTitle>
              <CardDescription>Players with the most upgrades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics.topPlayers.map((player, index) => (
                  <div key={player.playerName} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{player.playerName}</span>
                    </div>
                    <Badge>{player.upgradeCount} upgrades</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific upgrades by player, user, source, or type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Search by player name..."
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
            />
            <Input
              placeholder="Search by user name..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            <Select value={sourceTypeFilter} onValueChange={(value) => setSourceTypeFilter(value === "all" ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Source Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Voting">Voting</SelectItem>
                <SelectItem value="Welcome">Welcome</SelectItem>
                <SelectItem value="Game">Game</SelectItem>
                <SelectItem value="Rookie">Rookie</SelectItem>
                <SelectItem value="OG">OG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={upgradeTypeFilter} onValueChange={(value) => setUpgradeTypeFilter(value === "all" ? undefined : value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Upgrade Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Badge">Badge</SelectItem>
                <SelectItem value="Attribute">Attribute</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">Search</Button>
              <Button onClick={handleReset} variant="outline">Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade History</CardTitle>
          <CardDescription>
            {upgrades ? `Showing ${upgrades.length} upgrades` : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upgradesLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : upgrades && upgrades.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Badge/Attribute</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upgrades.map((upgrade) => (
                    <TableRow key={upgrade.id}>
                      <TableCell className="whitespace-nowrap">{upgrade.date}</TableCell>
                      <TableCell className="font-medium">{upgrade.playerName}</TableCell>
                      <TableCell>{upgrade.userName}</TableCell>
                      <TableCell>
                        <Badge variant={upgrade.upgradeType === "Badge" ? "default" : "secondary"}>
                          {upgrade.upgradeType}
                        </Badge>
                      </TableCell>
                      <TableCell>{upgrade.badgeOrAttribute}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{upgrade.fromValue || "None"}</span>
                        {" → "}
                        <span className="font-medium">{upgrade.toValue}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{upgrade.sourceType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {upgrade.sourceDetail}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={upgrades.length < pageSize}
                >
                  Next
                </Button>
              </div>
            </>
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
