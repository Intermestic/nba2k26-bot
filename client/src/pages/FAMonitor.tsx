import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { RefreshCw, AlertCircle, CheckCircle, Clock, DollarSign, X } from "lucide-react";
import { toast } from "sonner";
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
import { format } from "date-fns";

export default function FAMonitor() {
  const { user, isAuthenticated } = useAuth();
  const [teamFilter, setTeamFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [bidToCancel, setBidToCancel] = useState<number | null>(null);
  
  const utils = trpc.useUtils();

  const { data: recentBids, isLoading: bidsLoading } = trpc.coins.getAllBids.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true,
  });

  const { data: teamCoins, isLoading: coinsLoading } = trpc.coins.getAllTeamCoins.useQuery(undefined, {
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const { data: recentTransactions } = trpc.coins.getTransactionHistory.useQuery();
  
  const cancelBidMutation = trpc.coins.cancelBid.useMutation({
    onSuccess: () => {
      toast.success("Bid cancelled successfully");
      utils.coins.getAllBids.invalidate();
      utils.coins.getAllTeamCoins.invalidate();
      setBidToCancel(null);
    },
    onError: (error) => {
      toast.error(`Failed to cancel bid: ${error.message}`);
    },
  });
  
  const handleCancelBid = () => {
    if (bidToCancel) {
      cancelBidMutation.mutate({ bidId: bidToCancel });
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <DashboardLayout>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-slate-400">You must be logged in as an admin to view this page.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const filteredBids = recentBids?.filter(bid => 
    !teamFilter || bid.team.toLowerCase().includes(teamFilter.toLowerCase())
  ) || [];

  const filteredCoins = teamCoins?.filter(tc =>
    !teamFilter || tc.team.toLowerCase().includes(teamFilter.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">FA Transaction Monitor</h1>
            <p className="text-slate-400 mt-1">Real-time free agency activity and validation status</p>
          </div>
          <Button
            onClick={() => setRefreshKey(prev => prev + 1)}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Filter by team..."
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="max-w-xs bg-slate-900 border-slate-600 text-white"
              />
              {teamFilter && (
                <Button
                  onClick={() => setTeamFilter("")}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900 border-slate-600"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Coin Balances */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Team Coin Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coinsLoading ? (
              <p className="text-slate-400">Loading...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredCoins.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-3 bg-slate-900 rounded border border-slate-700"
                  >
                    <div className="text-sm font-medium text-slate-300">{tc.team}</div>
                    <div className={`text-2xl font-bold ${
                      tc.coinsRemaining < 20 ? 'text-red-400' :
                      tc.coinsRemaining < 50 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      ${tc.coinsRemaining}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Bids */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Active Bids ({filteredBids.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bidsLoading ? (
              <p className="text-slate-400">Loading...</p>
            ) : filteredBids.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No active bids</p>
            ) : (
              <div className="space-y-2">
                {filteredBids.slice(0, 20).map((bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                          {bid.team}
                        </Badge>
                        <span className="text-white font-medium">{bid.playerName}</span>
                        {bid.dropPlayer && (
                          <span className="text-slate-400 text-sm">
                            (drops {bid.dropPlayer})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span>{bid.bidderName}</span>
                        <span>•</span>
                        <span>${bid.bidAmount}</span>
                        <span>•</span>
                        <span>{bid.windowId}</span>
                        <span>•</span>
                        <span>{format(new Date(bid.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBidToCancel(bid.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentTransactions ? (
              <p className="text-slate-400">Loading...</p>
            ) : recentTransactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No recent transactions</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.slice(0, 15).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded border border-slate-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {tx.team}
                        </Badge>
                        <span className="text-white font-medium">{tx.signPlayer}</span>
                        {tx.dropPlayer !== "N/A" && (
                          <span className="text-slate-400 text-sm">
                            ← {tx.dropPlayer}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span className={tx.bidAmount < 0 ? 'text-red-400' : 'text-green-400'}>
                          {tx.bidAmount >= 0 ? '-' : '+'}${Math.abs(tx.bidAmount)}
                        </span>
                        <span>•</span>
                        <span>Balance: ${tx.coinsRemaining}</span>
                        <span>•</span>
                        <span>{format(new Date(tx.processedAt), 'MMM d, h:mm a')}</span>
                        {tx.adminUser && (
                          <>
                            <span>•</span>
                            <span>by {tx.adminUser}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Cancel Bid Confirmation Dialog */}
      <AlertDialog open={bidToCancel !== null} onOpenChange={(open) => !open && setBidToCancel(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Bid</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to cancel this bid? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBid}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
