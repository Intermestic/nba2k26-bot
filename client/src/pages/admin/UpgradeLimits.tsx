import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

export default function UpgradeLimits() {
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'at_cap' | 'near_cap'>('all');
  const [filterType, setFilterType] = useState<'all' | 'overall' | 'badge'>('all');

  const { data: teams } = trpc.upgradeLimits.getTeams.useQuery();
  const { data, isLoading } = trpc.upgradeLimits.getUpgradeLimitStatus.useQuery({
    filterTeam: filterTeam === 'all' ? undefined : filterTeam,
    filterStatus,
    filterType,
  });

  const exportToCSV = () => {
    if (!data?.players) return;

    const headers = [
      'Player Name',
      'Team',
      'Overall',
      'Rookie',
      '7-Game Usage',
      '7-Game Remaining',
      '7-Game Status',
      'Badge Upgrades',
      'Badge Remaining',
      'Badge Status',
    ];

    const rows = data.players.map((p: any) => [
      p.fullName,
      p.team,
      p.overall,
      p.isRookie ? 'Yes' : 'No',
      `+${p.sevenGameIncrease}`,
      p.sevenGameRemaining,
      p.sevenGameStatus,
      p.badgeUpgradesToSilver ?? 'N/A',
      p.badgeRemaining ?? 'N/A',
      p.badgeStatus,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upgrade-limits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'at_cap':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            At Cap
          </Badge>
        );
      case 'near_cap':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Near Cap
          </Badge>
        );
      case 'ok':
        return (
          <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
            <CheckCircle className="h-3 w-3" />
            OK
          </Badge>
        );
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upgrade Limits Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor players approaching or at their upgrade caps
        </p>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalPlayers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">7-Game At Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.summary.atCapOverall}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">7-Game Near Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.summary.nearCapOverall}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Badge At Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.summary.atCapBadge}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">Badge Near Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.summary.nearCapBadge}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter players by team, status, and upgrade type</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Team</label>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger>
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams?.map((team: string) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="at_cap">At Cap</SelectItem>
                <SelectItem value="near_cap">Near Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Upgrade Type</label>
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="overall">7-Game Overall</SelectItem>
                <SelectItem value="badge">Rookie Badges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>
            Click on a player to view their detailed upgrade history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.players && data.players.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Rookie</TableHead>
                    <TableHead>7-Game Usage</TableHead>
                    <TableHead>7-Game Remaining</TableHead>
                    <TableHead>7-Game Status</TableHead>
                    <TableHead>Badge Upgrades</TableHead>
                    <TableHead>Badge Remaining</TableHead>
                    <TableHead>Badge Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.players.map((player: any) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <Link href={`/player/${player.id}`} className="hover:underline font-medium">
                          {player.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{player.team}</TableCell>
                      <TableCell>{player.overall}</TableCell>
                      <TableCell>{player.isRookie ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <span className={player.sevenGameIncrease >= 6 ? 'text-red-600 font-semibold' : player.sevenGameIncrease >= 5 ? 'text-yellow-600 font-semibold' : ''}>
                          +{player.sevenGameIncrease}
                        </span>
                      </TableCell>
                      <TableCell>{player.sevenGameRemaining}</TableCell>
                      <TableCell>{getStatusBadge(player.sevenGameStatus)}</TableCell>
                      <TableCell>
                        {player.badgeUpgradesToSilver !== null ? (
                          <span className={player.badgeUpgradesToSilver >= 2 ? 'text-red-600 font-semibold' : player.badgeUpgradesToSilver >= 1 ? 'text-yellow-600 font-semibold' : ''}>
                            {player.badgeUpgradesToSilver}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{player.badgeRemaining ?? 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(player.badgeStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No players found matching the selected filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
