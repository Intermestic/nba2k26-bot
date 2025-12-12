// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Clock, RefreshCw, CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react";
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

export default function ScheduledRestarts() {
  const [enabled, setEnabled] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 3 * * *");
  const [timezone, setTimezone] = useState("America/New_York");
  const [customCron, setCustomCron] = useState("");

  // Fetch current schedule
  const { data: schedule, refetch: refetchSchedule } = trpc.scheduledRestarts.getSchedule.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
    onSuccess: (data) => {
      if (data) {
        setEnabled(data.enabled === 1);
        setCronExpression(data.cronExpression);
        setTimezone(data.timezone);
      }
    },
  });

  // Fetch restart history
  const { data: history, refetch: refetchHistory } = trpc.scheduledRestarts.getHistory.useQuery({ limit: 20 });

  // Update schedule mutation
  const updateSchedule = trpc.scheduledRestarts.updateSchedule.useMutation({
    onSuccess: (data) => {
      toast.success("Schedule updated successfully", {
        description: data.humanReadable,
      });
      refetchSchedule();
    },
    onError: (error) => {
      toast.error("Failed to update schedule", {
        description: error.message,
      });
    },
  });

  // Test restart mutation
  const testRestart = trpc.scheduledRestarts.testRestart.useMutation({
    onSuccess: () => {
      toast.success("Bot restarted successfully");
      refetchSchedule();
      refetchHistory();
    },
    onError: (error) => {
      toast.error("Failed to restart bot", {
        description: error.message,
      });
    },
  });

  const handleSaveSchedule = () => {
    const finalCron = customCron || cronExpression;
    updateSchedule.mutate({
      enabled,
      cronExpression: finalCron,
      timezone,
    });
  };

  const handleTestRestart = () => {
    if (confirm("Are you sure you want to restart the bot now? This will disconnect all active connections.")) {
      testRestart.mutate();
    }
  };

  const presetSchedules = [
    { label: "Daily at 3:00 AM", value: "0 3 * * *" },
    { label: "Daily at 4:00 AM", value: "0 4 * * *" },
    { label: "Daily at 5:00 AM", value: "0 5 * * *" },
    { label: "Every 12 hours", value: "0 */12 * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Bot Restarts</h1>
          <p className="text-muted-foreground mt-1">
            Configure automatic bot restarts to maintain stability
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestRestart}
          disabled={testRestart.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${testRestart.isPending ? "animate-spin" : ""}`} />
          Test Restart Now
        </Button>
      </div>

      {/* Current Schedule Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Current Schedule
          </CardTitle>
          <CardDescription>
            {schedule?.isActive ? (
              <span className="text-green-600 font-medium">Active and running</span>
            ) : (
              <span className="text-muted-foreground">No active schedule</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Schedule</div>
                <div className="font-medium">{schedule.humanReadable}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Next Execution</div>
                <div className="font-medium">
                  {schedule.nextExecution
                    ? new Date(schedule.nextExecution).toLocaleString()
                    : "Not scheduled"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Executed</div>
                <div className="font-medium">
                  {schedule.lastExecuted
                    ? new Date(schedule.lastExecuted).toLocaleString()
                    : "Never"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Schedule</CardTitle>
          <CardDescription>Set up automatic bot restarts at specific times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base font-medium">
                Enable Scheduled Restarts
              </Label>
              <div className="text-sm text-muted-foreground">
                Automatically restart the bot at the scheduled time
              </div>
            </div>
            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Schedule Preset */}
          <div className="space-y-2">
            <Label>Schedule Preset</Label>
            <Select
              value={cronExpression}
              onValueChange={(value) => {
                if (value === "custom") {
                  setCronExpression("");
                } else {
                  setCronExpression(value);
                  setCustomCron("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {presetSchedules.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Cron Expression */}
          {(!cronExpression || cronExpression === "custom") && (
            <div className="space-y-2">
              <Label htmlFor="customCron">Custom Cron Expression</Label>
              <Input
                id="customCron"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="0 3 * * * (minute hour day month weekday)"
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day month weekday. Example: "0 3 * * *" = Daily at 3:00 AM
              </p>
            </div>
          )}

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveSchedule}
            disabled={updateSchedule.isPending}
            className="w-full"
          >
            {updateSchedule.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restart History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Restart History
          </CardTitle>
          <CardDescription>Recent bot restart events</CardDescription>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{entry.restartType}</span>
                    </TableCell>
                    <TableCell className="capitalize">{entry.triggeredBy}</TableCell>
                    <TableCell>
                      {entry.success ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Success
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.errorMessage ? (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="w-3 h-3" />
                          {entry.errorMessage}
                        </div>
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
              No restart history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
