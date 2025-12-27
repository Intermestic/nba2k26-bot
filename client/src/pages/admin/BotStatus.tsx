import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Power, 
  RefreshCw, 
  PlayCircle, 
  StopCircle, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BotStatus() {
  const [isRestarting, setIsRestarting] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  
  // Query bot status with frequent updates
  const { data: status, isLoading, refetch } = trpc.botControl.getStatus.useQuery(undefined, {
    refetchInterval: 3000, // Check every 3 seconds for real-time monitoring
  });

  // Update last health check timestamp
  useEffect(() => {
    if (status) {
      setLastHealthCheck(new Date());
    }
  }, [status]);

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
      // Refetch after a delay to allow bot to fully initialize
      setTimeout(() => refetch(), 2000);
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

  // Determine bot health status
  const getHealthStatus = () => {
    if (!status) return { status: "unknown", color: "gray", icon: AlertTriangle };
    
    if (status.isOnline) {
      return { 
        status: "healthy", 
        color: "green", 
        icon: CheckCircle,
        message: "Bot is online and connected to Discord"
      };
    }
    
    if (status.processId) {
      return { 
        status: "degraded", 
        color: "yellow", 
        icon: AlertTriangle,
        message: "Bot process is running but Discord client is offline"
      };
    }
    
    return { 
      status: "offline", 
      color: "red", 
      icon: WifiOff,
      message: "Bot is completely offline"
    };
  };

  const health = getHealthStatus();

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Discord Bot Status Monitor</h1>
        <p className="text-muted-foreground">
          Real-time monitoring and control for your Discord bot
        </p>
      </div>

      {/* Health Alert */}
      {status && !status.isOnline && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Bot is offline!</strong> {health.message}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={handleRestart}
              disabled={isRestarting || restartMutation.isPending}
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isRestarting ? 'animate-spin' : ''}`} />
              Quick Restart
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Health Status
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Checking status...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Health Status Badge */}
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <health.icon className={`w-8 h-8 text-${health.color}-500`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={status?.isOnline ? "default" : "destructive"}
                        className={status?.isOnline ? "bg-green-500" : ""}
                      >
                        {status?.isOnline ? "🟢 Online" : "🔴 Offline"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{health.message}</p>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {status?.isOnline ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Discord Connection</p>
                    <p className="text-xs text-muted-foreground">
                      {status?.isOnline ? "Connected" : "Disconnected"}
                    </p>
                  </div>
                </div>

                {/* Last Check */}
                {lastHealthCheck && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Last checked: {lastHealthCheck.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bot Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Information</CardTitle>
            <CardDescription>Current bot process details</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : status ? (
              <div className="space-y-3">
                {/* Bot Username */}
                {status.botUsername && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Bot Username</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {status.botUsername}
                    </span>
                  </div>
                )}

                {/* Process ID */}
                {status.processId && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Process ID</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {status.processId}
                    </span>
                  </div>
                )}

                {/* Uptime */}
                {status.uptime !== null && status.uptime !== undefined && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-muted-foreground">
                      {formatUptime(status.uptime)}
                    </span>
                  </div>
                )}

                {/* Last Started */}
                {status.lastStarted && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Last Started</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(status.lastStarted).toLocaleString()}
                    </span>
                  </div>
                )}

                {!status.botUsername && !status.processId && (
                  <div className="text-center py-8 text-muted-foreground">
                    No bot process detected
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Unable to retrieve bot information
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-5 h-5" />
            Bot Controls
          </CardTitle>
          <CardDescription>
            Manage the Discord bot process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleStart}
              disabled={status?.isOnline || startMutation.isPending}
              className="flex-1 min-w-[150px]"
              size="lg"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {startMutation.isPending ? "Starting..." : "Start Bot"}
            </Button>

            <Button
              onClick={handleStop}
              disabled={!status?.processId || stopMutation.isPending}
              variant="destructive"
              className="flex-1 min-w-[150px]"
              size="lg"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              {stopMutation.isPending ? "Stopping..." : "Stop Bot"}
            </Button>

            <Button
              onClick={handleRestart}
              disabled={isRestarting || restartMutation.isPending}
              variant="outline"
              className="flex-1 min-w-[150px]"
              size="lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRestarting ? 'animate-spin' : ''}`} />
              {isRestarting || restartMutation.isPending ? "Restarting..." : "Restart Bot"}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Control Guide
            </h4>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <PlayCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Start:</strong> Launches the bot if it's not running
                </div>
              </div>
              <div className="flex gap-2">
                <StopCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Stop:</strong> Gracefully shuts down the bot
                </div>
              </div>
              <div className="flex gap-2">
                <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Restart:</strong> Stops and starts the bot (works even when offline - best for recovery)
                </div>
              </div>
              <div className="flex gap-2">
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  Status updates automatically every 3 seconds
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
