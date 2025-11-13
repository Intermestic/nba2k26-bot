import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowRight, Home, Users } from "lucide-react";
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
  // Try exact match first
  if (TEAM_NAME_MAP[teamName]) {
    return TEAM_NAME_MAP[teamName];
  }
  // Return as-is if no mapping found
  return teamName;
}

export default function Trades() {
  const { user, isAuthenticated } = useAuth();
  const [tradeText, setTradeText] = useState("");
  const [parsedTrades, setParsedTrades] = useState<TradeMove[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all players for matching
  const { data: allPlayers } = trpc.player.list.useQuery({
    limit: 1000,
  });

  // Update team mutation
  const updateTeamMutation = trpc.player.updateTeam.useMutation();

  // Check if user is admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-4">
            You must be an admin to access this page.
          </p>
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
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
      // Check if line is "Team Receive:"
      if (line.endsWith("Receive:")) {
        const rawTeamName = line.replace("Receive:", "").trim();
        currentTeam = normalizeTeamName(rawTeamName);
        continue;
      }

      // Check if line is a separator
      if (line === "---" || line.startsWith("---")) {
        continue;
      }

      // Check if line is a player (format: "Player Name (XX OVR)")
      const playerMatch = line.match(/^(.+?)\s*\((\d+)\s*OVR\)$/i);
      if (playerMatch && currentTeam) {
        const playerName = playerMatch[1].trim();
        const overall = parseInt(playerMatch[2]);

        // Find player in database
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
      toast.error("No valid trades found. Check format:\\n\\nTeam Name Receive:\\nPlayer Name (XX OVR)");
      return;
    }

    setParsedTrades(trades);
    toast.success(`Parsed ${trades.length} player moves`);
  };

  const processTrades = async () => {
    if (parsedTrades.length === 0) {
      toast.error("No trades to process");
      return;
    }

    setIsProcessing(true);

    try {
      // Process all trades
      for (const trade of parsedTrades) {
        const player = allPlayers?.find(p => p.name === trade.playerName);
        if (player) {
          await updateTeamMutation.mutateAsync({
            playerId: player.id,
            team: trade.toTeam,
          });
        }
      }

      toast.success(`Successfully processed ${parsedTrades.length} trades!`);
      setTradeText("");
      setParsedTrades([]);
    } catch (error: any) {
      toast.error(`Failed to process trades: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Bulk Trade Processor</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">
                  <Users className="w-4 h-4 mr-2" />
                  Team Management
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/players">
                  <Users className="w-4 h-4 mr-2" />
                  Player Management
                </Link>
              </Button>
            </div>
          </div>
          <p className="text-gray-300">
            Paste trade text below to automatically update player teams in bulk.
          </p>
        </div>

        {/* Trade Input Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-200 mb-2 block">
                Paste Trade Text
              </label>
              <Textarea
                value={tradeText}
                onChange={(e) => setTradeText(e.target.value)}
                placeholder={`Brooklyn Nets Receive:

Nikola Jokic (98 OVR)
Aaron Gordon (83 OVR)
Mark Sears (70 OVR)

Milwaukee Bucks Receive:

Bam Adebayo (89 OVR)
Jimmy Butler (88 OVR)
Naz Reid (82 OVR)

---

Portland Trail Blazers Receive:

Ja Morant (89 OVR)
Brandon Miller (82 OVR)
Isaac Okoro (74 OVR)

Cleveland Cavaliers Receive:

Julius Randle (88 OVR)
Dejounte Murray (81 OVR)
Khris Middleton (78 OVR)`}
                className="min-h-[300px] font-mono text-sm bg-slate-900 border-slate-600 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={parseTrades}
                disabled={!tradeText.trim()}
                variant="outline"
              >
                Parse Trades
              </Button>
              <Button
                onClick={processTrades}
                disabled={parsedTrades.length === 0 || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process ${parsedTrades.length} Trades`
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Trade Summary */}
        {parsedTrades.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              Trade Summary ({parsedTrades.length} moves)
            </h2>
            <div className="space-y-2">
              {parsedTrades.map((trade, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-slate-900 rounded-lg border border-slate-700"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-white">{trade.playerName}</div>
                    <div className="text-sm text-gray-400">
                      {trade.overall} OVR
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {trade.fromTeam}
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <div className="text-sm font-medium text-green-400">
                    {trade.toTeam}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
