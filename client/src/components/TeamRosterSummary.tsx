import { Card, CardContent } from "@/components/ui/card";
import { TeamLogoBadge } from "./TeamLogoBadge";

interface TeamRosterSummaryProps {
  team: string;
  playerCount: number;
  totalCap: number;
}

const SALARY_CAP_LIMIT = 1098; // NBA salary cap in millions

/**
 * TeamRosterSummary component displays team roster information
 * Shows player count (x/14) and total salary cap with color-coded status
 */
export function TeamRosterSummary({ team, playerCount, totalCap }: TeamRosterSummaryProps) {
  // Determine cap status color
  const getCapStatusColor = () => {
    if (totalCap < SALARY_CAP_LIMIT) return "text-green-500"; // Under cap
    if (totalCap === SALARY_CAP_LIMIT) return "text-foreground"; // At cap
    return "text-red-500"; // Over cap
  };

  const getCapStatusText = () => {
    if (totalCap < SALARY_CAP_LIMIT) return "Under Cap";
    if (totalCap === SALARY_CAP_LIMIT) return "At Cap";
    return "Over Cap";
  };

  return (
    <Card className="bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Team Logo */}
          <TeamLogoBadge team={team} size="lg" />
          
          {/* Team Info */}
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">{team}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="text-muted-foreground">
                Roster: <span className="font-semibold text-foreground">{playerCount}/14</span>
              </span>
              <span className="text-muted-foreground">
                Total Cap: <span className={`font-semibold ${getCapStatusColor()}`}>${totalCap}M</span>
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {getCapStatusText()} (Cap: ${SALARY_CAP_LIMIT}M)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
