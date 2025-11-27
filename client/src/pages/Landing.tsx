import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { getTeamLogo } from "@/lib/teamLogos";

export default function Landing() {
  const [, navigate] = useLocation();
  const { data: teams, isLoading } = trpc.dashboard.getTeamsWithCapData.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {APP_TITLE}
              </h1>
              <p className="text-muted-foreground">
                NBA 2K26 league management platform - Browse teams, players, and build trades
              </p>
            </div>
            <Button
              onClick={() => navigate("/trade-machine")}
              className="gap-2"
              size="lg"
            >
              <ArrowLeftRight className="h-5 w-5" />
              Trade Machine
            </Button>
          </div>
        </div>

        {/* Teams Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Cap Status</CardTitle>
            <CardDescription>
              Click any team to view their full roster. Cap limit: 1098 total overall
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Team</th>
                      <th className="text-center py-3 px-4 font-semibold">Players</th>
                      <th className="text-center py-3 px-4 font-semibold">Total Overall</th>
                      <th className="text-center py-3 px-4 font-semibold">FA Coins</th>
                      <th className="text-center py-3 px-4 font-semibold">Cap Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams?.map((team) => (
                      <tr
                        key={team.team}
                        onClick={() => navigate(`/players?team=${encodeURIComponent(team.team)}`)}
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {getTeamLogo(team.team) && (
                              <div className="w-8 h-8 bg-white rounded-full p-1 shadow-sm flex-shrink-0">
                                <img
                                  src={getTeamLogo(team.team)!}
                                  alt={`${team.team} logo`}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <span className="font-medium">{team.team}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {team.isFreeAgents ? team.playerCount : `${team.playerCount}/14`}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {team.totalOverall}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {team.isFreeAgents ? (
                            <span className="text-muted-foreground">—</span>
                          ) : team.faCoins !== null ? (
                            <span className={team.faCoins === 0 ? "text-red-500 font-semibold" : ""}>
                              {team.faCoins}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {team.isFreeAgents ? (
                            <span className="inline-flex items-center gap-1 text-blue-500 font-semibold">
                              🔵 FA Pool
                            </span>
                          ) : team.isOverCap ? (
                            <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                              🔴 +{team.overCap}
                            </span>
                          ) : team.overCap === 0 ? (
                            <span className="inline-flex items-center gap-1 text-yellow-500 font-semibold">
                              🟡 At Cap
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-green-500 font-semibold">
                              🟢 {team.overCap}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by NBA 2K26 Player Database • Built with React & tRPC</p>
        </div>
      </div>
    </div>
  );
}
