import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ArrowLeftRight, Users } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {APP_TITLE}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your complete NBA 2K26 league management platform. Browse players, analyze rosters, and build trades.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Player Database Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer" onClick={() => navigate("/players")}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Player Database</CardTitle>
              </div>
              <CardDescription className="text-base">
                Browse and search through the complete roster of NBA 2K26 players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  View all players with ratings and team assignments
                </li>
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Search by name, team, or overall rating
                </li>
                <li className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Export data in CSV or JSON format
                </li>
              </ul>
              <Button className="w-full" onClick={() => navigate("/players")}>
                Browse Players
              </Button>
            </CardContent>
          </Card>

          {/* Trade Machine Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer" onClick={() => navigate("/trade-machine")}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Trade Machine</CardTitle>
              </div>
              <CardDescription className="text-base">
                Build and analyze trades between teams with badge tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Select players from any two teams
                </li>
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Track badge counts for accurate trade values
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Post trades directly to Discord for voting
                </li>
              </ul>
              <Button className="w-full" onClick={() => navigate("/trade-machine")}>
                Build a Trade
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Powered by NBA 2K26 Player Database • Built with React & tRPC</p>
        </div>
      </div>
    </div>
  );
}
