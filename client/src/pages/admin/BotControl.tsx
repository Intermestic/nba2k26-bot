// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Power, RefreshCw, PlayCircle, StopCircle, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BotControl() {
  const [isRestarting, setIsRestarting] = useState(false);
  
  // Query bot status
  const { data: status, isLoading, refetch } = trpc.botControl.getStatus.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Mutations
  const startMutation = trpc.botControl.start.useMutation({
    onSuccess: () => {
      toast.success("Bot started successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to start bot: ${error.message}`);
    },
  });

  const stopMutation = trpc.botControl.stop.useMutation({
    onSuccess: () => {
      toast.success("Bot stopped successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to stop bot: ${error.message}`);
    },
  });

  const restartMutation = trpc.botControl.restart.useMutation({
    onSuccess: () => {
      toast.success("Bot restarted successfully");
      setIsRestarting(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to restart bot: ${error.message}`);
      setIsRestarting(false);
    },
  });

  const handleStart = () => {
    startMutation.mutate();
  };

  const handleStop = () => {
    stopMutation.mutate();
  };

  const handleRestart = () => {
    setIsRestarting(true);
    restartMutation.mutate();
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Discord Bot Control</h1>
        <p className="text-muted-foreground">
          Manage your Discord bot process - start, stop, and restart without assistance
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Bot Status
              </CardTitle>
              <CardDescription>Real-time bot connection status</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading bot status...
            </div>
          ) : status ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={status.isOnline ? "default" : "destructive"}
                  className={status.isOnline ? "bg-green-500" : ""}
                >
                  {status.isOnline ? "🟢 Online" : "🔴 Offline"}
                </Badge>
              </div>

              {/* Bot Info */}
              {status.isOnline && status.botUsername && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Bot:</span>
                  <span className="text-sm text-muted-foreground">{status.botUsername}</span>
                </div>
              )}

              {/* Uptime */}
              {status.isOnline && status.uptime !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Uptime:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatUptime(status.uptime)}
                  </span>
                </div>
              )}

              {/* Process ID */}
              {status.processId && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Process ID:</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {status.processId}
                  </span>
                </div>
              )}

              {/* Last Started */}
              {status.lastStarted && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Last Started:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(status.lastStarted).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Unable to retrieve bot status
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-5 h-5" />
            Bot Controls
          </CardTitle>
          <CardDescription>
            Start, stop, or restart the Discord bot process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleStart}
              disabled={status?.isOnline || startMutation.isPending}
              className="flex-1 min-w-[150px]"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {startMutation.isPending ? "Starting..." : "Start Bot"}
            </Button>

            <Button
              onClick={handleStop}
              disabled={!status?.isOnline || stopMutation.isPending}
              variant="destructive"
              className="flex-1 min-w-[150px]"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              {stopMutation.isPending ? "Stopping..." : "Stop Bot"}
            </Button>

            <Button
              onClick={handleRestart}
              disabled={!status?.isOnline || isRestarting || restartMutation.isPending}
              variant="outline"
              className="flex-1 min-w-[150px]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRestarting ? 'animate-spin' : ''}`} />
              {isRestarting || restartMutation.isPending ? "Restarting..." : "Restart Bot"}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">ℹ️ How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Start:</strong> Launches the Discord bot process if it's not running</li>
              <li>• <strong>Stop:</strong> Gracefully shuts down the bot process</li>
              <li>• <strong>Restart:</strong> Stops and starts the bot (useful when bot is stuck or offline)</li>
              <li>• Status auto-refreshes every 5 seconds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
