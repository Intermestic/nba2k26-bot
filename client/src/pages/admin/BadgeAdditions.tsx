import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Users, TrendingUp } from "lucide-react";

export default function BadgeAdditions() {
  const [playerFilter, setPlayerFilter] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("");
  const [silverFilter, setSilverFilter] = useState<string>("all");

  // Fetch badge additions with filters
  const { data: additions, isLoading: additionsLoading } = trpc.badgeAdditions.getAll.useQuery({
    badgeName: badgeFilter || undefined,
    silverOnly: silverFilter === "silver" ? true : undefined,
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = trpc.badgeAdditions.getStats.useQuery();

  // Fetch player-grouped data
  const { data: byPlayer, isLoading: byPlayerLoading } = trpc.badgeAdditions.getByPlayer.useQuery();

  // Filter additions by player name (client-side)
  const filteredAdditions = additions?.filter((add) =>
    playerFilter ? add.playerName.toLowerCase().includes(playerFilter.toLowerCase()) : true
  );

  // Filter by player data (client-side)
  const filteredByPlayer = byPlayer?.filter((p) =>
    playerFilter ? p.playerName.toLowerCase().includes(playerFilter.toLowerCase()) : true
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Badge Additions Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Track rookie badge additions and silver upgrade usage
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Badge Additions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalAdditions || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Silver Upgrades Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats?.silverUpgrades || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rookies with Additions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats?.rookiesWithAdditions || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter badge additions by player, badge, or silver status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="player-filter">Player Name</Label>
                <Input
                  id="player-filter"
                  placeholder="Search by player name..."
                  value={playerFilter}
                  onChange={(e) => setPlayerFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge-filter">Badge Name</Label>
                <Input
                  id="badge-filter"
                  placeholder="Search by badge name..."
                  value={badgeFilter}
                  onChange={(e) => setBadgeFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="silver-filter">Silver Status</Label>
                <Select value={silverFilter} onValueChange={setSilverFilter}>
                  <SelectTrigger id="silver-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Badges</SelectItem>
                    <SelectItem value="silver">Silver Only</SelectItem>
                    <SelectItem value="non-silver">Non-Silver Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Additions by Player</CardTitle>
            <CardDescription>Summary of badge additions grouped by player</CardDescription>
          </CardHeader>
          <CardContent>
            {byPlayerLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Additions</TableHead>
                    <TableHead className="text-right">Silver Upgrades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredByPlayer && filteredByPlayer.length > 0 ? (
                    filteredByPlayer.map((player) => (
                      <TableRow key={player.playerId}>
                        <TableCell className="font-medium">{player.playerName}</TableCell>
                        <TableCell>{player.teamName}</TableCell>
                        <TableCell>
                          {player.isRookie === 1 ? (
                            <Badge variant="secondary">Rookie</Badge>
                          ) : (
                            <Badge variant="outline">Veteran</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{player.totalAdditions}</TableCell>
                        <TableCell className="text-right">{player.silverUpgrades}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No players found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detailed Badge Additions */}
        <Card>
          <CardHeader>
            <CardTitle>All Badge Additions</CardTitle>
            <CardDescription>Detailed list of all badge additions</CardDescription>
          </CardHeader>
          <CardContent>
            {additionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead>Silver Upgrade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdditions && filteredAdditions.length > 0 ? (
                    filteredAdditions.map((addition) => (
                      <TableRow key={addition.id}>
                        <TableCell className="font-medium">{addition.playerName}</TableCell>
                        <TableCell>{addition.teamName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{addition.badgeName}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(addition.addedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          {addition.usedForSilver === 1 ? (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">Silver</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No badge additions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
