// @ts-nocheck
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PlayerSearch } from "@/components/PlayerSearch";
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
import { Loader2, ArrowLeftRight, Send, ArrowLeft } from "lucide-react";
import { getTeamLogo } from "@/lib/teamLogos";
import { getTeamColors, getTeamGradient, getContrastColor } from "@/lib/teamColors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlayerWithBadges {
  id: string;
  name: string;
  overall: number;
  team: string;
  photoUrl: string | null;
  badges: number;
}

export default function TradeMachine() {
  const [, navigate] = useLocation();
  const [tradeMode, setTradeMode] = useState<'2-team' | '3-team'>('2-team');
  const [team1, setTeam1] = useState<string>("");
  const [team2, setTeam2] = useState<string>("");
  const [team3, setTeam3] = useState<string>("");
  const [team1SelectedPlayers, setTeam1SelectedPlayers] = useState<Set<string>>(new Set());
  const [team2SelectedPlayers, setTeam2SelectedPlayers] = useState<Set<string>>(new Set());
  const [team3SelectedPlayers, setTeam3SelectedPlayers] = useState<Set<string>>(new Set());
  const [playerBadges, setPlayerBadges] = useState<Map<string, number>>(new Map());
  const [playerDestinations, setPlayerDestinations] = useState<Map<string, string>>(new Map());
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
  const { data: team3Roster, isLoading: team3Loading } = trpc.tradeMachine.getTeamRoster.useQuery(
    { teamName: team3 },
    { enabled: !!team3 && tradeMode === '3-team' }
  );

  const postTradeMutation = trpc.tradeMachine.postTradeToDiscord.useMutation({
    onSuccess: () => {
      toast.success("Trade posted to Discord successfully!");
      // Reset state
      setTeam1("");
      setTeam2("");
      setTeam3("");
      setTeam1SelectedPlayers(new Set());
      setTeam2SelectedPlayers(new Set());
      setTeam3SelectedPlayers(new Set());
      setPlayerBadges(new Map());
      setPlayerDestinations(new Map());
      setTradeConfirmed(false);
    },
    onError: (error) => {
      toast.error(`Failed to post trade: ${error.message}`);
    },
  });



  const togglePlayer = (playerId: string, team: 1 | 2 | 3) => {
    if (team === 1) {
      const newSet = new Set(team1SelectedPlayers);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      setTeam1SelectedPlayers(newSet);
    } else if (team === 2) {
      const newSet = new Set(team2SelectedPlayers);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      setTeam2SelectedPlayers(newSet);
    } else {
      const newSet = new Set(team3SelectedPlayers);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      setTeam3SelectedPlayers(newSet);
    }
  };

  const setBadgeCount = (playerId: string, badges: number) => {
    const newMap = new Map(playerBadges);
    newMap.set(playerId, badges);
    setPlayerBadges(newMap);
  };

  const setPlayerDestination = (playerId: string, destination: string) => {
    const newMap = new Map(playerDestinations);
    newMap.set(playerId, destination);
    setPlayerDestinations(newMap);
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

  const team3PlayersWithBadges = useMemo(() => {
    if (!team3Roster) return [];
    return Array.from(team3SelectedPlayers)
      .map((id) => {
        const player = team3Roster.find((p) => p.id === id);
        if (!player) return null;
        return {
          ...player,
          badges: playerBadges.get(id) || 0,
        };
      })
      .filter((p): p is PlayerWithBadges => p !== null);
  }, [team3Roster, team3SelectedPlayers, playerBadges]);

  const team1TotalOvr = team1PlayersWithBadges.reduce((sum, p) => sum + p.overall, 0);
  const team1TotalBadges = team1PlayersWithBadges.reduce((sum, p) => sum + p.badges, 0);
  const team2TotalOvr = team2PlayersWithBadges.reduce((sum, p) => sum + p.overall, 0);
  const team2TotalBadges = team2PlayersWithBadges.reduce((sum, p) => sum + p.badges, 0);
  const team3TotalOvr = team3PlayersWithBadges.reduce((sum, p) => sum + p.overall, 0);
  const team3TotalBadges = team3PlayersWithBadges.reduce((sum, p) => sum + p.badges, 0);

  // Check if all selected players have badge counts entered (including 0 as valid)
  // For 3-team trades, also check that all players have destinations assigned
  const canConfirmTrade =
    team1 &&
    team2 &&
    (tradeMode === '2-team' || team3) &&
    team1SelectedPlayers.size > 0 &&
    team2SelectedPlayers.size > 0 &&
    (tradeMode === '2-team' || team3SelectedPlayers.size > 0) &&
    Array.from(team1SelectedPlayers).every((id) => playerBadges.has(id) && playerBadges.get(id) !== undefined) &&
    Array.from(team2SelectedPlayers).every((id) => playerBadges.has(id) && playerBadges.get(id) !== undefined) &&
    (tradeMode === '2-team' || Array.from(team3SelectedPlayers).every((id) => playerBadges.has(id) && playerBadges.get(id) !== undefined)) &&
    (tradeMode === '2-team' || (
      Array.from(team1SelectedPlayers).every((id) => playerDestinations.has(id) && playerDestinations.get(id)) &&
      Array.from(team2SelectedPlayers).every((id) => playerDestinations.has(id) && playerDestinations.get(id)) &&
      Array.from(team3SelectedPlayers).every((id) => playerDestinations.has(id) && playerDestinations.get(id))
    ));

  const handleConfirmTrade = () => {
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = () => {
    setTradeConfirmed(true);
    setShowConfirmDialog(false);
    toast.success("Trade confirmed! You can now post it to Discord.");
  };

  const handlePostToDiscord = () => {
    const tradeData: any = {
      team1Name: team1,
      team1Players: team1PlayersWithBadges.map((p) => ({
        name: p.name,
        overall: p.overall,
        badges: p.badges,
        ...(tradeMode === '3-team' && { destination: playerDestinations.get(p.id) }),
      })),
      team2Name: team2,
      team2Players: team2PlayersWithBadges.map((p) => ({
        name: p.name,
        overall: p.overall,
        badges: p.badges,
        ...(tradeMode === '3-team' && { destination: playerDestinations.get(p.id) }),
      })),
    };

    if (tradeMode === '3-team') {
      tradeData.team3Name = team3;
      tradeData.team3Players = team3PlayersWithBadges.map((p) => ({
        name: p.name,
        overall: p.overall,
        badges: p.badges,
        destination: playerDestinations.get(p.id),
      }));
    }

    postTradeMutation.mutate(tradeData);

  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img 
                src="/hof-logo.png" 
                alt="Hall of Fame Basketball Association" 
                className="h-16 w-auto object-contain drop-shadow-lg"
              />
              <div>
                <h1 className="text-4xl font-bold mb-1">Trade Machine</h1>
                <p className="text-muted-foreground">
                  Build a trade between {tradeMode === '2-team' ? 'two' : 'three'} teams, verify badge counts, and post to Discord
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          {/* Trade Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={tradeMode === '2-team' ? 'default' : 'outline'}
              onClick={() => {
                setTradeMode('2-team');
                setTeam3("");
                setTeam3SelectedPlayers(new Set());
              }}
            >
              2-Team Trade
            </Button>
            <Button
              variant={tradeMode === '3-team' ? 'default' : 'outline'}
              onClick={() => setTradeMode('3-team')}
            >
              3-Team Trade
            </Button>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${tradeMode === '3-team' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 mb-6`}>
          {/* Team 1 */}
          <Card 
            className="border-2 transition-all shadow-lg hover:shadow-xl"
            style={{
              borderColor: team1 ? `${getTeamColors(team1).primary}50` : 'hsl(var(--primary) / 0.3)',
            }}
          >
            <CardHeader 
              className="border-b"
              style={{
                background: team1 ? `linear-gradient(135deg, ${getTeamColors(team1).primary}33 0%, ${getTeamColors(team1).secondary}1A 100%)` : 'linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.1) 100%)',
                borderColor: team1 ? `${getTeamColors(team1).primary}33` : 'hsl(var(--primary) / 0.2)',
              }}
            >
              <div className="flex items-center gap-3">
                {team1 && (
                  <img 
                    src={getTeamLogo(team1)} 
                    alt={team1}
                    className="h-10 w-10 object-contain"
                  />
                )}
                <CardTitle className="text-xl">{team1 || "Team 1"}</CardTitle>
              </div>
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
                        <div className="flex items-center gap-2">
                          <img 
                            src={getTeamLogo(team)} 
                            alt={team}
                            className="h-5 w-5 object-contain"
                          />
                          {team}
                        </div>
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
                      <div key={player.id} className="space-y-2 pb-2 border-b last:border-b-0 hover:bg-muted/30 rounded-md p-2 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={team1SelectedPlayers.has(player.id)}
                            onCheckedChange={() => togglePlayer(player.id, 1)}
                          />
                          {player.photoUrl && (
                            <img 
                              src={player.photoUrl} 
                              alt={player.name}
                              className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                            />
                          )}
                          <label className="text-sm font-medium flex-1 cursor-pointer">
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.overall} OVR</div>
                          </label>
                        </div>
                        {team1SelectedPlayers.has(player.id) && (
                          <div className="ml-6 space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`badges-${player.id}`} className="text-xs">
                                Badges:
                              </Label>
                              <Input
                                id={`badges-${player.id}`}
                                type="number"
                                min="0"
                                placeholder="0"
                                value={playerBadges.get(player.id) ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Always set the badge count, even for 0
                                  setBadgeCount(player.id, val === "" ? 0 : parseInt(val, 10) || 0);
                                }}
                                onBlur={(e) => {
                                  // Ensure badge is set on blur even if empty
                                  if (!playerBadges.has(player.id)) {
                                    setBadgeCount(player.id, parseInt(e.target.value, 10) || 0);
                                  }
                                }}
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
                            {tradeMode === '3-team' && team2 && team3 && (
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`dest-${player.id}`} className="text-xs">
                                  Goes to:
                                </Label>
                                <Select
                                  value={playerDestinations.get(player.id) || ""}
                                  onValueChange={(value) => setPlayerDestination(player.id, value)}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue placeholder="Select team" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={team2}>{team2}</SelectItem>
                                    <SelectItem value={team3}>{team3}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
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
          <Card 
            className="border-2 transition-all shadow-lg hover:shadow-xl"
            style={{
              borderColor: team2 ? `${getTeamColors(team2).primary}50` : 'hsl(var(--border))',
            }}
          >
            <CardHeader 
              className="border-b"
              style={{
                background: team2 ? `linear-gradient(135deg, ${getTeamColors(team2).primary}33 0%, ${getTeamColors(team2).secondary}1A 100%)` : 'transparent',
                borderColor: team2 ? `${getTeamColors(team2).primary}33` : 'hsl(var(--border))',
              }}
            >
              <div className="flex items-center gap-3">
                {team2 && (
                  <img 
                    src={getTeamLogo(team2)} 
                    alt={team2}
                    className="h-10 w-10 object-contain"
                  />
                )}
                <CardTitle className="text-xl">{team2 || "Team 2"}</CardTitle>
              </div>
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
                        <div className="flex items-center gap-2">
                          <img 
                            src={getTeamLogo(team)} 
                            alt={team}
                            className="h-5 w-5 object-contain"
                          />
                          {team}
                        </div>
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
                      <div key={player.id} className="space-y-2 pb-2 border-b last:border-b-0 hover:bg-muted/30 rounded-md p-2 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={team2SelectedPlayers.has(player.id)}
                            onCheckedChange={() => togglePlayer(player.id, 2)}
                          />
                          {player.photoUrl && (
                            <img 
                              src={player.photoUrl} 
                              alt={player.name}
                              className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                            />
                          )}
                          <label className="text-sm font-medium flex-1 cursor-pointer">
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.overall} OVR</div>
                          </label>
                        </div>
                        {team2SelectedPlayers.has(player.id) && (
                          <div className="ml-6 space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`badges-${player.id}`} className="text-xs">
                                Badges:
                              </Label>
                              <Input
                                id={`badges-${player.id}`}
                                type="number"
                                min="0"
                                placeholder="0"
                                value={playerBadges.get(player.id) ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Always set the badge count, even for 0
                                  setBadgeCount(player.id, val === "" ? 0 : parseInt(val, 10) || 0);
                                }}
                                onBlur={(e) => {
                                  // Ensure badge is set on blur even if empty
                                  if (!playerBadges.has(player.id)) {
                                    setBadgeCount(player.id, parseInt(e.target.value, 10) || 0);
                                  }
                                }}
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
                            {tradeMode === '3-team' && team1 && team3 && (
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`dest-${player.id}`} className="text-xs">
                                  Goes to:
                                </Label>
                                <Select
                                  value={playerDestinations.get(player.id) || ""}
                                  onValueChange={(value) => setPlayerDestination(player.id, value)}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue placeholder="Select team" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={team1}>{team1}</SelectItem>
                                    <SelectItem value={team3}>{team3}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team 3 */}
          {tradeMode === '3-team' && (
            <Card 
              className="border-2 transition-all shadow-lg hover:shadow-xl"
              style={{
                borderColor: team3 ? `${getTeamColors(team3).primary}50` : 'hsl(var(--border))',
              }}
            >
              <CardHeader 
                className="border-b"
                style={{
                  background: team3 ? `linear-gradient(135deg, ${getTeamColors(team3).primary}33 0%, ${getTeamColors(team3).secondary}1A 100%)` : 'transparent',
                  borderColor: team3 ? `${getTeamColors(team3).primary}33` : 'hsl(var(--border))',
                }}
              >
                <div className="flex items-center gap-3">
                  {team3 && (
                    <img 
                      src={getTeamLogo(team3)} 
                      alt={team3}
                      className="h-10 w-10 object-contain"
                    />
                  )}
                  <CardTitle className="text-xl">{team3 || "Team 3"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Team</Label>
                  <Select value={team3} onValueChange={setTeam3}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team} value={team}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={getTeamLogo(team)} 
                              alt={team}
                              className="h-5 w-5 object-contain"
                            />
                            {team}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {team3Loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}

                {team3Roster && team3Roster.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Players</Label>
                    <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-3">
                      {team3Roster.map((player) => (
                        <div key={player.id} className="space-y-2 pb-2 border-b last:border-b-0 hover:bg-muted/30 rounded-md p-2 transition-colors">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={team3SelectedPlayers.has(player.id)}
                              onCheckedChange={() => togglePlayer(player.id, 3)}
                            />
                            {player.photoUrl && (
                              <img 
                                src={player.photoUrl} 
                                alt={player.name}
                                className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                              />
                            )}
                            <label className="text-sm font-medium flex-1 cursor-pointer">
                              <div className="font-semibold">{player.name}</div>
                              <div className="text-xs text-muted-foreground">{player.overall} OVR</div>
                            </label>
                          </div>
                          {team3SelectedPlayers.has(player.id) && (
                            <div className="ml-6 space-y-2">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`badges-${player.id}`} className="text-xs">
                                  Badges:
                                </Label>
                                <Input
                                  id={`badges-${player.id}`}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={playerBadges.get(player.id) ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    // Always set the badge count, even for 0
                                    setBadgeCount(player.id, val === "" ? 0 : parseInt(val, 10) || 0);
                                  }}
                                  onBlur={(e) => {
                                    // Ensure badge is set on blur even if empty
                                    if (!playerBadges.has(player.id)) {
                                      setBadgeCount(player.id, parseInt(e.target.value, 10) || 0);
                                    }
                                  }}
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
                              {team1 && team2 && (
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`dest-${player.id}`} className="text-xs">
                                    Goes to:
                                  </Label>
                                  <Select
                                    value={playerDestinations.get(player.id) || ""}
                                    onValueChange={(value) => setPlayerDestination(player.id, value)}
                                  >
                                    <SelectTrigger className="w-32 h-8">
                                      <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={team1}>{team1}</SelectItem>
                                      <SelectItem value={team2}>{team2}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trade Preview */}
        {team1PlayersWithBadges.length > 0 && team2PlayersWithBadges.length > 0 && (tradeMode === '2-team' || team3PlayersWithBadges.length > 0) && (
          <Card className="mb-6 border-2 border-purple-500/30 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-purple-500/20 border-b border-purple-500/20">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ArrowLeftRight className="h-6 w-6 text-purple-500" />
                Trade Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 ${tradeMode === '3-team' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: `${getTeamColors(team1).primary}0D`,
                    borderColor: `${getTeamColors(team1).primary}33`,
                  }}
                >
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <img src={getTeamLogo(team1)} alt={team1} className="h-6 w-6 object-contain" />
                    {team1} Sends:
                  </h3>
                  <div className="space-y-1">
                      {team1PlayersWithBadges.map((player) => {
                        const destination = tradeMode === '3-team' ? playerDestinations[player.id] : null;
                        return (
                          <div key={player.id} className="text-sm flex items-center gap-2 py-1">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-muted-foreground">{player.overall} OVR</span>
                            <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">{player.badges} badges</span>
                            {destination && (
                              <span className="text-xs text-blue-400 ml-2">→ {destination}</span>
                            )}
                          </div>
                        );
                      })}
                    <div 
                      className="border-t pt-3 mt-3 font-bold flex items-center gap-3"
                      style={{ borderColor: `${getTeamColors(team1).primary}33` }}
                    >
                      <span className="text-lg">{team1TotalOvr} OVR</span>
                      <span 
                        className="text-sm px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${getTeamColors(team1).primary}33` }}
                      >{team1TotalBadges} badges</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: `${getTeamColors(team2).primary}0D`,
                    borderColor: `${getTeamColors(team2).primary}33`,
                  }}
                >
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <img src={getTeamLogo(team2)} alt={team2} className="h-6 w-6 object-contain" />
                    {team2} Sends:
                  </h3>
                  <div className="space-y-1">
                      {team2PlayersWithBadges.map((player) => {
                        const destination = tradeMode === '3-team' ? playerDestinations[player.id] : null;
                        return (
                          <div key={player.id} className="text-sm flex items-center gap-2 py-1">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-muted-foreground">{player.overall} OVR</span>
                            <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">{player.badges} badges</span>
                            {destination && (
                              <span className="text-xs text-blue-400 ml-2">→ {destination}</span>
                            )}
                          </div>
                        );
                      })}
                    <div 
                      className="border-t pt-3 mt-3 font-bold flex items-center gap-3"
                      style={{ borderColor: `${getTeamColors(team2).primary}33` }}
                    >
                      <span className="text-lg">{team2TotalOvr} OVR</span>
                      <span 
                        className="text-sm px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${getTeamColors(team2).primary}33` }}
                      >{team2TotalBadges} badges</span>
                    </div>
                  </div>
                </div>

                {tradeMode === '3-team' && team3PlayersWithBadges.length > 0 && (
                  <div 
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: `${getTeamColors(team3).primary}0D`,
                      borderColor: `${getTeamColors(team3).primary}33`,
                    }}
                  >
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <img src={getTeamLogo(team3)} alt={team3} className="h-6 w-6 object-contain" />
                      {team3} Sends:
                    </h3>
                    <div className="space-y-1">
                      {team3PlayersWithBadges.map((player) => {
                        const destination = playerDestinations[player.id];
                        return (
                          <div key={player.id} className="text-sm flex items-center gap-2 py-1">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-muted-foreground">{player.overall} OVR</span>
                            <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">{player.badges} badges</span>
                            {destination && (
                              <span className="text-xs text-blue-400 ml-2">→ {destination}</span>
                            )}
                          </div>
                        );
                      })}
                      <div 
                        className="border-t pt-3 mt-3 font-bold flex items-center gap-3"
                        style={{ borderColor: `${getTeamColors(team3).primary}33` }}
                      >
                        <span className="text-lg">{team3TotalOvr} OVR</span>
                        <span 
                          className="text-sm px-3 py-1 rounded-full"
                          style={{ backgroundColor: `${getTeamColors(team3).primary}33` }}
                        >{team3TotalBadges} badges</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>



              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleConfirmTrade}
                  disabled={!canConfirmTrade || tradeConfirmed}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg"
                  size="lg"
                >
                  {tradeConfirmed ? "✓ Trade Confirmed" : "Confirm Trade"}
                </Button>
                <Button
                  onClick={handlePostToDiscord}
                  disabled={!tradeConfirmed || postTradeMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  size="lg"
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
              {team1PlayersWithBadges.map((player) => {
                const destination = tradeMode === '3-team' ? playerDestinations[player.id] : null;
                return (
                  <div key={player.id} className="text-sm">
                    {player.name} {player.overall} ({player.badges} badges)
                    {destination && <span className="text-blue-400 ml-2">→ {destination}</span>}
                  </div>
                );
              })}
              <div className="text-sm font-bold mt-1">
                Total: {team1TotalOvr} OVR ({team1TotalBadges} badges)
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{team2} Sends:</h4>
              {team2PlayersWithBadges.map((player) => {
                const destination = tradeMode === '3-team' ? playerDestinations[player.id] : null;
                return (
                  <div key={player.id} className="text-sm">
                    {player.name} {player.overall} ({player.badges} badges)
                    {destination && <span className="text-blue-400 ml-2">→ {destination}</span>}
                  </div>
                );
              })}
              <div className="text-sm font-bold mt-1">
                Total: {team2TotalOvr} OVR ({team2TotalBadges} badges)
              </div>
            </div>

            {tradeMode === '3-team' && team3PlayersWithBadges.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">{team3} Sends:</h4>
                {team3PlayersWithBadges.map((player) => {
                  const destination = playerDestinations[player.id];
                  return (
                    <div key={player.id} className="text-sm">
                      {player.name} {player.overall} ({player.badges} badges)
                      {destination && <span className="text-blue-400 ml-2">→ {destination}</span>}
                    </div>
                  );
                })}
                <div className="text-sm font-bold mt-1">
                  Total: {team3TotalOvr} OVR ({team3TotalBadges} badges)
                </div>
              </div>
            )}
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
