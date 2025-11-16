import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Coins, History, Plus, Minus, RotateCcw, UserMinus, UserPlus, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

export default function CoinDashboard() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: teamCoins, refetch: refetchCoins } = trpc.coins.getAllTeamCoins.useQuery();
  const { data: transactions } = trpc.coins.getTransactionHistory.useQuery();
  const adjustCoinsMutation = trpc.coins.adjustCoins.useMutation();

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [sortField, setSortField] = useState<'date' | 'team' | 'dropped' | 'signed' | 'ovr' | 'bid' | 'remaining' | 'admin'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const sortedTransactions = transactions?.slice().sort((a, b) => {
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
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('date')} className="-ml-3 hover:bg-accent">
                    Date {getSortIcon('date')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('team')} className="-ml-3 hover:bg-accent">
                    Team {getSortIcon('team')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('dropped')} className="-ml-3 hover:bg-accent">
                    Dropped {getSortIcon('dropped')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('signed')} className="-ml-3 hover:bg-accent">
                    Signed {getSortIcon('signed')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('ovr')} className="-ml-3 hover:bg-accent">
                    OVR {getSortIcon('ovr')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('bid')} className="hover:bg-accent">
                    Bid {getSortIcon('bid')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('remaining')} className="hover:bg-accent">
                    Remaining {getSortIcon('remaining')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('admin')} className="-ml-3 hover:bg-accent">
                    Admin {getSortIcon('admin')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions?.map((tx) => (
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
                  <TableCell className="text-right">
                    <TransactionActions transactionId={tx.id} onSuccess={refetchCoins} />
                  </TableCell>
                </TableRow>
              ))}
              {(!sortedTransactions || sortedTransactions.length === 0) && (
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
