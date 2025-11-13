import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Home, Users, Search, ArrowRight, Download } from "lucide-react";

export default function History() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not admin
  if (isAuthenticated && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: transactions, isLoading } = trpc.player.getTransactionHistory.useQuery({
    limit: 200,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
            <p className="text-slate-400 mb-4">You must be logged in as an admin to view transaction history.</p>
            <Button asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredTransactions = transactions?.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.playerName.toLowerCase().includes(term) ||
      t.fromTeam?.toLowerCase().includes(term) ||
      t.toTeam.toLowerCase().includes(term) ||
      t.adminName?.toLowerCase().includes(term)
    );
  });

  const exportToCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("No transactions to export");
      return;
    }

    // CSV headers
    const headers = ["Player Name", "From Team", "To Team", "Transaction Type", "Admin", "Date"];
    
    // CSV rows
    const rows = filteredTransactions.map(t => [
      t.playerName,
      t.fromTeam || "Free Agent",
      t.toTeam,
      t.transactionType,
      t.adminName || "Unknown",
      new Date(t.createdAt).toLocaleString()
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transaction-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-12 md:h-16 w-auto" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">Transaction History</h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1">View all player movements</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin">Team Management</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/players">Player Management</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/">Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Export */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by player, team, or admin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="bg-green-900 border-green-700 hover:bg-green-800 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Recent Transactions ({filteredTransactions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading transactions...</div>
            ) : filteredTransactions && filteredTransactions.length > 0 ? (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 rounded border border-slate-700 gap-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{transaction.playerName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          transaction.transactionType === "trade" 
                            ? "bg-blue-900/50 text-blue-300"
                            : "bg-green-900/50 text-green-300"
                        }`}>
                          {transaction.transactionType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">{transaction.fromTeam || "Free Agent"}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-green-400">{transaction.toTeam}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-slate-400">
                        {transaction.adminName || "Unknown"}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                {searchTerm ? "No transactions match your search" : "No transactions yet"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
