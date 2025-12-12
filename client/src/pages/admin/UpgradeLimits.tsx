import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Download, Loader2, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

export default function UpgradeLimits() {
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'at_cap' | 'near_cap'>('all');
  const [filterType, setFilterType] = useState<'all' | 'overall' | 'badge' | 'welcome' | 'fivegm' | 'rookie' | 'og'>('all');
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

  const toggleExpanded = (playerId: string) => {
    setExpandedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

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
      'Welcome Upgrades',
      'Welcome Remaining',
      '5GM Badges',
      'OG Upgrades',
      'Superstar Upgrades',
      'Activity Bonus',
      'Total Upgrades',
    ];

    const rows = data.players.map((p: any) => [
      p.fullName,
      p.team,
      p.overall,
      p.isRookie ? 'Yes' : 'No',
      p.sevenGameByAttribute?.map((a: any) => `${a.attribute}: ${a.used}/6`).join('; ') || 'None',
      p.sevenGameStatus,
      p.badgeUpgradesToSilver ?? 'N/A',
      p.badgeRemaining ?? 'N/A',
      p.badgeStatus,
      p.welcomeUpgrades,
      p.welcomeRemaining,
      p.fiveGameBadges,
      p.ogUpgrades,
      p.superstarUpgrades,
      p.activityBonusUpgrades,
      p.totalUpgrades,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player-upgrade-progress-${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Player Upgrade Progress</h1>
          <p className="text-muted-foreground mt-1">
            Track all player upgrades and monitor progress toward limits
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
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
              <CardTitle className="text-sm font-medium">Total Upgrades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalUpgrades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">7GM At Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.summary.atCapOverall}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">7GM Near</CardTitle>
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
              <CardTitle className="text-sm font-medium text-yellow-600">Badge Near</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.summary.nearCapBadge}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Welcome At Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.summary.atCapWelcome}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">Welcome Near</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.summary.nearCapWelcome}</div>
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
                <SelectItem value="welcome">Welcome Upgrades</SelectItem>
                <SelectItem value="fivegm">5-Game Badges</SelectItem>
                <SelectItem value="rookie">Rookies Only</SelectItem>
                <SelectItem value="og">OG Upgrades</SelectItem>
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
          <CardTitle>Player Upgrade Progress</CardTitle>
          <CardDescription>
            Comprehensive view of all player upgrades across all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.players && data.players.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>OVR</TableHead>
                    <TableHead>Rookie</TableHead>
                    <TableHead>7GM Attributes</TableHead>
                    <TableHead>7GM Status</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead>Badge Status</TableHead>
                    <TableHead>Welcome</TableHead>
                    <TableHead>Welcome Status</TableHead>
                    <TableHead>5GM</TableHead>
                    <TableHead>OG</TableHead>
                    <TableHead>Superstar</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.players.map((player: any) => (
                    <TableRow key={player.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <Link href={`/player/${player.id}`} className="hover:underline">
                          {player.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{player.team}</TableCell>
                      <TableCell>{player.overall}</TableCell>
                      <TableCell>{player.isRookie ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {player.sevenGameByAttribute && player.sevenGameByAttribute.length > 0 ? (
                          <div className="space-y-1">
                            <button
                              onClick={() => toggleExpanded(player.id)}
                              className="flex items-center gap-1 text-sm hover:underline"
                            >
                              {expandedPlayers.has(player.id) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              {player.sevenGameByAttribute.length} attribute{player.sevenGameByAttribute.length !== 1 ? 's' : ''}
                            </button>
                            {expandedPlayers.has(player.id) && (
                              <div className="ml-4 space-y-1 text-xs">
                                {player.sevenGameByAttribute.map((attr: any) => (
                                  <div key={attr.attribute} className="flex items-center gap-2">
                                    <span className="font-medium">{attr.attribute}:</span>
                                    <span className={
                                      attr.status === 'at_cap' ? 'text-red-600 font-semibold' :
                                      attr.status === 'near_cap' ? 'text-yellow-600 font-semibold' : ''
                                    }>
                                      +{attr.used}/6 ({attr.remaining} left)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(player.sevenGameStatus)}</TableCell>
                      <TableCell>
                        {player.badgeUpgradesToSilver !== null ? (
                          <span className={player.badgeUpgradesToSilver >= 2 ? 'text-red-600 font-semibold' : player.badgeUpgradesToSilver >= 1 ? 'text-yellow-600 font-semibold' : ''}>
                            {player.badgeUpgradesToSilver}/{player.badgeRemaining ?? 0} left
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(player.badgeStatus)}</TableCell>
                      <TableCell>
                        <span className={player.welcomeUpgrades >= 2 ? 'text-red-600 font-semibold' : player.welcomeUpgrades >= 1 ? 'text-yellow-600 font-semibold' : ''}>
                          {player.welcomeUpgrades}/{player.welcomeRemaining} left
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(player.welcomeStatus)}</TableCell>
                      <TableCell>{player.fiveGameBadges}</TableCell>
                      <TableCell>{player.ogUpgrades}</TableCell>
                      <TableCell>{player.superstarUpgrades}</TableCell>
                      <TableCell>{player.activityBonusUpgrades}</TableCell>
                      <TableCell className="font-semibold">{player.totalUpgrades}</TableCell>
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
