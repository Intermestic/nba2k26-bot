import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamLogoBadge } from "./TeamLogoBadge";
import { ArrowUpDown } from "lucide-react";

interface TeamSummary {
  team: string;
  playerCount: number;
  totalOverall: number;
  totalCap: number;
  coinsRemaining?: number;
}

interface TeamSummariesTableProps {
  summaries: TeamSummary[];
  onTeamClick?: (team: string) => void;
}

const OVERALL_CAP_LIMIT = 1098;
const SALARY_CAP_LIMIT = 140;

export function TeamSummariesTable({ summaries, onTeamClick }: TeamSummariesTableProps) {
  const [sortBy, setSortBy] = useState<"team" | "players" | "overall">("team");
  const [sortDesc, setSortDesc] = useState(false);

  const sortedSummaries = useMemo(() => {
    const sorted = [...summaries].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "team") {
        comparison = a.team.localeCompare(b.team);
      } else if (sortBy === "players") {
        comparison = a.playerCount - b.playerCount;
      } else if (sortBy === "overall") {
        comparison = a.totalOverall - b.totalOverall;
      }
      
      return sortDesc ? -comparison : comparison;
    });
    
    return sorted;
  }, [summaries, sortBy, sortDesc]);

  const handleSort = (column: "team" | "players" | "overall") => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(false);
    }
  };

  const getCapStatusColor = (totalOverall: number) => {
    if (totalOverall < OVERALL_CAP_LIMIT) return "text-green-500";
    if (totalOverall === OVERALL_CAP_LIMIT) return "text-foreground";
    return "text-red-500";
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">All Teams Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort("team")}
                >
                  <div className="flex items-center gap-2">
                    Team
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white text-center"
                  onClick={() => handleSort("players")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="hidden md:inline">Players</span>
                    <span className="md:hidden">P</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white text-center"
                  onClick={() => handleSort("overall")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="hidden md:inline">Total Overall</span>
                    <span className="md:hidden">OVR</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-300 text-center">
                  <span className="hidden md:inline">FA Coins</span>
                  <span className="md:hidden">Coins</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSummaries.map((summary) => (
                <TableRow 
                  key={summary.team}
                  className="border-slate-700 hover:bg-slate-800/70 cursor-pointer transition-colors"
                  onClick={() => onTeamClick?.(summary.team)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 md:gap-3">
                      <TeamLogoBadge team={summary.team} size="sm" className="hidden md:block" />
                      <span className="text-white text-sm md:text-base">{summary.team}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-slate-300 text-sm md:text-base px-2">
                    {summary.playerCount}/14
                  </TableCell>
                  <TableCell className={`text-center font-semibold text-sm md:text-base px-2 ${getCapStatusColor(summary.totalOverall)}`}>
                    {summary.totalOverall}
                    {summary.totalOverall > OVERALL_CAP_LIMIT && (
                      <span className="text-red-500 ml-1">(+{summary.totalOverall - OVERALL_CAP_LIMIT})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-slate-300 text-sm md:text-base px-2">
                    {summary.coinsRemaining !== undefined ? (
                      <span>
                        🪙 {summary.coinsRemaining}<span className="hidden sm:inline">/{summary.team === 'Hawks' || summary.team === 'Nuggets' ? '115' : '100'}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
