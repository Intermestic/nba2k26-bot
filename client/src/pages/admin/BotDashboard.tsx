import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Zap,
  Server,
  CheckCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

type Period = "24h" | "7d" | "30d";

export default function BotDashboard() {
  const [period, setPeriod] = useState<Period>("24h");

  // Query bot status
  const { data: status } = trpc.botControl.getStatus.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Query uptime metrics
  const { data: currentUptime } = trpc.botMetrics.getUptime.useQuery(
    { period: "current" },
    { refetchInterval: 10000 }
  );
  const { data: periodUptime } = trpc.botMetrics.getUptime.useQuery(
    { period },
    { refetchInterval: 30000 }
  );

  // Query command stats
  const { data: commandStats } = trpc.botMetrics.getCommandStats.useQuery(
    { period, limit: 10 },
    { refetchInterval: 30000 }
  );

  // Query command usage over time
  const { data: commandUsageOverTime } = trpc.botMetrics.getCommandUsageOverTime.useQuery(
    { period },
    { refetchInterval: 30000 }
  );

  // Query health metrics
  const { data: healthMetrics } = trpc.botMetrics.getHealthMetrics.useQuery(
    { period },
    { refetchInterval: 30000 }
  );

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getHealthStatus = () => {
    if (!status) return { status: "unknown", color: "gray", icon: AlertTriangle };
    
    if (status.isOnline) {
      return { 
        status: "healthy", 
        color: "green", 
        icon: CheckCircle,
        message: "Bot is online and healthy"
      };
    }
    
    return { 
      status: "offline", 
      color: "red", 
      icon: AlertTriangle,
      message: "Bot is offline"
    };
  };

  const health = getHealthStatus();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bot Status Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor bot health, uptime, command usage, and performance metrics
        </p>
      </div>

      {/* Health Alert */}
      {status && !status.isOnline && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Bot is offline!</strong> {health.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Period Selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="mb-6">
        <TabsList>
          <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Bot Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              Bot Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge
                variant={status?.isOnline ? "default" : "destructive"}
                className={status?.isOnline ? "bg-green-500" : ""}
              >
                {status?.isOnline ? "🟢 Online" : "🔴 Offline"}
              </Badge>
            </div>
            {status?.botUsername && (
              <p className="text-xs text-muted-foreground mt-2">
                {status.botUsername}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current Uptime */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentUptime ? formatUptime(currentUptime.uptime) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Session uptime
            </p>
          </CardContent>
        </Card>

        {/* Period Uptime */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periodUptime ? formatUptime(periodUptime.uptime) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {period === "24h" ? "Last 24 hours" : period === "7d" ? "Last 7 days" : "Last 30 days"}
            </p>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthMetrics ? `${healthMetrics.errorRate}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {healthMetrics?.errorCount || 0} errors in period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Command Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Commands
            </CardTitle>
            <CardDescription>Most frequently used commands</CardDescription>
          </CardHeader>
          <CardContent>
            {commandStats && commandStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commandStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="command" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No command data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Command Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Command Activity
            </CardTitle>
            <CardDescription>Command usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            {commandUsageOverTime && commandUsageOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={commandUsageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Commands"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No activity data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      {healthMetrics && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Health Metrics
            </CardTitle>
            <CardDescription>Bot performance and reliability indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Error Count
                </div>
                <div className="text-2xl font-bold">{healthMetrics.errorCount}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Error Rate
                </div>
                <div className="text-2xl font-bold">{healthMetrics.errorRate}%</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Avg Response Time
                </div>
                <div className="text-2xl font-bold">
                  {healthMetrics.avgResponseTime > 0 
                    ? `${healthMetrics.avgResponseTime}ms` 
                    : "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
