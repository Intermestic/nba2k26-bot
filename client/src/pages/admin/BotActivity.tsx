// @ts-nocheck
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  Download,
  Calendar,
  Command,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function BotActivity() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [timelineGroupBy, setTimelineGroupBy] = useState<"hour" | "day">("day");

  // Fetch statistics
  const { data: commandStats, isLoading: loadingCommands } = trpc.botActivity.getCommandStats.useQuery({
    startDate,
    endDate,
  });

  const { data: errorStats, isLoading: loadingErrors } = trpc.botActivity.getErrorStats.useQuery({
    startDate,
    endDate,
    groupBy: timelineGroupBy,
  });

  const { data: timeline, isLoading: loadingTimeline } = trpc.botActivity.getActivityTimeline.useQuery({
    startDate,
    endDate,
    groupBy: timelineGroupBy,
  });

  const { data: summary, isLoading: loadingSummary } = trpc.botActivity.getSummaryStats.useQuery({
    startDate,
    endDate,
  });

  const { data: activeUsers, isLoading: loadingUsers } = trpc.botActivity.getMostActiveUsers.useQuery({
    startDate,
    endDate,
    limit: 10,
  });

  const exportStats = trpc.botActivity.exportStats.useMutation();

  const handleExportCSV = async () => {
    try {
      const result = await exportStats.mutateAsync({
        startDate,
        endDate,
      });

      // Download CSV file
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bot-activity-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${result.rowCount} records to CSV`);
    } catch (error) {
      toast.error("Failed to export statistics");
      console.error(error);
    }
  };

  // Calculate max values for bar chart scaling
  const maxCommandCount = useMemo(() => {
    if (!commandStats || commandStats.length === 0) return 0;
    return Math.max(...commandStats.map((s) => s.count));
  }, [commandStats]);

  const isLoading =
    loadingCommands || loadingErrors || loadingTimeline || loadingSummary || loadingUsers;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bot Activity Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Command usage statistics, error rates, and performance metrics
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={exportStats.isPending}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupBy">Timeline Grouping</Label>
              <Select
                value={timelineGroupBy}
                onValueChange={(value) => setTimelineGroupBy(value as "hour" | "day")}
              >
                <SelectTrigger id="groupBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hourly</SelectItem>
                  <SelectItem value="day">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All bot events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commands Executed</CardTitle>
            <Command className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCommands || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">User commands</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.errorRate ? summary.errorRate.toFixed(2) : "0.00"}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalErrors || 0} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.uniqueUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Command Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Command Usage Statistics
          </CardTitle>
          <CardDescription>Most frequently used commands</CardDescription>
        </CardHeader>
        <CardContent>
          {commandStats && commandStats.length > 0 ? (
            <div className="space-y-3">
              {commandStats.map((stat) => (
                <div key={stat.command} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.command}</span>
                    <span className="text-muted-foreground">{stat.count} uses</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(stat.count / maxCommandCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No command data available for this period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Commands and errors over time</CardDescription>
        </CardHeader>
        <CardContent>
          {timeline && timeline.length > 0 ? (
            <div className="space-y-4">
              <div className="h-64 flex items-end gap-2">
                {timeline.map((point, index) => {
                  const maxCount = Math.max(...timeline.map((p) => p.totalCount));
                  const height = maxCount > 0 ? (point.totalCount / maxCount) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col gap-0.5">
                        <div
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${(point.commandCount / maxCount) * 240}px` }}
                          title={`${point.commandCount} commands`}
                        />
                        {point.errorCount > 0 && (
                          <div
                            className="w-full bg-destructive"
                            style={{ height: `${(point.errorCount / maxCount) * 240}px` }}
                            title={`${point.errorCount} errors`}
                          />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate w-full text-center">
                        {new Date(point.period).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          ...(timelineGroupBy === "hour" && { hour: "numeric" }),
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded" />
                  <span>Commands</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded" />
                  <span>Errors</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No timeline data available for this period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error Rate Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Rate Over Time
          </CardTitle>
          <CardDescription>Percentage of errors per time period</CardDescription>
        </CardHeader>
        <CardContent>
          {errorStats && errorStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Total Events</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead className="text-right">Error Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{stat.period}</TableCell>
                    <TableCell className="text-right">{stat.totalCount}</TableCell>
                    <TableCell className="text-right">{stat.errorCount}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={stat.errorRate > 10 ? "destructive" : "secondary"}
                        className={stat.errorRate > 5 && stat.errorRate <= 10 ? "bg-orange-500" : ""}
                      >
                        {stat.errorRate.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No error data available for this period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Most Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Most Active Users
          </CardTitle>
          <CardDescription>Top users by command usage</CardDescription>
        </CardHeader>
        <CardContent>
          {activeUsers && activeUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Commands</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeUsers.map((user, index) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-bold">#{index + 1}</TableCell>
                    <TableCell>{user.username || "Unknown"}</TableCell>
                    <TableCell className="font-mono text-sm">{user.userId}</TableCell>
                    <TableCell className="text-right font-semibold">{user.commandCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No user activity data available for this period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
