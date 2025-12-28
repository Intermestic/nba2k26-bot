import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CheckCircle, RefreshCw, ArrowLeft, Trophy, AlertCircle, Play } from "lucide-react";

export default function FASummary() {
  const { data: activeBids, isLoading, refetch } = trpc.coins.getAllBids.useQuery();

  // Group bids by player
  const bidsByPlayer = activeBids?.reduce((acc: any, bid: any) => {
    if (!acc[bid.playerName]) {
      acc[bid.playerName] = [];
    }
    acc[bid.playerName].push(bid);
    return acc;
  }, {});

  const playerCount = bidsByPlayer ? Object.keys(bidsByPlayer).length : 0;
  const totalBids = activeBids?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-16 w-auto" />
              <div>
                <h1 className="text-3xl font-bold text-white">FA Window Summary</h1>
                <p className="text-sm text-slate-400 mt-1">Generate and process FA window close summaries</p>
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
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Active Bids</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className="text-4xl font-bold text-teal-500">{totalBids}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Players with Bids</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className="text-4xl font-bold text-blue-500">{playerCount}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Window Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : totalBids > 0 ? (
                <Badge className="bg-green-600 text-white text-lg px-4 py-2">Open</Badge>
              ) : (
                <Badge className="bg-slate-600 text-white text-lg px-4 py-2">Closed</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-teal-500" />
              FA Window Management
            </CardTitle>
            <CardDescription className="text-slate-400">
              View all active bids and monitor FA window status. Window processing is handled automatically by the Discord bot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button onClick={() => refetch()} variant="outline" size="lg" className="gap-2">
                <RefreshCw className="w-5 h-5" />
                Refresh Data
              </Button>
            </div>
            {(!activeBids || activeBids.length === 0) && !isLoading && (
              <div className="mt-4 flex items-center gap-2 text-slate-400">
                <AlertCircle className="w-5 h-5" />
                <span>No active bids at this time</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Bids Summary */}
        {bidsByPlayer && Object.keys(bidsByPlayer).length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Active Bids by Player
              </CardTitle>
              <CardDescription className="text-slate-400">
                Preview of all current bids before processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(bidsByPlayer).map(([playerName, bids]: [string, any]) => {
                  const sortedBids = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);
                  const highestBid = sortedBids[0];
                  
                  return (
                    <div key={playerName} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-bold text-lg">{playerName}</h3>
                        <Badge className="bg-blue-600">{bids.length} bid{bids.length > 1 ? 's' : ''}</Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-slate-300">Team</TableHead>
                            <TableHead className="text-slate-300">Drop Player</TableHead>
                            <TableHead className="text-slate-300 text-right">Bid Amount</TableHead>
                            <TableHead className="text-slate-300">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedBids.map((bid: any, index: number) => (
                            <TableRow key={bid.id} className="border-slate-700">
                              <TableCell className="text-white font-medium">{bid.team}</TableCell>
                              <TableCell className="text-slate-300">{bid.dropPlayer || "—"}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-yellow-500 font-bold">{bid.bidAmount}</span>
                              </TableCell>
                              <TableCell>
                                {index === 0 ? (
                                  <Badge className="bg-green-600">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Winning Bid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-slate-400">
                                    Outbid
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
}
