import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Clock, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function BotMonitoring() {
  const [timeRange, setTimeRange] = useState<number>(24); // hours
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch current status
  const { data: currentStatus, refetch: refetchStatus } = trpc.botMonitoring.getCurrentStatus.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Fetch metrics
  const { data: metrics, refetch: refetchMetrics } = trpc.botMonitoring.getMetrics.useQuery(
    { hours: timeRange },
    {
      refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
    }
  );

  // Fetch uptime stats
  const { data: uptimeStats, refetch: refetchStats } = trpc.botMonitoring.getUptimeStats.useQuery(
    { hours: timeRange },
    {
      refetchInterval: autoRefresh ? 60000 : false,
    }
  );

  // Fetch response time trends
  const { data: trends, refetch: refetchTrends } = trpc.botMonitoring.getResponseTimeTrends.useQuery(
    { hours: timeRange },
    {
      refetchInterval: autoRefresh ? 60000 : false,
    }
  );

  const handleRefresh = () => {
    refetchStatus();
    refetchMetrics();
    refetchStats();
    refetchTrends();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "unhealthy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-600">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-600">Degraded</Badge>;
      case "unhealthy":
        return <Badge className="bg-red-600">Unhealthy</Badge>;
      default:
        return <Badge className="bg-gray-600">Unknown</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Prepare chart data
  const responseTimeData = metrics?.map((m) => ({
    time: format(new Date(m.timestamp), "HH:mm"),
    health: m.healthResponseTime,
    web: m.webResponseTime || 0,
  }));

  const uptimeData = trends?.map((t) => ({
    hour: format(new Date(t.hour), "MMM dd HH:00"),
    uptime: t.uptimePercentage,
    errors: t.avgErrors,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bot Monitoring Dashboard</h1>
            <p className="text-slate-400">Real-time health metrics and performance trends</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-600/20 border-green-600" : ""}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Bot Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStatus ? (
                <div className="space-y-2">
                  {getStatusBadge(currentStatus.status)}
                  <p className="text-xs text-slate-500 mt-2">{currentStatus.message}</p>
                </div>
              ) : (
                <p className="text-slate-500">No data</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStatus ? (
                <div>
                  <p className="text-2xl font-bold">{formatUptime(currentStatus.uptime)}</p>
                  <p className="text-xs text-slate-500 mt-1">Current session</p>
                </div>
              ) : (
                <p className="text-slate-500">No data</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Server className="w-4 h-4" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStatus ? (
                <div>
                  <p className="text-2xl font-bold">{currentStatus.healthResponseTime}ms</p>
                  <p className="text-xs text-slate-500 mt-1">Health endpoint</p>
                </div>
              ) : (
                <p className="text-slate-500">No data</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStatus ? (
                <div>
                  <p className="text-2xl font-bold">{currentStatus.errors}</p>
                  <p className="text-xs text-slate-500 mt-1">Current count</p>
                </div>
              ) : (
                <p className="text-slate-500">No data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <Tabs value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
            <TabsList className="bg-slate-900">
              <TabsTrigger value="1">1 Hour</TabsTrigger>
              <TabsTrigger value="6">6 Hours</TabsTrigger>
              <TabsTrigger value="24">24 Hours</TabsTrigger>
              <TabsTrigger value="72">3 Days</TabsTrigger>
              <TabsTrigger value="168">7 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Statistics Cards */}
        {uptimeStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Uptime Percentage</CardTitle>
                <CardDescription>Last {timeRange} hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-500">{uptimeStats.uptimePercentage}%</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-slate-400">
                    Healthy: <span className="text-green-500">{uptimeStats.healthyChecks}</span>
                  </p>
                  <p className="text-slate-400">
                    Degraded: <span className="text-yellow-500">{uptimeStats.degradedChecks}</span>
                  </p>
                  <p className="text-slate-400">
                    Unhealthy: <span className="text-red-500">{uptimeStats.unhealthyChecks}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Avg Response Time</CardTitle>
                <CardDescription>Last {timeRange} hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">{uptimeStats.avgHealthResponseTime}ms</p>
                    <p className="text-sm text-slate-400">Health endpoint</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{uptimeStats.avgWebResponseTime}ms</p>
                    <p className="text-sm text-slate-400">Web server</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Error Rate</CardTitle>
                <CardDescription>Last {timeRange} hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{uptimeStats.avgErrors}</p>
                <p className="text-sm text-slate-400 mt-2">Average errors per check</p>
                <p className="text-xs text-slate-500 mt-4">Total checks: {uptimeStats.totalChecks}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-8">
          {/* Response Time Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Response Time Trends
              </CardTitle>
              <CardDescription>Health endpoint and web server response times</CardDescription>
            </CardHeader>
            <CardContent>
              {responseTimeData && responseTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" label={{ value: "ms", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="health" stroke="#10b981" name="Health Endpoint" strokeWidth={2} />
                    <Line type="monotone" dataKey="web" stroke="#3b82f6" name="Web Server" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-12">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Uptime Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Uptime Percentage by Hour
              </CardTitle>
              <CardDescription>Hourly uptime trends and error rates</CardDescription>
            </CardHeader>
            <CardContent>
              {uptimeData && uptimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={uptimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hour" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" label={{ value: "%", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="uptime" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Uptime %" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-12">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Dashboard auto-refreshes every 30 seconds when enabled</p>
          <p className="mt-1">Data is collected from periodic health checks logged to the database</p>
        </div>
      </div>
    </div>
  );
}
