// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function HealthAlerts() {
  const [enabled, setEnabled] = useState(true);
  const [alertChannelId, setAlertChannelId] = useState("");
  const [offlineAlertEnabled, setOfflineAlertEnabled] = useState(true);
  const [errorAlertEnabled, setErrorAlertEnabled] = useState(true);
  const [errorThreshold, setErrorThreshold] = useState(5);
  const [checkIntervalSeconds, setCheckIntervalSeconds] = useState(60);

  // Fetch current configuration
  const { data: config, refetch: refetchConfig } = trpc.healthAlerts.getConfig.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
    onSuccess: (data) => {
      if (data) {
        setEnabled(data.enabled === 1);
        setAlertChannelId(data.alertChannelId);
        setOfflineAlertEnabled(data.offlineAlertEnabled === 1);
        setErrorAlertEnabled(data.errorAlertEnabled === 1);
        setErrorThreshold(data.errorThreshold);
        setCheckIntervalSeconds(data.checkIntervalSeconds);
      }
    },
  });

  // Fetch alert history
  const { data: history, refetch: refetchHistory } = trpc.healthAlerts.getHistory.useQuery({
    limit: 50,
  });

  // Fetch current bot status
  const { data: botStatus } = trpc.healthAlerts.getBotStatus.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update configuration mutation
  const updateConfig = trpc.healthAlerts.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Alert configuration updated successfully");
      refetchConfig();
    },
    onError: (error) => {
      toast.error("Failed to update configuration", {
        description: error.message,
      });
    },
  });

  // Test alert mutation
  const testAlert = trpc.healthAlerts.testAlert.useMutation({
    onSuccess: () => {
      toast.success("Test alert sent successfully");
      refetchHistory();
    },
    onError: (error) => {
      toast.error("Failed to send test alert", {
        description: error.message,
      });
    },
  });

  const handleSaveConfig = () => {
    if (!alertChannelId.trim()) {
      toast.error("Please enter a Discord channel ID");
      return;
    }

    updateConfig.mutate({
      enabled,
      alertChannelId: alertChannelId.trim(),
      offlineAlertEnabled,
      errorAlertEnabled,
      errorThreshold,
      checkIntervalSeconds,
    });
  };

  const handleTestAlert = (alertType: "offline" | "error" | "recovery") => {
    if (!config) {
      toast.error("Please configure alerts first");
      return;
    }

    testAlert.mutate({ alertType });
  };

  const formatUptime = (ms: number | null) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bot Health Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Monitor bot health and receive Discord alerts for issues
          </p>
        </div>
        {config?.isMonitoring ? (
          <Badge className="bg-green-600 text-white">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Monitoring Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <BellOff className="w-3 h-3 mr-1" />
            Monitoring Inactive
          </Badge>
        )}
      </div>

      {/* Current Bot Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Current Bot Status
          </CardTitle>
          <CardDescription>Real-time bot health information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="flex items-center gap-2 mt-1">
                {botStatus?.isOnline ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="font-medium mt-1">{formatUptime(botStatus?.uptime || null)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Latency</div>
              <div className="font-medium mt-1">
                {botStatus?.latency !== null && botStatus?.latency !== undefined
                  ? `${botStatus.latency}ms`
                  : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Check</div>
              <div className="font-medium mt-1">
                {config?.lastHealthCheck
                  ? new Date(config.lastHealthCheck).toLocaleTimeString()
                  : "Never"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Configuration</CardTitle>
          <CardDescription>Configure health monitoring and Discord alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base font-medium">
                Enable Health Monitoring
              </Label>
              <div className="text-sm text-muted-foreground">
                Automatically monitor bot health and send alerts
              </div>
            </div>
            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Alert Channel ID */}
          <div className="space-y-2">
            <Label htmlFor="channelId">Discord Alert Channel ID</Label>
            <Input
              id="channelId"
              value={alertChannelId}
              onChange={(e) => setAlertChannelId(e.target.value)}
              placeholder="1234567890123456789"
            />
            <p className="text-xs text-muted-foreground">
              Right-click a Discord channel and select "Copy Channel ID" (Developer Mode must be
              enabled)
            </p>
          </div>

          {/* Check Interval */}
          <div className="space-y-2">
            <Label htmlFor="interval">Health Check Interval (seconds)</Label>
            <Input
              id="interval"
              type="number"
              min={30}
              max={3600}
              value={checkIntervalSeconds}
              onChange={(e) => setCheckIntervalSeconds(parseInt(e.target.value) || 60)}
            />
            <p className="text-xs text-muted-foreground">
              How often to check bot health (30-3600 seconds)
            </p>
          </div>

          {/* Alert Types */}
          <div className="space-y-4">
            <Label className="text-base">Alert Types</Label>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="offlineAlert" className="font-medium">
                  Offline Alerts
                </Label>
                <div className="text-sm text-muted-foreground">
                  Alert when bot goes offline or becomes unreachable
                </div>
              </div>
              <Switch
                id="offlineAlert"
                checked={offlineAlertEnabled}
                onCheckedChange={setOfflineAlertEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="errorAlert" className="font-medium">
                    Error Threshold Alerts
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Alert when consecutive errors exceed threshold
                  </div>
                </div>
                <Switch
                  id="errorAlert"
                  checked={errorAlertEnabled}
                  onCheckedChange={setErrorAlertEnabled}
                />
              </div>

              {errorAlertEnabled && (
                <div className="ml-4 space-y-2">
                  <Label htmlFor="errorThreshold">Error Threshold</Label>
                  <Input
                    id="errorThreshold"
                    type="number"
                    min={1}
                    max={100}
                    value={errorThreshold}
                    onChange={(e) => setErrorThreshold(parseInt(e.target.value) || 5)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of consecutive errors before sending alert (1-100)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveConfig}
            disabled={updateConfig.isPending}
            className="w-full"
          >
            {updateConfig.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Test Alerts</CardTitle>
          <CardDescription>Send test alerts to verify configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleTestAlert("offline")}
              disabled={testAlert.isPending || !config}
            >
              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
              Test Offline Alert
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTestAlert("error")}
              disabled={testAlert.isPending || !config}
            >
              <XCircle className="w-4 h-4 mr-2 text-orange-600" />
              Test Error Alert
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTestAlert("recovery")}
              disabled={testAlert.isPending || !config}
            >
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Test Recovery Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alert History
          </CardTitle>
          <CardDescription>Recent health alerts sent to Discord</CardDescription>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resolved At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          entry.alertType === "offline"
                            ? "border-red-600 text-red-600"
                            : entry.alertType === "error"
                            ? "border-orange-600 text-orange-600"
                            : "border-green-600 text-green-600"
                        }
                      >
                        {entry.alertType}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.message}</TableCell>
                    <TableCell>
                      {entry.resolved ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Resolved
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          Active
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.resolvedAt ? (
                        new Date(entry.resolvedAt).toLocaleString()
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No alert history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
