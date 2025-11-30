import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { 
  Coins, History, Plus, Minus, RotateCcw, UserMinus, UserPlus, DollarSign, 
  ArrowUpDown, ArrowUp, ArrowDown, Download, Search, Trophy, Clock, 
  CheckCircle, AlertCircle, RefreshCw
} from "lucide-react";
import { format } from "date-fns";

function TransactionActions({ transactionId, onSuccess }: { transactionId: number; onSuccess: () => void }) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<{
    title: string;
    description: string;
    action: () => Promise<any>;
  } | null>(null);

  const sendAllBackMutation = trpc.coins.sendAllBack.useMutation();
  const removeSignedMutation = trpc.coins.removeSignedPlayer.useMutation();
  const resignCutMutation = trpc.coins.resignCutPlayer.useMutation();
  const returnCoinsMutation = trpc.coins.returnCoinsOnly.useMutation();

  const handleAction = (title: string, description: string, action: () => Promise<any>) => {
    setAlertAction({ title, description, action });
    setAlertOpen(true);
  };

  const executeAction = async () => {
    if (!alertAction) return;

    try {
      await alertAction.action();
      toast.success("Action completed successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    } finally {
      setAlertOpen(false);
      setAlertAction(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              handleAction(
                "Send All Back",
                "This will return the signed player to Free Agents, restore the cut player to the team, and refund the coins.",
                () => sendAllBackMutation.mutateAsync({ transactionId })
              )
            }
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Send All Back
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleAction(
                "Remove Signed Player",
                "This will return the signed player to Free Agents and refund the coins. The cut player will remain removed.",
                () => removeSignedMutation.mutateAsync({ transactionId })
              )
            }
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Remove Signed Player
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleAction(
                "Re-sign Cut Player",
                "This will restore the cut player to the team. The signed player and coins will remain unchanged.",
                () => resignCutMutation.mutateAsync({ transactionId })
              )
            }
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Re-sign Cut Player
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleAction(
                "Return Coins Only",
                "This will refund the coins without making any roster changes.",
                () => returnCoinsMutation.mutateAsync({ transactionId })
              )
            }
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Return Coins Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function FAManagement() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: teamCoins, refetch: refetchCoins } = trpc.coins.getAllTeamCoins.useQuery(undefined, {
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  });
  const { data: transactions, refetch: refetchTransactions } = trpc.coins.getTransactionHistory.useQuery();
  const { data: allBids, refetch: refetchBids } = trpc.coins.getAllBids.useQuery(undefined, {
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
  const { data: windows = [] } = trpc.coins.getBidWindows.useQuery();
  
  const adjustCoinsMutation = trpc.coins.adjustCoins.useMutation();

  // Coin adjustment dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");

  // Transaction filters and sorting
  const [sortField, setSortField] = useState<'date' | 'team' | 'dropped' | 'signed' | 'ovr' | 'bid' | 'remaining' | 'admin'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [playerFilter, setPlayerFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Bid filters
  const [bidWindowFilter, setBidWindowFilter] = useState<string>("all");
  const [bidTeamFilter, setBidTeamFilter] = useState<string>("all");

  const handleAdjustCoins = async () => {
    if (!selectedTeam || !adjustAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseInt(adjustAmount);
    if (isNaN(amount)) {
      toast.error("Invalid amount");
      return;
    }

    try {
      await adjustCoinsMutation.mutateAsync({
        team: selectedTeam,
        amount,
        reason: adjustReason || "Manual adjustment"
      });
      toast.success(`Adjusted ${selectedTeam} coins by ${amount > 0 ? '+' : ''}${amount}`);
      setAdjustDialogOpen(false);
      setSelectedTeam("");
      setAdjustAmount("");
      setAdjustReason("");
      refetchCoins();
    } catch (error) {
      toast.error("Failed to adjust coins");
      console.error(error);
    }
  };

  const openAdjustDialog = (team: string) => {
    setSelectedTeam(team);
    setAdjustDialogOpen(true);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = [...transactions];
    
    if (teamFilter !== 'all') {
      filtered = filtered.filter(t => t.team === teamFilter);
    }
    
    if (playerFilter) {
      const search = playerFilter.toLowerCase();
      filtered = filtered.filter(t => 
        t.signPlayer.toLowerCase().includes(search) || 
        t.dropPlayer.toLowerCase().includes(search)
      );
    }
    
    if (statusFilter === 'active') {
      filtered = filtered.filter(t => !t.rolledBack);
    } else if (statusFilter === 'rolled-back') {
      filtered = filtered.filter(t => t.rolledBack);
    }
    
    return filtered;
  }, [transactions, teamFilter, playerFilter, statusFilter]);

  const sortedTransactions = useMemo(() => {
    return filteredTransactions.slice().sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime();
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
        case 'dropped':
          comparison = a.dropPlayer.localeCompare(b.dropPlayer);
          break;
        case 'signed':
          comparison = a.signPlayer.localeCompare(b.signPlayer);
          break;
        case 'ovr':
          comparison = (a.signPlayerOvr || 0) - (b.signPlayerOvr || 0);
          break;
        case 'bid':
          comparison = a.bidAmount - b.bidAmount;
          break;
        case 'remaining':
          comparison = a.coinsRemaining - b.coinsRemaining;
          break;
        case 'admin':
          comparison = (a.adminUser || '').localeCompare(b.adminUser || '');
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortDirection]);

  // Filter bids
  const filteredBids = useMemo(() => {
    if (!allBids) return [];
    
    return allBids.filter(bid => {
      const matchesWindow = bidWindowFilter === "all" || bid.windowId === bidWindowFilter;
      const matchesTeam = bidTeamFilter === "all" || bid.team === bidTeamFilter;
      return matchesWindow && matchesTeam;
    });
  }, [allBids, bidWindowFilter, bidTeamFilter]);

  // Group bids by player and determine winners
  const playerBids = useMemo(() => {
    const grouped: Record<string, {
      playerName: string;
      bids: typeof allBids;
      highBid: number;
      winner: string | null;
    }> = {};

    filteredBids.forEach(bid => {
      if (!grouped[bid.playerName]) {
        grouped[bid.playerName] = {
          playerName: bid.playerName,
          bids: [],
          highBid: 0,
          winner: null
        };
      }
      grouped[bid.playerName].bids.push(bid);
      if (bid.bidAmount > grouped[bid.playerName].highBid) {
        grouped[bid.playerName].highBid = bid.bidAmount;
        grouped[bid.playerName].winner = bid.team;
      }
    });

    return Object.values(grouped).sort((a, b) => b.highBid - a.highBid);
  }, [filteredBids]);

  // Calculate team commitments
  const teamCommitments = useMemo(() => {
    const commitments: Record<string, number> = {};
    
    playerBids.forEach(({ winner, highBid }) => {
      if (winner) {
        commitments[winner] = (commitments[winner] || 0) + highBid;
      }
    });

    return Object.entries(commitments)
      .map(([team, amount]) => ({ team, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [playerBids]);

  const exportToCSV = () => {
    const headers = [
      'ID', 'Team', 'Drop Player', 'Sign Player', 'OVR', 'Bid Amount', 
      'Coins Remaining', 'Processed By', 'Processed At', 'Batch ID', 
      'Rolled Back', 'Rolled Back At', 'Rolled Back By'
    ];
    
    const rows = sortedTransactions.map(t => [
      t.id,
      t.team,
      t.dropPlayer,
      t.signPlayer,
      t.signPlayerOvr || 'N/A',
      t.bidAmount,
      t.coinsRemaining,
      t.adminUser || 'N/A',
      new Date(t.processedAt).toLocaleString(),
      t.batchId || 'N/A',
      t.rolledBack ? 'Yes' : 'No',
      t.rolledBackAt ? new Date(t.rolledBackAt).toLocaleString() : 'N/A',
      t.rolledBackBy || 'N/A'
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fa-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Transaction history exported to CSV');
  };

  const refreshAll = () => {
    refetchCoins();
    refetchTransactions();
    refetchBids();
    toast.success("Data refreshed");
  };

  const teams = Array.from(new Set(transactions?.map(t => t.team) || [])).sort();
  const bidTeams = Array.from(new Set(allBids?.map(b => b.team) || [])).sort();

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be an admin to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">FA Management Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive free agency management: bids, transactions, coins, and reversals
          </p>
        </div>
        <Button onClick={refreshAll} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bids">Active Bids</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="coins">Coin Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Active Bids
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{allBids?.length || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {playerBids.length} unique players
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{transactions?.length || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {transactions?.filter(t => !t.rolledBack).length || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  Total Commitment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ${teamCommitments.reduce((sum, { amount }) => sum + amount, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {teamCommitments.length} teams
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team Coin Balances Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Team Coin Balances
              </CardTitle>
              <CardDescription>
                Current FA coin balances for all teams (Default: 100, Nuggets/Hawks: 115)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {teamCoins?.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-3 bg-muted rounded border cursor-pointer hover:bg-muted/80"
                    onClick={() => openAdjustDialog(tc.team)}
                  >
                    <div className="text-sm font-medium">{tc.team}</div>
                    <div className={`text-2xl font-bold ${
                      tc.coinsRemaining < 20 ? 'text-red-500' :
                      tc.coinsRemaining < 50 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      ${tc.coinsRemaining}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Commitments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Team Commitments (Winning Bids)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {teamCommitments.map(({ team, amount }) => (
                  <div key={team} className="flex justify-between items-center p-3 rounded bg-muted">
                    <span className="font-medium">{team}</span>
                    <span className="text-green-500 font-bold">${amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Bids Tab */}
        <TabsContent value="bids" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Bid Window</Label>
                  <Select value={bidWindowFilter} onValueChange={setBidWindowFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Windows" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Windows</SelectItem>
                      {windows.map((w: any) => (
                        <SelectItem key={w.windowId} value={w.windowId}>
                          {w.windowId} ({w.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Team</Label>
                  <Select value={bidTeamFilter} onValueChange={setBidTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {bidTeams.map(team => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Bids with Winners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Bid Summary & Winners ({playerBids.length} players)
              </CardTitle>
              <CardDescription>
                Showing highest bid and winner for each player
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>High Bid</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead>All Bids</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerBids.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No active bids
                      </TableCell>
                    </TableRow>
                  ) : (
                    playerBids.map(({ playerName, highBid, winner, bids }) => (
                      <TableRow key={playerName}>
                        <TableCell className="font-medium">{playerName}</TableCell>
                        <TableCell className="text-green-500 font-bold">${highBid}</TableCell>
                        <TableCell>
                          {winner && (
                            <Badge className="bg-yellow-600">
                              <Trophy className="w-3 h-3 mr-1" />
                              {winner}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {bids
                              .sort((a: any, b: any) => b.bidAmount - a.bidAmount)
                              .map((bid: any, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant={bid.team === winner ? "default" : "outline"}
                                  className={bid.team === winner ? "bg-yellow-600" : ""}
                                >
                                  {bid.team}: ${bid.bidAmount}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* All Bids Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                All Active Bids ({filteredBids.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredBids.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No active bids</p>
                ) : (
                  filteredBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between p-4 bg-muted rounded border hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                            {bid.team}
                          </Badge>
                          <span className="font-medium">{bid.playerName}</span>
                          {bid.dropPlayer && (
                            <span className="text-muted-foreground text-sm">
                              (drops {bid.dropPlayer})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{bid.bidderName}</span>
                          <span>•</span>
                          <span>${bid.bidAmount}</span>
                          <span>•</span>
                          <span>{bid.windowId}</span>
                          <span>•</span>
                          <span>{format(new Date(bid.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Team</Label>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Player</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search player..."
                      value={playerFilter}
                      onChange={(e) => setPlayerFilter(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="rolled-back">Rolled Back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transaction History ({sortedTransactions.length})
                </CardTitle>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <CardDescription>
                All FA transactions with reversal actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('date')}>
                          Date {getSortIcon('date')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('team')}>
                          Team {getSortIcon('team')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('dropped')}>
                          Dropped {getSortIcon('dropped')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('signed')}>
                          Signed {getSortIcon('signed')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('ovr')}>
                          OVR {getSortIcon('ovr')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('bid')}>
                          Bid {getSortIcon('bid')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('remaining')}>
                          Remaining {getSortIcon('remaining')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('admin')}>
                          Admin {getSortIcon('admin')}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className={transaction.rolledBack ? 'opacity-50' : ''}>
                          <TableCell className="text-sm">
                            {format(new Date(transaction.processedAt), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell className="font-medium">{transaction.team}</TableCell>
                          <TableCell>{transaction.dropPlayer}</TableCell>
                          <TableCell>{transaction.signPlayer}</TableCell>
                          <TableCell>{transaction.signPlayerOvr || 'N/A'}</TableCell>
                          <TableCell>${transaction.bidAmount}</TableCell>
                          <TableCell>${transaction.coinsRemaining}</TableCell>
                          <TableCell className="text-sm">{transaction.adminUser || 'Bot'}</TableCell>
                          <TableCell>
                            {transaction.rolledBack ? (
                              <Badge variant="destructive">Rolled Back</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!transaction.rolledBack && (
                              <TransactionActions
                                transactionId={transaction.id}
                                onSuccess={() => {
                                  refetchTransactions();
                                  refetchCoins();
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coin Management Tab */}
        <TabsContent value="coins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Team Coin Balances
              </CardTitle>
              <CardDescription>
                Adjust coins, fix discrepancies, and monitor balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Coins Remaining</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamCoins?.map((tc) => (
                    <TableRow key={tc.team}>
                      <TableCell className="font-medium">{tc.team}</TableCell>
                      <TableCell className="text-right">
                        <span className={
                          tc.coinsRemaining === 0 ? "text-red-500 font-bold" :
                          tc.coinsRemaining < 20 ? "text-orange-500 font-bold" :
                          tc.coinsRemaining < 50 ? "text-yellow-500 font-bold" :
                          "text-green-500 font-bold"
                        }>
                          ${tc.coinsRemaining}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustDialog(tc.team)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Coins Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Team Coins</DialogTitle>
            <DialogDescription>
              Add or subtract coins from {selectedTeam}'s balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team">Team</Label>
              <Input id="team" value={selectedTeam} disabled />
            </div>
            <div>
              <Label htmlFor="amount">Amount (use negative for subtraction)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 10 or -5"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="e.g., Correction for duplicate transaction"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustCoins}>
              Adjust Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
