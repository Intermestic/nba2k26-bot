import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, Send, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function DiscordIntegration() {
  const { user } = useAuth();
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(window.location.origin);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);

  // Load existing config
  const { data: config, refetch: refetchConfig } = trpc.discord.getConfig.useQuery();
  
  // Load bot status
  const { data: botStatus, refetch: refetchBotStatus } = trpc.discord.getBotStatus.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (config) {
      setChannelId(config.channelId || "");
      setMessageId(config.messageId || "");
      setWebsiteUrl(config.websiteUrl || window.location.origin);
      setAutoUpdateEnabled(config.autoUpdateEnabled === 1);
    }
  }, [config]);

  const saveConfigMutation = trpc.discord.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration saved!");
      refetchConfig();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const postMutation = trpc.discord.postCapStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Posted to Discord! ${data.teamCount} teams included.`);
      if (data.messageId) {
        setMessageId(data.messageId);
      }
    },
    onError: (error) => {
      toast.error(`Failed to post: ${error.message}`);
    },
  });

  const updateMutation = trpc.discord.updateCapStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated Discord message! ${data.teamCount} teams included.`);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSaveConfig = async () => {
    if (!channelId) {
      toast.error("Please enter a Discord channel ID");
      return;
    }

    saveConfigMutation.mutate({
      channelId,
      messageId,
      websiteUrl,
      autoUpdateEnabled,
    });
  };

  const handlePost = async () => {
    if (!channelId) {
      toast.error("Please enter a Discord channel ID");
      return;
    }

    if (!botStatus?.online) {
      toast.error("Bot is offline. Please check bot configuration.");
      return;
    }

    postMutation.mutate({ channelId, websiteUrl });
  };

  const handleUpdate = async () => {
    if (!channelId) {
      toast.error("Please enter a Discord channel ID");
      return;
    }
    if (!messageId) {
      toast.error("Please enter a message ID");
      return;
    }

    if (!botStatus?.online) {
      toast.error("Bot is offline. Please check bot configuration.");
      return;
    }

    updateMutation.mutate({ channelId, messageId, websiteUrl });
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Unauthorized</CardTitle>
              <CardDescription>Admin access required</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/players">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Discord Integration</h1>
            <p className="text-slate-400 mt-1">
              Post auto-updating team cap status to Discord using the bot
            </p>
          </div>
        </div>

        {/* Bot Status */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Bot Status</CardTitle>
            <CardDescription>Discord bot connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {botStatus?.online ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Bot Online</p>
                    <p className="text-sm text-slate-400">Connected as {botStatus.username}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-white font-medium">Bot Offline</p>
                    <p className="text-sm text-slate-400">Add DISCORD_BOT_TOKEN to secrets and restart server</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
            <CardDescription>Set up your Discord channel for cap status updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelId" className="text-white">Discord Channel ID</Label>
              <Input
                id="channelId"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="1234567890123456789"
                className="bg-slate-900/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">
                Right-click your Discord channel → Copy Channel ID (enable Developer Mode in Discord settings if needed)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="text-white">Website URL</Label>
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://your-site.manus.space"
                className="bg-slate-900/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">
                Team links in the Discord embed will point to this URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageId" className="text-white">Message ID (for updates)</Label>
              <Input
                id="messageId"
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                placeholder="1234567890123456789"
                className="bg-slate-900/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">
                Optional: Enter the message ID to update an existing message instead of posting a new one
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-600">
              <div>
                <Label htmlFor="autoUpdate" className="text-white font-medium">Auto-Update</Label>
                <p className="text-sm text-slate-400">
                  Automatically update Discord when team assignments change
                </p>
              </div>
              <Switch
                id="autoUpdate"
                checked={autoUpdateEnabled}
                onCheckedChange={setAutoUpdateEnabled}
              />
            </div>

            {autoUpdateEnabled && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <p className="text-sm text-green-400">
                  Auto-update is enabled. Discord will refresh automatically when players are assigned to teams (max once per minute).
                </p>
              </div>
            )}

            <Button 
              onClick={handleSaveConfig} 
              className="w-full"
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Actions</CardTitle>
            <CardDescription>Post or update the cap status message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handlePost}
                disabled={postMutation.isPending || !botStatus?.online}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {postMutation.isPending ? "Posting..." : "Post New Message"}
              </Button>

              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending || !messageId || !botStatus?.online}
                variant="secondary"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {updateMutation.isPending ? "Updating..." : "Update Existing"}
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <p className="text-sm text-blue-400">
                <strong>Tip:</strong> Use "Post New Message" first, then copy the message ID and use "Update Existing" to refresh the same message. This keeps your Discord channel clean!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-slate-800/50 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">What it looks like</CardTitle>
            <CardDescription>Preview of the Discord embed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">🏀 NBA 2K26 Team Cap Status</h3>
                <p className="text-slate-400 text-sm">
                  <strong>Cap Limit:</strong> 1098 Total Overall
                </p>
                <p className="text-slate-400 text-sm">
                  🔴 Over Cap: X | 🟡 At Cap: X | 🟢 Under Cap: X
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <p className="text-white font-medium">Bucks (14/14)</p>
                    <p className="text-sm text-red-400">🔴 1106 (+8)</p>
                    <a href="#" className="text-blue-400 text-sm hover:underline">View Team →</a>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-medium">Lakers (14/14)</p>
                    <p className="text-sm text-green-400">🟢 1095</p>
                    <a href="#" className="text-blue-400 text-sm hover:underline">View Team →</a>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
