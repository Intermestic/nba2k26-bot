import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Clock, CheckCircle, XCircle } from "lucide-react";

export default function FAWindowSummary() {
  const [selectedWindow, setSelectedWindow] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  // Fetch all bid windows
  const { data: windows = [] } = trpc.coins.getBidWindows.useQuery();

  // Fetch all bids
  const { data: allBids = [] } = trpc.coins.getAllBids.useQuery();

  // Filter bids by selected window
  const filteredBids = useMemo(() => {
    return allBids.filter(bid => {
      const matchesWindow = selectedWindow === "all" || bid.windowId === selectedWindow;
      const matchesTeam = selectedTeam === "all" || bid.team === selectedTeam;
      return matchesWindow && matchesTeam;
    });
  }, [allBids, selectedWindow, selectedTeam]);

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

  // Calculate team commitments (sum of their high bids)
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

  // Get unique teams
  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set(allBids.map(b => b.team)));
    return uniqueTeams.sort();
  }, [allBids]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case 'locked':
        return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Locked</Badge>;
      case 'closed':
        return <Badge className="bg-gray-600"><CheckCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">FA Window Summary</h1>
              <p className="text-slate-400 text-sm">Bid history, predictions, and commitments</p>
            </div>
            <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Select value={selectedWindow} onValueChange={setSelectedWindow}>
            <SelectTrigger className="w-full sm:w-64 bg-slate-800 border-slate-700">
              <SelectValue placeholder="Select window" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Windows</SelectItem>
              {windows.map((w: any) => (
                <SelectItem key={w.windowId} value={w.windowId}>
                  {w.windowId} {getStatusBadge(w.status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full sm:w-64 bg-slate-800 border-slate-700">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Team Commitments */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Team Commitments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teamCommitments.map(({ team, amount }) => (
                  <div key={team} className="flex justify-between items-center p-2 rounded bg-slate-700/30">
                    <span className="text-white font-medium">{team}</span>
                    <span className="text-green-400 font-bold">${amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Window Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Bidding Windows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {windows.map((window: any) => (
                  <div key={window.windowId} className="flex justify-between items-center p-2 rounded bg-slate-700/30">
                    <span className="text-white text-sm">{window.windowId}</span>
                    {getStatusBadge(window.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Total Players</p>
                  <p className="text-2xl font-bold text-white">{playerBids.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Bids</p>
                  <p className="text-2xl font-bold text-white">{filteredBids.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Commitment</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${teamCommitments.reduce((sum, { amount }) => sum + amount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Player Bids Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Bid History & Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/30">
                    <TableHead className="text-slate-300">Player</TableHead>
                    <TableHead className="text-slate-300">High Bid</TableHead>
                    <TableHead className="text-slate-300">Winner</TableHead>
                    <TableHead className="text-slate-300">All Bids</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerBids.map(({ playerName, highBid, winner, bids }) => (
                    <TableRow key={playerName} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="text-white font-medium">{playerName}</TableCell>
                      <TableCell className="text-green-400 font-bold">${highBid}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
