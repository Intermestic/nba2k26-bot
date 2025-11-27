import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeftRight, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlayerWithBadges {
  id: number;
  name: string;
  overall: number;
  team: string;
  photoUrl: string | null;
  badges: number;
}

export default function TradeMachine() {
  const [team1, setTeam1] = useState<string>("");
  const [team2, setTeam2] = useState<string>("");
  const [team1SelectedPlayers, setTeam1SelectedPlayers] = useState<Set<number>>(new Set());
  const [team2SelectedPlayers, setTeam2SelectedPlayers] = useState<Set<number>>(new Set());
  const [playerBadges, setPlayerBadges] = useState<Map<number, number>>(new Map());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tradeConfirmed, setTradeConfirmed] = useState(false);

  const { data: teams, isLoading: teamsLoading } = trpc.tradeMachine.getTradableTeams.useQuery();
  const { data: team1Roster, isLoading: team1Loading } = trpc.tradeMachine.getTeamRoster.useQuery(
    { teamName: team1 },
    { enabled: !!team1 }
  );
  const { data: team2Roster, isLoading: team2Loading } = trpc.tradeMachine.getTeamRoster.useQuery(
    { teamName: team2 },
    { enabled: !!team2 }
  );

  const postTradeMutation = trpc.tradeMachine.postTradeToDiscord.useMutation({
    onSuccess: () => {
      toast.success("Trade posted to Discord successfully!");
      // Reset state
      setTeam1("");
      setTeam2("");
      setTeam1SelectedPlayers(new Set());
      setTeam2SelectedPlayers(new Set());
      setPlayerBadges(new Map());
      setTradeConfirmed(false);
    },
    onError: (error) => {
      toast.error(`Failed to post trade: ${error.message}`);
    },
  });

  const togglePlayer = (playerId: number, team: 1 | 2) => {
    if (team === 1) {
      const newSet = new Set(team1SelectedPlayers);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      setTeam1SelectedPlayers(newSet);
    } else {
      const newSet = new Set(team2SelectedPlayers);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      setTeam2SelectedPlayers(newSet);
    }
  };

  const setBadgeCount = (playerId: number, badges: number) => {
    const newMap = new Map(playerBadges);
    newMap.set(playerId, badges);
    setPlayerBadges(newMap);
  };

  const team1PlayersWithBadges = useMemo(() => {
    if (!team1Roster) return [];
    return Array.from(team1SelectedPlayers)
      .map((id) => {
        const player = team1Roster.find((p) => p.id === id);
        if (!player) return null;
        return {
          ...player,
          badges: playerBadges.get(id) || 0,
        };
      })
      .filter((p): p is PlayerWithBadges => p !== null);
  }, [team1Roster, team1SelectedPlayers, playerBadges]);

  const team2PlayersWithBadges = useMemo(() => {
    if (!team2Roster) return [];
    return Array.from(team2SelectedPlayers)
      .map((id) => {
        const player = team2Roster.find((p) => p.id === id);
        if (!player) return null;
        return {
          ...player,
          badges: playerBadges.get(id) || 0,
        };
      })
      .filter((p): p is PlayerWithBadges => p !== null);
  }, [team2Roster, team2SelectedPlayers, playerBadges]);

  const team1TotalOvr = team1PlayersWithBadges.reduce((sum, p) => sum + p.overall, 0);
  const team1TotalBadges = team1PlayersWithBadges.reduce((sum, p) => sum + p.badges, 0);
  const team2TotalOvr = team2PlayersWithBadges.reduce((sum, p) => sum + p.overall, 0);
  const team2TotalBadges = team2PlayersWithBadges.reduce((sum, p) => sum + p.badges, 0);

  const canConfirmTrade =
    team1 &&
    team2 &&
    team1SelectedPlayers.size > 0 &&
    team2SelectedPlayers.size > 0 &&
    Array.from(team1SelectedPlayers).every((id) => playerBadges.has(id)) &&
    Array.from(team2SelectedPlayers).every((id) => playerBadges.has(id));

  const handleConfirmTrade = () => {
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = () => {
    setTradeConfirmed(true);
    setShowConfirmDialog(false);
    toast.success("Trade confirmed! You can now post it to Discord.");
  };

  const handlePostToDiscord = () => {
    postTradeMutation.mutate({
      team1Name: team1,
      team1Players: team1PlayersWithBadges.map((p) => ({
        name: p.name,
        overall: p.overall,
        badges: p.badges,
      })),
      team2Name: team2,
      team2Players: team2PlayersWithBadges.map((p) => ({
        name: p.name,
        overall: p.overall,
        badges: p.badges,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Trade Machine</h1>
          <p className="text-muted-foreground">
            Build a trade between two teams, verify badge counts, and post to Discord
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Team 1 */}
          <Card>
            <CardHeader>
              <CardTitle>Team 1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Team</Label>
                <Select value={team1} onValueChange={setTeam1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {team1Loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {team1Roster && team1Roster.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Players</Label>
                  <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-3">
                    {team1Roster.map((player) => (
                      <div key={player.id} className="space-y-2 pb-2 border-b last:border-b-0">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={team1SelectedPlayers.has(player.id)}
                            onCheckedChange={() => togglePlayer(player.id, 1)}
                          />
                          <label className="text-sm font-medium flex-1">
                            {player.name} - {player.overall} OVR
                          </label>
                        </div>
                        {team1SelectedPlayers.has(player.id) && (
                          <div className="ml-6 flex items-center gap-2">
                            <Label htmlFor={`badges-${player.id}`} className="text-xs">
                              Badges:
                            </Label>
                            <Input
                              id={`badges-${player.id}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              value={playerBadges.get(player.id) || ""}
                              onChange={(e) =>
                                setBadgeCount(player.id, parseInt(e.target.value) || 0)
                              }
                              className="w-20 h-8"
                            />
                            <a
                              href={player.playerPageUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View on 2kratings
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team 2 */}
          <Card>
            <CardHeader>
              <CardTitle>Team 2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Team</Label>
                <Select value={team2} onValueChange={setTeam2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {team2Loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {team2Roster && team2Roster.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Players</Label>
                  <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-3">
                    {team2Roster.map((player) => (
                      <div key={player.id} className="space-y-2 pb-2 border-b last:border-b-0">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={team2SelectedPlayers.has(player.id)}
                            onCheckedChange={() => togglePlayer(player.id, 2)}
                          />
                          <label className="text-sm font-medium flex-1">
                            {player.name} - {player.overall} OVR
                          </label>
                        </div>
                        {team2SelectedPlayers.has(player.id) && (
                          <div className="ml-6 flex items-center gap-2">
                            <Label htmlFor={`badges-${player.id}`} className="text-xs">
                              Badges:
                            </Label>
                            <Input
                              id={`badges-${player.id}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              value={playerBadges.get(player.id) || ""}
                              onChange={(e) =>
                                setBadgeCount(player.id, parseInt(e.target.value) || 0)
                              }
                              className="w-20 h-8"
                            />
                            <a
                              href={player.playerPageUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View on 2kratings
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trade Preview */}
        {team1PlayersWithBadges.length > 0 && team2PlayersWithBadges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Trade Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">{team1} Sends:</h3>
                  <div className="space-y-1">
                    {team1PlayersWithBadges.map((player) => (
                      <div key={player.id} className="text-sm">
                        {player.name} {player.overall} ({player.badges})
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 font-bold">
                      {team1TotalOvr} ({team1TotalBadges})
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">{team2} Sends:</h3>
                  <div className="space-y-1">
                    {team2PlayersWithBadges.map((player) => (
                      <div key={player.id} className="text-sm">
                        {player.name} {player.overall} ({player.badges})
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 font-bold">
                      {team2TotalOvr} ({team2TotalBadges})
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleConfirmTrade}
                  disabled={!canConfirmTrade || tradeConfirmed}
                  className="flex-1"
                >
                  {tradeConfirmed ? "Trade Confirmed ✓" : "Confirm Trade"}
                </Button>
                <Button
                  onClick={handlePostToDiscord}
                  disabled={!tradeConfirmed || postTradeMutation.isPending}
                  variant="default"
                  className="flex-1"
                >
                  {postTradeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post to Discord
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Trade</DialogTitle>
            <DialogDescription>
              Please review the trade details before confirming. Make sure all badge counts are
              correct.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <h4 className="font-semibold mb-2">{team1} Sends:</h4>
              {team1PlayersWithBadges.map((player) => (
                <div key={player.id} className="text-sm">
                  {player.name} {player.overall} ({player.badges} badges)
                </div>
              ))}
              <div className="text-sm font-bold mt-1">
                Total: {team1TotalOvr} OVR ({team1TotalBadges} badges)
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{team2} Sends:</h4>
              {team2PlayersWithBadges.map((player) => (
                <div key={player.id} className="text-sm">
                  {player.name} {player.overall} ({player.badges} badges)
                </div>
              ))}
              <div className="text-sm font-bold mt-1">
                Total: {team2TotalOvr} OVR ({team2TotalBadges} badges)
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalConfirm}>Confirm Trade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
