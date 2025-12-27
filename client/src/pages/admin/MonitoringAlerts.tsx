import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, 
  TestTube,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MonitoringAlerts() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState<"immediate" | "5min" | "15min" | "1hr">("immediate");

  // Query current config
  const { data: config, isLoading, refetch } = trpc.monitoringAlerts.getConfig.useQuery({
    alertType: "bot_offline",
  });

  // Update config when loaded
  useState(() => {
    if (config) {
      setWebhookUrl(config.webhookUrl || "");
      setIsEnabled(config.isEnabled || false);
      setAlertFrequency(config.alertFrequency as any || "immediate");
    }
  });

  // Mutations
  const updateConfigMutation = trpc.monitoringAlerts.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Alert configuration saved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });

  const testWebhookMutation = trpc.monitoringAlerts.testWebhook.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Test failed: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateConfigMutation.mutate({
      alertType: "bot_offline",
      isEnabled,
      webhookUrl: webhookUrl.trim() || undefined,
      alertFrequency,
    });
  };

  const handleTest = () => {
    if (!webhookUrl.trim()) {
      toast.error("Please enter a webhook URL first");
      return;
    }

    testWebhookMutation.mutate({
      webhookUrl: webhookUrl.trim(),
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Monitoring Alerts</h1>
        <p className="text-muted-foreground">
          Configure Discord webhook notifications for bot status changes
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> When the bot goes offline, a notification will be sent to your Discord channel via webhook.
          You can configure the frequency to avoid spam during maintenance or temporary issues.
        </AlertDescription>
      </Alert>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Bot Offline Alerts
          </CardTitle>
          <CardDescription>
            Get notified when the Discord bot goes offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading configuration...</p>
            </div>
          ) : (
            <>
              {/* Enable/Disable Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-alerts" className="text-base">
                    Enable Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on/off bot offline notifications
                  </p>
                </div>
                <Switch
                  id="enable-alerts"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Discord Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  disabled={!isEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Create a webhook in your Discord channel settings → Integrations → Webhooks
                </p>
              </div>

              {/* Alert Frequency */}
              <div className="space-y-2">
                <Label htmlFor="alert-frequency">Alert Frequency</Label>
                <Select
                  value={alertFrequency}
                  onValueChange={(v: any) => setAlertFrequency(v)}
                  disabled={!isEnabled}
                >
                  <SelectTrigger id="alert-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (every check)</SelectItem>
                    <SelectItem value="5min">Every 5 minutes</SelectItem>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="1hr">Every hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Throttle alerts to avoid spam during extended downtime
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateConfigMutation.isPending}
                  className="flex-1"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleTest}
                  variant="outline"
                  disabled={!webhookUrl.trim() || testWebhookMutation.isPending}
                >
                  {testWebhookMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Webhook
                    </>
                  )}
                </Button>
              </div>

              {/* Last Triggered */}
              {config?.lastTriggered && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Last Alert Sent:</strong>{" "}
                    {new Date(config.lastTriggered).toLocaleString()}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium mb-1">Create a Discord Webhook</p>
                <p className="text-muted-foreground">
                  Go to your Discord channel → Settings → Integrations → Webhooks → New Webhook
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium mb-1">Copy the Webhook URL</p>
                <p className="text-muted-foreground">
                  Click "Copy Webhook URL" and paste it in the field above
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium mb-1">Test and Save</p>
                <p className="text-muted-foreground">
                  Use the "Test Webhook" button to verify it works, then save your configuration
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <p className="font-medium mb-1">Enable Alerts</p>
                <p className="text-muted-foreground">
                  Turn on the "Enable Alerts" switch to start receiving notifications
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
