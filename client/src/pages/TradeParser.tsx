import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { parseTrade, ParsedTrade, ParsedTeamTrade } from "@/lib/tradeParser";
import { AlertCircle, ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

function PlayerCard({ name, rating, badges }: { name: string; rating: number; badges: number }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors">
      <div className="flex-1">
        <p className="font-semibold text-foreground">{name}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Rating</p>
          <p className="text-lg font-bold text-primary">{rating}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Badges</p>
          <p className="text-lg font-bold text-accent-foreground">{badges}</p>
        </div>
      </div>
    </div>
  );
}

function TeamTradeCard({ team }: { team: ParsedTeamTrade }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="text-2xl">{team.teamName}</CardTitle>
        <CardDescription>Trade Overview</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Sends Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">Sends</h3>
          </div>
          {team.sends.length > 0 ? (
            <div className="space-y-2">
              {team.sends.map((player, idx) => (
                <PlayerCard key={idx} {...player} />
              ))}
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total Sent:</span>
                  <div className="flex gap-6">
                    <span className="text-lg font-bold text-destructive">
                      {team.sendsTotalRating} Rating
                    </span>
                    <span className="text-lg font-bold text-destructive">
                      {team.sendsTotalBadges} Badges
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No players sent</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border"></div>
          <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Receives Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-foreground">Receives</h3>
          </div>
          {team.receives.length > 0 ? (
            <div className="space-y-2">
              {team.receives.map((player, idx) => (
                <PlayerCard key={idx} {...player} />
              ))}
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total Received:</span>
                  <div className="flex gap-6">
                    <span className="text-lg font-bold text-green-600">
                      {team.receivesTotalRating} Rating
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {team.receivesTotalBadges} Badges
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No players received</p>
          )}
        </div>

        {/* Net Change */}
        <div className="pt-4 border-t">
          <div className="p-4 bg-primary/5 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Net Change</h4>
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Rating: </span>
                <span className={`font-bold ${
                  team.receivesTotalRating - team.sendsTotalRating > 0 
                    ? 'text-green-600' 
                    : team.receivesTotalRating - team.sendsTotalRating < 0 
                    ? 'text-destructive' 
                    : 'text-muted-foreground'
                }`}>
                  {team.receivesTotalRating - team.sendsTotalRating > 0 ? '+' : ''}
                  {team.receivesTotalRating - team.sendsTotalRating}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Badges: </span>
                <span className={`font-bold ${
                  team.receivesTotalBadges - team.sendsTotalBadges > 0 
                    ? 'text-green-600' 
                    : team.receivesTotalBadges - team.sendsTotalBadges < 0 
                    ? 'text-destructive' 
                    : 'text-muted-foreground'
                }`}>
                  {team.receivesTotalBadges - team.sendsTotalBadges > 0 ? '+' : ''}
                  {team.receivesTotalBadges - team.sendsTotalBadges}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TradeParser() {
  const [tradeText, setTradeText] = useState("");
  const [parsedTrade, setParsedTrade] = useState<ParsedTrade | null>(null);

  const handleParse = () => {
    const result = parseTrade(tradeText);
    setParsedTrade(result);
  };

  const handleClear = () => {
    setTradeText("");
    setParsedTrade(null);
  };

  const exampleTrade = `**Sixers Sends/Receives**

Ausar Thompson 82 (13)/ Jaden McDaniels 83 (15)
--
82 (13) / 83 (15)


**Wizards Sends/Receives:**

Cam Whitmore 75 (8) / MarJon Beauchamp 70 (0)
Jaden McDaniels 83 (15) / Scottie Barnes 87 (16)
Landry Shamet 77 (4) / Cody Zeller 70 (4)
--
235 (27) / 227 (20)

**Knicks Sends  / Receives:**

Scottie Barnes 87 (16) / Ausar Thompson 82 (13)
MarJon Beauchamp 70 (0) / Cam Whitmore 75 (8)
Cody Zeller 70 (4) / Landry Shamet 77 (4) 
--
227 (20) / 234 (26)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            NBA 2K26 Trade Parser
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Parse multi-team trades with player ratings and badge counts. Paste your trade text below and click Parse to analyze.
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Trade Input</CardTitle>
            <CardDescription>
              Paste your trade text in the format: **Team Name Sends/Receives** followed by player lines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={exampleTrade}
              value={tradeText}
              onChange={(e) => setTradeText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button onClick={handleParse} className="flex-1" size="lg">
                Parse Trade
              </Button>
              <Button onClick={handleClear} variant="outline" size="lg">
                Clear
              </Button>
              <Button 
                onClick={() => setTradeText(exampleTrade)} 
                variant="secondary" 
                size="lg"
              >
                Load Example
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {parsedTrade && (
          <div className="space-y-6">
            {/* Errors */}
            {parsedTrade.errors.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <CardTitle className="text-destructive">Parsing Errors</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {parsedTrade.errors.map((error, idx) => (
                      <li key={idx} className="text-sm text-destructive">{error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Teams */}
            {parsedTrade.teams.length > 0 && (
              <>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-foreground">
                    Parsed Trade Results
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {parsedTrade.teams.length} team{parsedTrade.teams.length !== 1 ? 's' : ''} involved
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {parsedTrade.teams.map((team, idx) => (
                    <TeamTradeCard key={idx} team={team} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
