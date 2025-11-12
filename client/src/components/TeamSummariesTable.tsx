import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamLogoBadge } from "./TeamLogoBadge";
import { ArrowUpDown } from "lucide-react";

interface TeamSummary {
  team: string;
  playerCount: number;
  totalOverall: number;
}

interface TeamSummariesTableProps {
  summaries: TeamSummary[];
  onTeamClick?: (team: string) => void;
}

const OVERALL_CAP_LIMIT = 1098;

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
                    Players
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-300 cursor-pointer hover:text-white text-center"
                  onClick={() => handleSort("overall")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Total Overall
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-300 text-center">Status</TableHead>
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
                    <div className="flex items-center gap-3">
                      <TeamLogoBadge team={summary.team} size="sm" />
                      <span className="text-white">{summary.team}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-slate-300">
                    {summary.playerCount}/14
                  </TableCell>
                  <TableCell className={`text-center font-semibold ${getCapStatusColor(summary.totalOverall)}`}>
                    {summary.totalOverall}
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-400">
                    {summary.totalOverall < OVERALL_CAP_LIMIT && "Under Cap"}
                    {summary.totalOverall === OVERALL_CAP_LIMIT && "At Cap"}
                    {summary.totalOverall > OVERALL_CAP_LIMIT && "Over Cap"}
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
