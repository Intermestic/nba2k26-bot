import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DollarSign, Plus, Minus, RotateCcw, RefreshCw, ArrowLeft } from "lucide-react";

export default function FACoins() {
  const { data: teams, isLoading, refetch } = trpc.coins.getTeamCoins.useQuery();
  const adjustCoinsMutation = trpc.coins.adjustCoins.useMutation();

  const [adjustDialog, setAdjustDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{ id: number; team: string; coinsRemaining: number } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const handleAdjustCoins = async (add: boolean) => {
    if (!selectedTeam || !adjustAmount) return;

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    try {
      await adjustCoinsMutation.mutateAsync({
        team: selectedTeam.team,
        amount: add ? amount : -amount,
        reason: adjustReason || (add ? "Manual coin addition" : "Manual coin deduction"),
      });
      toast.success(`${add ? "Added" : "Deducted"} ${amount} coins ${add ? "to" : "from"} ${selectedTeam.team}`);
      setAdjustDialog(false);
      setAdjustAmount("");
      setAdjustReason("");
      setSelectedTeam(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust coins");
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
                <h1 className="text-3xl font-bold text-white">FA Coins</h1>
                <p className="text-sm text-slate-400 mt-1">Manage team FA coins and transaction reversals</p>
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
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                  Team FA Coins
                </CardTitle>
                <CardDescription className="text-slate-400 mt-2">
                  View and manage FA coin balances for all teams
                </CardDescription>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading team coins...</div>
            ) : !teams || teams.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No team data available</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Team</TableHead>
                    <TableHead className="text-slate-300 text-right">Current Coins</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">{team.team}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-yellow-500 font-bold text-lg">{team.coinsRemaining}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Adjust Coins
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTeam(team);
                                setAdjustDialog(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Coins
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTeam(team);
                                setAdjustDialog(true);
                              }}
                            >
                              <Minus className="mr-2 h-4 w-4" />
                              Deduct Coins
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Adjust Coins Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Adjust Coins for {selectedTeam?.team}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Current balance: <span className="text-yellow-500 font-bold">{selectedTeam?.coinsRemaining}</span> coins
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount" className="text-slate-300">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="reason" className="text-slate-300">Reason (optional)</Label>
              <Input
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g., Manual correction, bonus coins"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleAdjustCoins(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Coins
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAdjustCoins(false)}
            >
              <Minus className="w-4 h-4 mr-2" />
              Deduct Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
