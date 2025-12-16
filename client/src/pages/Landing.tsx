import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, Loader2, Shield } from "lucide-react";
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
          <div className="flex flex-col gap-4">
            {/* Logo and Title Row */}
            <div className="flex items-start gap-4 md:gap-6">
              <img 
                src="/hof-logo.png" 
                alt="Hall of Fame Basketball Association" 
                className="h-12 md:h-16 w-auto object-contain drop-shadow-lg flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Hall of Fame Basketball Association
                </h1>
                <p className="text-lg md:text-xl font-semibold text-primary mb-1">
                  SZN 17 Player Database
                </p>
                <p className="text-sm md:text-base text-muted-foreground">
                  Browse teams, players, and build trades
                </p>
              </div>
            </div>
            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate("/trade-machine")}
                className="gap-2"
                size="default"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Trade Machine
              </Button>
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="gap-2"
                size="default"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </div>
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
          <p>Hall of Fame Basketball Association SZN 17 • Powered by NBA 2K26 Player Database</p>
        </div>
      </div>
    </div>
  );
}
