import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, Send, RefreshCw, ExternalLink } from "lucide-react";

export default function DiscordIntegration() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [messageId, setMessageId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(window.location.origin);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");

  // Load existing config
  const { data: config, refetch: refetchConfig } = trpc.discord.getConfig.useQuery();

  useEffect(() => {
    if (config) {
      setWebhookUrl(config.webhookUrl || "");
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

  const postTeamMutation = trpc.discord.postTeamCapStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Posted ${data.teamName} to Discord! ${data.playerCount} players, ${data.totalOverall} total overall.`);
    },
    onError: (error) => {
      toast.error(`Failed to post team: ${error.message}`);
    },
  });

  // Get all teams for dropdown
  const { data: players } = trpc.player.list.useQuery({});
  const teams = Array.from(new Set(players?.filter((p: any) => p.team).map((p: any) => p.team!))).sort();

  const handlePost = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a Discord webhook URL");
      return;
    }

    postMutation.mutate({ webhookUrl, websiteUrl });
  };

  const handleUpdate = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a Discord webhook URL");
      return;
    }
    if (!messageId) {
      toast.error("Please enter a message ID");
      return;
    }

    updateMutation.mutate({ webhookUrl, messageId, websiteUrl });
  };

  const handlePostTeam = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a Discord webhook URL");
      return;
    }
    if (!selectedTeam) {
      toast.error("Please select a team");
      return;
    }

    postTeamMutation.mutate({ webhookUrl, teamName: selectedTeam, websiteUrl });
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
              Post auto-updating team cap status to Discord
            </p>
          </div>
        </div>

        {/* Setup Instructions */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Setup Instructions</CardTitle>
            <CardDescription>How to create a Discord webhook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">
                1
              </span>
              <p>Go to your Discord server settings → Integrations → Webhooks</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">
                2
              </span>
              <p>Click "New Webhook" and give it a name (e.g., "Cap Status Bot")</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">
                3
              </span>
              <p>Copy the webhook URL and paste it below</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">
                4
              </span>
              <p>
                After posting, right-click the message in Discord → Copy Message ID (enable
                Developer Mode in Discord settings if needed)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
            <CardDescription>Set up your Discord webhook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl" className="text-slate-300">
                Discord Webhook URL
              </Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">
                Keep this URL secret! Anyone with this URL can post to your Discord channel.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="text-slate-300">
                Website URL
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://your-site.manus.space"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">
                Team links in the Discord embed will point to this URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageId" className="text-slate-300">
                Message ID (for updates)
              </Label>
              <Input
                id="messageId"
                type="text"
                placeholder="1234567890123456789"
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">
                Optional: Enter the message ID to update an existing message instead of posting a
                new one
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoUpdate" className="text-slate-300">
                    Auto-Update
                  </Label>
                  <p className="text-xs text-slate-400">
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
                <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <p className="text-xs text-green-200">
                    ✓ Auto-update is enabled. Discord will refresh automatically when players are assigned to teams (max once per minute).
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => saveConfigMutation.mutate({ webhookUrl, messageId, websiteUrl, autoUpdateEnabled })}
              disabled={saveConfigMutation.isPending || !webhookUrl}
              className="w-full"
              variant="default"
            >
              {saveConfigMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* FA Bot Configuration */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">FA Transaction Bot</CardTitle>
            <CardDescription>Auto-monitor Discord channel for free agent signings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
              <p className="text-sm text-green-200">
                <strong>How it works:</strong> The bot monitors your FA channel and detects player signings. When it finds transactions, it posts a confirmation message with buttons. Click "Confirm" to auto-update rosters.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-white">Discord Bot Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="Your Discord bot token"
                className="bg-slate-900 border-slate-700 text-white"
                disabled
              />
              <p className="text-xs text-slate-400">
                Bot token configuration coming soon. The bot will monitor channel ID: 1267935048997539862
              </p>
            </div>
            
            <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-sm text-yellow-200">
                <strong>Supported formats:</strong>
              </p>
              <ul className="text-xs text-yellow-200 mt-2 space-y-1 ml-4 list-disc">
                <li>"Player Name signs with Team"</li>
                <li>"Player Name to Team"</li>
                <li>"Team signs Player Name"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Post Single Team */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Post Individual Team</CardTitle>
            <CardDescription>Post a specific team's cap status with player list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamSelect" className="text-slate-300">
                Select Team
              </Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handlePostTeam}
              disabled={postTeamMutation.isPending || !webhookUrl || !selectedTeam}
              className="w-full gap-2"
              variant="secondary"
            >
              {postTeamMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Posting Team...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post {selectedTeam || "Team"} to Discord
                </>
              )}
            </Button>

            <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <p className="text-sm text-purple-200">
                <strong>Info:</strong> This posts a detailed breakdown of a single team including all players and their overall ratings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Actions</CardTitle>
            <CardDescription>Post or update the cap status embed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={handlePost}
                disabled={postMutation.isPending || !webhookUrl}
                className="flex-1 gap-2"
              >
                {postMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post New Message
                  </>
                )}
              </Button>

              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending || !webhookUrl || !messageId}
                variant="outline"
                className="flex-1 gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Update Existing
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Tip:</strong> Use "Post New Message" first, then copy the message ID and
                use "Update Existing" to refresh the same message. This keeps your Discord channel
                clean!
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
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-white">🏀 NBA 2K26 Team Cap Status</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    <strong>Cap Limit:</strong> 1098 Total Overall
                  </p>
                  <p className="text-sm text-slate-400">
                    🔴 Over Cap: X | 🟡 At Cap: X | 🟢 Under Cap: X
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-slate-800 rounded">
                    <p className="text-sm font-semibold text-white">Bucks (14/14)</p>
                    <p className="text-sm text-red-400">🔴 1106 (+8)</p>
                    <a href="#" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                      View Team → <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="p-2 bg-slate-800 rounded">
                    <p className="text-sm font-semibold text-white">Lakers (14/14)</p>
                    <p className="text-sm text-green-400">🟢 1095</p>
                    <a href="#" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                      View Team → <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
