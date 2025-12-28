import { Link } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { History, Search, RefreshCw, ArrowLeft, DollarSign, UserPlus, UserMinus } from "lucide-react";
import { format } from "date-fns";

export default function FAHistory() {
  const { data: transactions, isLoading, refetch } = trpc.coins.getTransactionHistory.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((tx) => {
      const matchesSearch =
        searchTerm === "" ||
        tx.team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.signPlayer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.dropPlayer?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" ||
        (filterType === "sign" && tx.signPlayer) ||
        (filterType === "cut" && tx.dropPlayer);

      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, filterType]);

  const getTransactionType = (tx: any) => {
    if (tx.signPlayer && tx.dropPlayer) return "Sign & Cut";
    if (tx.signPlayer) return "Sign";
    if (tx.dropPlayer) return "Cut";
    return "Transaction";
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "Sign & Cut":
        return <Badge className="bg-blue-600">Sign & Cut</Badge>;
      case "Sign":
        return <Badge className="bg-green-600">Sign</Badge>;
      case "Cut":
        return <Badge className="bg-red-600">Cut</Badge>;
      case "Adjustment":
        return <Badge className="bg-yellow-600">Adjustment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-16 w-auto" />
              <div>
                <h1 className="text-3xl font-bold text-white">FA History</h1>
                <p className="text-sm text-slate-400 mt-1">View all free agency transactions and bids</p>
              </div>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl flex items-center gap-2">
                  <History className="w-6 h-6 text-indigo-500" />
                  Transaction History
                </CardTitle>
                <CardDescription className="text-slate-400 mt-2">
                  Complete record of all FA transactions and coin movements
                </CardDescription>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by team or player name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="sign">Signs Only</SelectItem>
                  <SelectItem value="cut">Cuts Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Table */}
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading transaction history...</div>
            ) : !filteredTransactions || filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {searchTerm || filterType !== "all" ? "No transactions match your filters" : "No transactions found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Team</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Signed Player</TableHead>
                      <TableHead className="text-slate-300">Cut Player</TableHead>
                      <TableHead className="text-slate-300 text-right">Coins Spent</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => {
                      const txType = getTransactionType(tx);
                      return (
                        <TableRow key={tx.id} className="border-slate-700 hover:bg-slate-800/50">
                          <TableCell className="text-slate-300">
                            {tx.processedAt ? format(new Date(tx.processedAt), "MMM d, yyyy HH:mm") : "N/A"}
                          </TableCell>
                          <TableCell className="text-white font-medium">{tx.team || "N/A"}</TableCell>
                          <TableCell>{getTransactionBadge(txType)}</TableCell>
                          <TableCell className="text-green-400">
                            {tx.signPlayer ? (
                              <div className="flex items-center gap-1">
                                <UserPlus className="w-4 h-4" />
                                {tx.signPlayer}
                                {tx.signPlayerOvr && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    {tx.signPlayerOvr}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-red-400">
                            {tx.dropPlayer ? (
                              <div className="flex items-center gap-1">
                                <UserMinus className="w-4 h-4" />
                                {tx.dropPlayer}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-red-500 font-bold">-{tx.bidAmount}</span>
                              <span className="text-xs text-slate-400">{tx.coinsRemaining} left</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm max-w-xs">
                            {tx.rolledBack ? (
                              <Badge variant="destructive">Rolled Back</Badge>
                            ) : tx.adminUser ? (
                              <span className="text-xs">By {tx.adminUser}</span>
                            ) : (
                              <span>—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
