import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Coins, History, Plus, Minus } from "lucide-react";

export default function CoinDashboard() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: teamCoins, refetch: refetchCoins } = trpc.coins.getAllTeamCoins.useQuery();
  const { data: transactions } = trpc.coins.getTransactionHistory.useQuery();
  const adjustCoinsMutation = trpc.coins.adjustCoins.useMutation();

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");

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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FA Coin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage team FA coin balances and view transaction history
        </p>
      </div>

      {/* Team Coin Balances */}
      <Card className="mb-8">
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
                    <span className={tc.coinsRemaining === 0 ? "text-red-500 font-bold" : ""}>
                      {tc.coinsRemaining}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAdjustDialog(tc.team)}
                    >
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Recent FA transactions processed by the bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Dropped</TableHead>
                <TableHead>Signed</TableHead>
                <TableHead>OVR</TableHead>
                <TableHead className="text-right">Bid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tx.processedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{tx.team}</TableCell>
                  <TableCell>{tx.dropPlayer}</TableCell>
                  <TableCell>{tx.signPlayer}</TableCell>
                  <TableCell>{tx.signPlayerOvr}</TableCell>
                  <TableCell className="text-right">{tx.bidAmount}</TableCell>
                  <TableCell className="text-right">{tx.coinsRemaining}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tx.adminUser}</TableCell>
                </TableRow>
              ))}
              {(!transactions || transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust Coins Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Coins: {selectedTeam}</DialogTitle>
            <DialogDescription>
              Add or subtract coins from this team's balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                placeholder="e.g., Manual correction"
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
