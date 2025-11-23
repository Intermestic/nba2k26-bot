import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TradeStatus = "pending" | "approved" | "rejected" | "reversed";

interface Trade {
  id: number;
  messageId: string;
  team1: string;
  team2: string;
  team1Players: Array<{ name: string; overall: number; salary: number }>;
  team2Players: Array<{ name: string; overall: number; salary: number }>;
  status: TradeStatus;
  upvotes: number;
  downvotes: number;
  approvedBy: string | null;
  rejectedBy: string | null;
  reversedBy: string | null;
  createdAt: Date;
  processedAt: Date | null;
  reversedAt: Date | null;
}

interface ActionDialogState {
  open: boolean;
  action: "approve" | "reject" | "reverse" | "closeAll" | null;
  tradeId: number | null;
  tradeSummary: string;
}

export default function TradeManagement() {
  const [activeTab, setActiveTab] = useState<TradeStatus | "all">("pending");
  const [dialogState, setDialogState] = useState<ActionDialogState>({
    open: false,
    action: null,
    tradeId: null,
    tradeSummary: "",
  });

  const utils = trpc.useUtils();

  // Fetch trades based on active tab
  const { data: trades, isLoading } = trpc.trades.getAllTrades.useQuery(
    activeTab === "all" ? undefined : { status: activeTab as TradeStatus }
  );

  const approveMutation = trpc.trades.approveTrade.useMutation({
    onSuccess: () => {
      toast.success("Trade approved successfully");
      utils.trades.getAllTrades.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to approve trade: ${error.message}`);
    },
  });

  const rejectMutation = trpc.trades.rejectTrade.useMutation({
    onSuccess: () => {
      toast.success("Trade rejected successfully");
      utils.trades.getAllTrades.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to reject trade: ${error.message}`);
    },
  });

  const reverseMutation = trpc.trades.reverseTrade.useMutation({
    onSuccess: () => {
      toast.success("Trade reversed successfully");
      utils.trades.getAllTrades.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to reverse trade: ${error.message}`);
    },
  });

  const closeAllMutation = trpc.trades.closeAllPendingTrades.useMutation({
    onSuccess: () => {
      toast.success("All pending trades closed");
      utils.trades.getAllTrades.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to close all trades: ${error.message}`);
    },
  });

  const openDialog = (
    action: "approve" | "reject" | "reverse" | "closeAll",
    trade?: Trade
  ) => {
    if (action === "closeAll") {
      setDialogState({
        open: true,
        action,
        tradeId: null,
        tradeSummary: "all pending trades",
      });
    } else if (trade) {
      setDialogState({
        open: true,
        action,
        tradeId: trade.id,
        tradeSummary: `${trade.team1} ↔ ${trade.team2}`,
      });
    }
  };

  const closeDialog = () => {
    setDialogState({
      open: false,
      action: null,
      tradeId: null,
      tradeSummary: "",
    });
  };

  const handleConfirmAction = () => {
    const { action, tradeId } = dialogState;
    const adminName = "Admin"; // TODO: Get from auth context

    if (action === "approve" && tradeId) {
      approveMutation.mutate({ id: tradeId, adminName });
    } else if (action === "reject" && tradeId) {
      rejectMutation.mutate({ id: tradeId, adminName });
    } else if (action === "reverse" && tradeId) {
      reverseMutation.mutate({ id: tradeId, adminName });
    } else if (action === "closeAll") {
      closeAllMutation.mutate({ adminName });
    }
  };

  const getStatusBadge = (status: TradeStatus) => {
    const variants: Record<TradeStatus, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      reversed: { variant: "outline", label: "Reversed" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  const formatPlayers = (players: Array<{ name: string; overall: number; salary: number }>) => {
    return players.map((p) => `${p.name} ${p.overall}(${p.salary})`).join(", ");
  };

  const pendingCount = trades?.filter((t) => t.status === "pending").length || 0;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Trade Management</h1>
          <p className="text-muted-foreground mt-1">
            View, approve, reject, and reverse trades
          </p>
        </div>
        {pendingCount > 0 && (
          <Button
            variant="destructive"
            onClick={() => openDialog("closeAll")}
            disabled={closeAllMutation.isPending}
          >
            {closeAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Close All Pending Trades ({pendingCount})
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="reversed">Reversed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trades</CardTitle>
              <CardDescription>
                {activeTab === "all"
                  ? "All trades in the system"
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} trades`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !trades || trades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trades found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Teams</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Processed By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>{getStatusBadge(trade.status)}</TableCell>
                          <TableCell className="font-medium">
                            {trade.team1} ↔ {trade.team2}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="font-semibold">{trade.team1}:</span>{" "}
                                {formatPlayers(trade.team1Players)}
                              </div>
                              <div>
                                <span className="font-semibold">{trade.team2}:</span>{" "}
                                {formatPlayers(trade.team2Players)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              👍 {trade.upvotes} / 👎 {trade.downvotes}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(trade.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {trade.approvedBy && <div>✅ {trade.approvedBy}</div>}
                            {trade.rejectedBy && <div>❌ {trade.rejectedBy}</div>}
                            {trade.reversedBy && <div>↩️ {trade.reversedBy}</div>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {trade.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => openDialog("approve", trade)}
                                    disabled={approveMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openDialog("reject", trade)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {(trade.status === "approved" || trade.status === "rejected") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDialog("reverse", trade)}
                                  disabled={reverseMutation.isPending}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reverse
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={dialogState.open} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState.action === "approve" && "Approve Trade"}
              {dialogState.action === "reject" && "Reject Trade"}
              {dialogState.action === "reverse" && "Reverse Trade"}
              {dialogState.action === "closeAll" && "Close All Pending Trades"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.action === "approve" &&
                `Are you sure you want to approve the trade: ${dialogState.tradeSummary}?`}
              {dialogState.action === "reject" &&
                `Are you sure you want to reject the trade: ${dialogState.tradeSummary}?`}
              {dialogState.action === "reverse" &&
                `Are you sure you want to reverse the trade: ${dialogState.tradeSummary}? This will undo the previous approval/rejection.`}
              {dialogState.action === "closeAll" &&
                `Are you sure you want to close all pending trades? This will reject all ${pendingCount} pending trades.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
