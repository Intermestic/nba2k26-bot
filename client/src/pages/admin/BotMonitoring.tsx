import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Activity,
  Clock,
  TrendingUp,
  Database,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle
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
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function BotMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Query degradation status with auto-refresh
  const { data: degradationStatus, refetch: refetchDegradation } =
    trpc.botMonitoring.getDegradationStatus.useQuery(undefined, {
      refetchInterval: autoRefresh ? 5000 : false,
    });

  // Query queue stats with auto-refresh
  const { data: queueStats, refetch: refetchQueue } =
    trpc.botMonitoring.getQueueStats.useQuery(undefined, {
      refetchInterval: autoRefresh ? 5000 : false,
    });

  // Query recovery metrics
  const { data: recoveryMetrics } =
    trpc.botMonitoring.getRecoveryMetrics.useQuery(
      { period: "24h" },
      { refetchInterval: autoRefresh ? 10000 : false }
    );

  // Query queued transactions
  const { data: queuedTransactions } =
    trpc.botMonitoring.getQueuedTransactions.useQuery(
      { type: "all", limit: 20 },
      { refetchInterval: autoRefresh ? 10000 : false }
    );

  // Query degradation timeline
  const { data: timeline } =
    trpc.botMonitoring.getDegradationTimeline.useQuery(
      { limit: 10 },
      { refetchInterval: autoRefresh ? 10000 : false }
    );

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  // Format timestamp
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  // Prepare queue breakdown data for pie chart
  const queueBreakdown = queueStats
    ? [
        { name: "FA Transactions", value: queueStats.faTransactions, color: "#3b82f6" },
        { name: "Trade Approvals", value: queueStats.tradeApprovals, color: "#8b5cf6" },
      ]
    : [];

  // Prepare transaction status data for bar chart
  const transactionStatusData = queueStats
    ? [
        { name: "Queued", value: queueStats.queued, fill: "#f59e0b" },
        { name: "Processing", value: queueStats.processing, fill: "#3b82f6" },
        { name: "Completed", value: queueStats.completed, fill: "#10b981" },
        { name: "Failed", value: queueStats.failed, fill: "#ef4444" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bot Monitoring Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time degradation and recovery metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchDegradation();
              refetchQueue();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Degradation Status Alert */}
      {degradationStatus?.isActive && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Graceful Degradation Active</strong> - Database is unavailable. Transactions are being queued locally and will be processed automatically when the database recovers.
            <br />
            <span className="text-sm">
              Duration: {formatDuration(degradationStatus.durationMs)} | Queue Size: {degradationStatus.queueSize} transactions
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Degradation Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Degradation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {degradationStatus?.isActive ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="font-semibold text-yellow-600">Active</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-semibold text-green-600">Normal</span>
                </>
              )}
            </div>
            {degradationStatus?.isActive && (
              <p className="text-xs text-gray-500 mt-2">
                Duration: {formatDuration(degradationStatus.durationMs)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Queue Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Queued Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              FA: {queueStats?.faTransactions || 0} | Trades: {queueStats?.tradeApprovals || 0}
            </p>
          </CardContent>
        </Card>

        {/* Recovery Attempts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Recovery Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{degradationStatus?.recoveryAttemptCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Success Rate: {recoveryMetrics?.successRate || 0}%
            </p>
          </CardContent>
        </Card>

        {/* Failed Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Failed Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${queueStats?.failed ? "text-red-600" : "text-green-600"}`}>
              {queueStats?.failed || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Processing: {queueStats?.processing || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Status Distribution</CardTitle>
            <CardDescription>Current queue breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionStatusData.length > 0 && transactionStatusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No transactions in queue
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Type Breakdown</CardTitle>
            <CardDescription>FA vs Trade transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {queueBreakdown.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={queueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {queueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No transactions in queue
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Queued Transactions</TabsTrigger>
          <TabsTrigger value="timeline">Degradation Timeline</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Metrics</TabsTrigger>
        </TabsList>

        {/* Queued Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Queued Transactions</CardTitle>
              <CardDescription>
                {queuedTransactions?.total || 0} transactions waiting for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queuedTransactions && queuedTransactions.items.length > 0 ? (
                <div className="space-y-3">
                  {queuedTransactions.items.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                tx.type === "fa-transaction" ? "default" : "secondary"
                              }
                            >
                              {tx.type === "fa-transaction" ? "FA Move" : "Trade"}
                            </Badge>
                            <Badge
                              variant={
                                tx.status === "queued"
                                  ? "outline"
                                  : tx.status === "processing"
                                    ? "secondary"
                                    : tx.status === "completed"
                                      ? "default"
                                      : "destructive"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </div>

                          {/* FA Transaction Details */}
                          {tx.type === "fa-transaction" && (
                            <p className="text-sm font-medium">
                              {(tx as any).team}: Drop {(tx as any).dropPlayer}, Sign{" "}
                              {(tx as any).signPlayer} ({(tx as any).bidAmount} coins)
                            </p>
                          )}

                          {/* Trade Details */}
                          {tx.type === "trade-approval" && (
                            <p className="text-sm font-medium">
                              {(tx as any).team1} ↔ {(tx as any).team2}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span>{formatTime(tx.timestamp)}</span>
                            <span>
                              Retries: {tx.retries}/{tx.maxRetries}
                            </span>
                            {tx.lastError && (
                              <span className="text-red-600 font-medium">
                                Error: {tx.lastError.substring(0, 50)}...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Icon */}
                        <div className="ml-4">
                          {tx.status === "completed" && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {tx.status === "failed" && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {tx.status === "processing" && (
                            <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                          )}
                          {tx.status === "queued" && (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No transactions in queue</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Degradation Timeline</CardTitle>
              <CardDescription>Recent degradation and recovery events</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline && timeline.events.length > 0 ? (
                <div className="space-y-4">
                  {timeline.events.map((event, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            event.type === "degradation_started"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        />
                        {idx < timeline.events.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="font-medium">
                          {event.type === "degradation_started"
                            ? "Degradation Started"
                            : "Recovery Attempted"}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatTime(event.timestamp)}
                        </p>
                        <div className="text-sm mt-2 space-y-1">
                          {Object.entries(event.details).map(([key, value]) => (
                            <div key={key} className="text-gray-600">
                              <span className="font-medium capitalize">{key}:</span>{" "}
                              {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No degradation events recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Metrics Tab */}
        <TabsContent value="recovery">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Metrics (24h)</CardTitle>
              <CardDescription>Recovery performance and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {recoveryMetrics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Recovery Attempts</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {recoveryMetrics.recoveryAttempts}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {recoveryMetrics.successRate}%
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Recovery Time</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatDuration(recoveryMetrics.averageRecoveryTimeMs)}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Queue</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {recoveryMetrics.currentQueueSize}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {recoveryMetrics.completedTransactions}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {recoveryMetrics.failedTransactions}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Processing</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {recoveryMetrics.processingTransactions}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Loading recovery metrics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
