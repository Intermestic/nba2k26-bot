import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Home, Users } from "lucide-react";
import { Link } from "wouter";

interface TradeMove {
  playerName: string;
  overall: number;
  fromTeam: string;
  toTeam: string;
}

// Map full team names to database shortened names
const TEAM_NAME_MAP: Record<string, string> = {
  "Atlanta Hawks": "Hawks",
  "Boston Celtics": "Celtics",
  "Brooklyn Nets": "Nets",
  "Charlotte Hornets": "Hornets",
  "Chicago Bulls": "Bulls",
  "Cleveland Cavaliers": "Cavaliers",
  "Dallas Mavericks": "Mavericks",
  "Denver Nuggets": "Nuggets",
  "Detroit Pistons": "Pistons",
  "Golden State Warriors": "Warriors",
  "Houston Rockets": "Rockets",
  "Indiana Pacers": "Pacers",
  "LA Clippers": "Clippers",
  "Los Angeles Clippers": "Clippers",
  "Los Angeles Lakers": "Lakers",
  "LA Lakers": "Lakers",
  "Memphis Grizzlies": "Grizzlies",
  "Miami Heat": "Heat",
  "Milwaukee Bucks": "Bucks",
  "Minnesota Timberwolves": "Timberwolves",
  "New Orleans Pelicans": "Pelicans",
  "New York Knicks": "Knicks",
  "Oklahoma City Thunder": "Thunder",
  "Orlando Magic": "Magic",
  "Philadelphia 76ers": "Sixers",
  "Philadelphia Sixers": "Sixers",
  "Phoenix Suns": "Suns",
  "Portland Trail Blazers": "Trail Blazers",
  "Sacramento Kings": "Kings",
  "San Antonio Spurs": "Spurs",
  "Toronto Raptors": "Raptors",
  "Utah Jazz": "Jazz",
  "Washington Wizards": "Wizards",
};

function normalizeTeamName(teamName: string): string {
  if (TEAM_NAME_MAP[teamName]) {
    return TEAM_NAME_MAP[teamName];
  }
  return teamName;
}

export default function Trades() {
  const { user, isAuthenticated } = useAuth();
  const [tradeText, setTradeText] = useState("");
  const [parsedTrades, setParsedTrades] = useState<TradeMove[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: allPlayers } = trpc.player.list.useQuery({ limit: 1000 });
  const updateTeamMutation = trpc.player.updateTeam.useMutation();

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
            <p className="text-slate-400 mb-4">You must be logged in as an admin to access this page.</p>
            <Button asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parseTrades = () => {
    if (!allPlayers) {
      toast.error("Player data not loaded yet");
      return;
    }

    const lines = tradeText.split("\n").map(l => l.trim()).filter(l => l);
    const trades: TradeMove[] = [];
    let currentTeam = "";

    for (const line of lines) {
      if (line.endsWith("Receive:")) {
        const rawTeamName = line.replace("Receive:", "").trim();
        currentTeam = normalizeTeamName(rawTeamName);
        continue;
      }

      if (line === "---" || line.startsWith("---")) {
        continue;
      }

      const playerMatch = line.match(/^(.+?)\s*\((\d+)\s*OVR\)$/i);
      if (playerMatch && currentTeam) {
        const playerName = playerMatch[1].trim();
        const overall = parseInt(playerMatch[2]);

        const player = allPlayers.find(p => 
          p.name.toLowerCase() === playerName.toLowerCase()
        );

        if (player) {
          trades.push({
            playerName: player.name,
            overall: player.overall,
            fromTeam: player.team || "Unknown",
            toTeam: normalizeTeamName(currentTeam),
          });
        } else {
          toast.warning(`Player not found: ${playerName}`);
        }
      }
    }

    if (trades.length === 0) {
      toast.error("No valid trades found");
      return;
    }

    setParsedTrades(trades);
    toast.success(`Parsed ${trades.length} player moves`);
  };

  const processTrades = async () => {
    if (parsedTrades.length === 0) {
      toast.error("Please parse trades first");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const trade of parsedTrades) {
      try {
        const player = allPlayers?.find(p => p.name === trade.playerName);
        if (player) {
          await updateTeamMutation.mutateAsync({
            playerId: player.id,
            team: trade.toTeam,
          });
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to update ${trade.playerName}:`, error);
        errorCount++;
      }
    }

    setIsProcessing(false);
    
    if (errorCount === 0) {
      toast.success(`Successfully processed ${successCount} trades!`);
      setTradeText("");
      setParsedTrades([]);
    } else {
      toast.warning(`Processed ${successCount} trades with ${errorCount} errors`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-12 md:h-16 w-auto" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">Bulk Trade Processor</h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1">Process multiple player trades at once</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin">Team Management</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/admin/players">Player Management</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Link href="/">Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Trade Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Paste Trade Text
              </label>
              <Textarea
                value={tradeText}
                onChange={(e) => setTradeText(e.target.value)}
                placeholder={`Brooklyn Nets Receive:

Nikola Jokic (98 OVR)
Aaron Gordon (83 OVR)

Milwaukee Bucks Receive:

Bam Adebayo (89 OVR)
Jimmy Butler (88 OVR)`}
                className="min-h-[300px] font-mono text-sm bg-slate-900 border-slate-600 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={parseTrades} disabled={!tradeText.trim()}>
                Parse Trades
              </Button>
              <Button 
                onClick={() => {
                  setTradeText("");
                  setParsedTrades([]);
                }}
                variant="outline"
                disabled={!tradeText.trim() && parsedTrades.length === 0}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {parsedTrades.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Parsed Trades ({parsedTrades.length} moves)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {parsedTrades.map((trade, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-700"
                  >
                    <div className="text-white">
                      <span className="font-medium">{trade.playerName}</span>
                      <span className="text-slate-400 text-sm ml-2">({trade.overall} OVR)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">{trade.fromTeam}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-green-400">{trade.toTeam}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={processTrades}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process ${parsedTrades.length} Trades`
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
