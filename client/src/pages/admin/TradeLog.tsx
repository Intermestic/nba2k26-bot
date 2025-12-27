// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, X, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getTeamLogo } from "@/lib/teamLogos";

interface TradeLogItem {
  id: number;
  team1: string;
  team2: string;
  team1Players: Array<{ name: string; overall: number; badges: number }>;
  team2Players: Array<{ name: string; overall: number; badges: number }>;
  playerBadges: Record<string, number>;
  status: "pending" | "approved" | "declined";
  submittedBy: string | null;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export default function TradeLog() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "declined" | "all">("pending");
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [tradeToDecline, setTradeToDecline] = useState<number | null>(null);
  const [declineNotes, setDeclineNotes] = useState("");

  const { data: trades, isLoading, refetch } = trpc.tradeLog.getTradeLogs.useQuery({
    status: activeTab,
  });

  const approveMutation = trpc.tradeLog.approveTrade.useMutation({
    onSuccess: () => {
      toast.success("Trade approved and badge counts updated!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve trade: ${error.message}`);
    },
  });

  const declineMutation = trpc.tradeLog.declineTrade.useMutation({
    onSuccess: () => {
      toast.success("Trade declined");
      setDeclineDialogOpen(false);
      setDeclineNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to decline trade: ${error.message}`);
    },
  });

  const batchApproveMutation = trpc.tradeLog.batchApproveTrades.useMutation({
    onSuccess: (result) => {
      toast.success(`Batch approved ${result.approved} trades!`);
      if (result.failed > 0) {
        toast.error(`${result.failed} trades failed: ${result.errors.join(", ")}`);
      }
      setSelectedTrades(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(`Batch approval failed: ${error.message}`);
    },
  });

  const handleApproveTrade = (tradeId: number) => {
    approveMutation.mutate({ tradeId });
  };

  const handleDeclineTrade = (tradeId: number) => {
    setTradeToDecline(tradeId);
    setDeclineDialogOpen(true);
  };

  const confirmDecline = () => {
    if (tradeToDecline) {
      declineMutation.mutate({
        tradeId: tradeToDecline,
        notes: declineNotes || undefined,
      });
    }
  };

  const handleBatchApprove = () => {
    if (selectedTrades.size === 0) {
      toast.error("No trades selected");
      return;
    }
    batchApproveMutation.mutate({
      tradeIds: Array.from(selectedTrades),
    });
  };

  const toggleTradeSelection = (tradeId: number) => {
    const newSet = new Set(selectedTrades);
    if (newSet.has(tradeId)) {
      newSet.delete(tradeId);
    } else {
      newSet.add(tradeId);
    }
    setSelectedTrades(newSet);
  };

  const selectAllPending = () => {
    if (!trades) return;
    const pendingIds = trades.filter(t => t.status === "pending").map(t => t.id);
    setSelectedTrades(new Set(pendingIds));
  };

  const deselectAll = () => {
    setSelectedTrades(new Set());
  };

  const calculateTotals = (players: Array<{ overall: number; badges: number }>) => {
    return {
      totalOvr: players.reduce((sum, p) => sum + p.overall, 0),
      totalBadges: players.reduce((sum, p) => sum + p.badges, 0),
    };
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Trade Log Review</h1>
        <p className="text-muted-foreground">
          Review and approve trades submitted via Trade Machine
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {activeTab === "pending" && (
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleBatchApprove}
              disabled={selectedTrades.size === 0 || batchApproveMutation.isPending}
              className="gap-2"
            >
              {batchApproveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Batch Approve ({selectedTrades.size})
            </Button>
            <Button variant="outline" onClick={selectAllPending}>
              Select All Pending
            </Button>
            <Button variant="outline" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
        )}

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !trades || trades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No trades found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trades.map((trade: TradeLogItem) => {
                const team1Totals = calculateTotals(trade.team1Players);
                const team2Totals = calculateTotals(trade.team2Players);

                return (
                  <Card key={trade.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {trade.status === "pending" && (
                            <Checkbox
                              checked={selectedTrades.has(trade.id)}
                              onCheckedChange={() => toggleTradeSelection(trade.id)}
                            />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              Trade #{trade.id}
                            </CardTitle>
                            <CardDescription>
                              Submitted {new Date(trade.createdAt).toLocaleDateString()} by {trade.submittedBy}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              trade.status === "approved"
                                ? "default"
                                : trade.status === "declined"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {trade.status}
                          </Badge>
                          {trade.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveTrade(trade.id)}
                                disabled={approveMutation.isPending}
                                className="gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeclineTrade(trade.id)}
                                disabled={declineMutation.isPending}
                                className="gap-2"
                              >
                                <X className="h-4 w-4" />
                                Decline
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Team 1 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 mb-4">
                            <img
                              src={getTeamLogo(trade.team1)}
                              alt={trade.team1}
                              className="h-10 w-10 object-contain"
                            />
                            <h3 className="text-xl font-semibold">{trade.team1} Sends</h3>
                          </div>
                          <div className="space-y-2">
                            {trade.team1Players.map((player, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                              >
                                <div>
                                  <div className="font-medium">{player.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {player.overall} OVR
                                  </div>
                                </div>
                                <Badge variant="outline">{player.badges} badges</Badge>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>
                                {team1Totals.totalOvr} OVR ({team1Totals.totalBadges} badges)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 mb-4">
                            <img
                              src={getTeamLogo(trade.team2)}
                              alt={trade.team2}
                              className="h-10 w-10 object-contain"
                            />
                            <h3 className="text-xl font-semibold">{trade.team2} Sends</h3>
                          </div>
                          <div className="space-y-2">
                            {trade.team2Players.map((player, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                              >
                                <div>
                                  <div className="font-medium">{player.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {player.overall} OVR
                                  </div>
                                </div>
                                <Badge variant="outline">{player.badges} badges</Badge>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>
                                {team2Totals.totalOvr} OVR ({team2Totals.totalBadges} badges)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {trade.notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-md">
                          <div className="text-sm font-medium mb-1">Notes:</div>
                          <div className="text-sm text-muted-foreground">{trade.notes}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Trade</DialogTitle>
            <DialogDescription>
              Add optional notes about why this trade is being declined
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                placeholder="Reason for declining..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDecline}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Decline Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
