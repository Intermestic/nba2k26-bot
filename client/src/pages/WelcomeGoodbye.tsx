import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Info } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WelcomeGoodbye() {
  const { data: welcomeConfig, refetch: refetchWelcome } = trpc.welcomeGoodbye.getWelcomeConfig.useQuery();
  const { data: goodbyeConfig, refetch: refetchGoodbye } = trpc.welcomeGoodbye.getGoodbyeConfig.useQuery();
  
  const updateWelcomeMutation = trpc.welcomeGoodbye.updateWelcomeConfig.useMutation();
  const updateGoodbyeMutation = trpc.welcomeGoodbye.updateGoodbyeConfig.useMutation();
  const toggleWelcomeMutation = trpc.welcomeGoodbye.toggleWelcome.useMutation();
  const toggleGoodbyeMutation = trpc.welcomeGoodbye.toggleGoodbye.useMutation();

  // Welcome form state
  const [welcomeForm, setWelcomeForm] = useState({
    enabled: false,
    channelId: "",
    messageType: "embed" as "text" | "embed" | "card",
    messageContent: "Welcome {user} to {server}! We're glad to have you here. 🎉",
    embedTitle: "Welcome!",
    embedColor: "#5865F2",
    embedImageUrl: "",
    dmEnabled: false,
    dmContent: "Welcome to {server}! Thanks for joining us.",
    autoRoleIds: "[]",
  });

  // Goodbye form state
  const [goodbyeForm, setGoodbyeForm] = useState({
    enabled: false,
    channelId: "",
    messageType: "text" as "text" | "embed",
    messageContent: "Goodbye {username}! Thanks for being part of {server}.",
    embedTitle: "Farewell",
    embedColor: "#ED4245",
  });

  // Load config data into forms
  useEffect(() => {
    if (welcomeConfig) {
      setWelcomeForm({
        enabled: welcomeConfig.enabled,
        channelId: welcomeConfig.channelId,
        messageType: welcomeConfig.messageType,
        messageContent: welcomeConfig.messageContent,
        embedTitle: welcomeConfig.embedTitle || "",
        embedColor: welcomeConfig.embedColor || "#5865F2",
        embedImageUrl: welcomeConfig.embedImageUrl || "",
        dmEnabled: welcomeConfig.dmEnabled,
        dmContent: welcomeConfig.dmContent || "",
        autoRoleIds: welcomeConfig.autoRoleIds || "[]",
      });
    }
  }, [welcomeConfig]);

  useEffect(() => {
    if (goodbyeConfig) {
      setGoodbyeForm({
        enabled: goodbyeConfig.enabled,
        channelId: goodbyeConfig.channelId,
        messageType: goodbyeConfig.messageType,
        messageContent: goodbyeConfig.messageContent,
        embedTitle: goodbyeConfig.embedTitle || "",
        embedColor: goodbyeConfig.embedColor || "#ED4245",
      });
    }
  }, [goodbyeConfig]);

  const handleSaveWelcome = async () => {
    try {
      await updateWelcomeMutation.mutateAsync(welcomeForm);
      toast.success("Welcome message settings saved!");
      refetchWelcome();
    } catch (error: any) {
      toast.error(error.message || "Failed to save welcome settings");
    }
  };

  const handleSaveGoodbye = async () => {
    try {
      await updateGoodbyeMutation.mutateAsync(goodbyeForm);
      toast.success("Goodbye message settings saved!");
      refetchGoodbye();
    } catch (error: any) {
      toast.error(error.message || "Failed to save goodbye settings");
    }
  };

  const handleToggleWelcome = async (enabled: boolean) => {
    try {
      await toggleWelcomeMutation.mutateAsync({ enabled });
      toast.success(`Welcome messages ${enabled ? "enabled" : "disabled"}`);
      refetchWelcome();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle welcome messages");
    }
  };

  const handleToggleGoodbye = async (enabled: boolean) => {
    try {
      await toggleGoodbyeMutation.mutateAsync({ enabled });
      toast.success(`Goodbye messages ${enabled ? "enabled" : "disabled"}`);
      refetchGoodbye();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle goodbye messages");
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome & Goodbye Messages</h1>
          <p className="text-muted-foreground mt-1">
            Customize messages for new members and departing members
          </p>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Available variables:</strong> {"{user}"} (mention), {"{username}"} (name), {"{server}"} (server name), {"{memberCount}"} (total members)
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="welcome" className="space-y-4">
          <TabsList>
            <TabsTrigger value="welcome">Welcome Messages</TabsTrigger>
            <TabsTrigger value="goodbye">Goodbye Messages</TabsTrigger>
          </TabsList>

          {/* Welcome Tab */}
          <TabsContent value="welcome">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Welcome Configuration</CardTitle>
                    <CardDescription>
                      Send messages when new members join the server
                    </CardDescription>
                  </div>
                  <Switch
                    checked={welcomeForm.enabled}
                    onCheckedChange={(checked) => {
                      setWelcomeForm({ ...welcomeForm, enabled: checked });
                      handleToggleWelcome(checked);
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="welcomeChannelId">Channel ID</Label>
                    <Input
                      id="welcomeChannelId"
                      placeholder="1234567890"
                      value={welcomeForm.channelId}
                      onChange={(e) =>
                        setWelcomeForm({ ...welcomeForm, channelId: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Discord channel ID where welcome messages will be sent
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="welcomeMessageType">Message Type</Label>
                    <Select
                      value={welcomeForm.messageType}
                      onValueChange={(value: any) =>
                        setWelcomeForm({ ...welcomeForm, messageType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="embed">Embed</SelectItem>
                        <SelectItem value="card">Card (Rich Embed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="welcomeMessageContent">Message Content</Label>
                  <Textarea
                    id="welcomeMessageContent"
                    placeholder="Welcome {user} to {server}!"
                    value={welcomeForm.messageContent}
                    onChange={(e) =>
                      setWelcomeForm({ ...welcomeForm, messageContent: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                {(welcomeForm.messageType === "embed" || welcomeForm.messageType === "card") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="welcomeEmbedTitle">Embed Title</Label>
                      <Input
                        id="welcomeEmbedTitle"
                        placeholder="Welcome!"
                        value={welcomeForm.embedTitle}
                        onChange={(e) =>
                          setWelcomeForm({ ...welcomeForm, embedTitle: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="welcomeEmbedColor">Embed Color</Label>
                      <Input
                        id="welcomeEmbedColor"
                        type="color"
                        value={welcomeForm.embedColor}
                        onChange={(e) =>
                          setWelcomeForm({ ...welcomeForm, embedColor: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {(welcomeForm.messageType === "embed" || welcomeForm.messageType === "card") && (
                  <div>
                    <Label htmlFor="welcomeEmbedImageUrl">Embed Image URL (Optional)</Label>
                    <Input
                      id="welcomeEmbedImageUrl"
                      placeholder="https://example.com/banner.png"
                      value={welcomeForm.embedImageUrl}
                      onChange={(e) =>
                        setWelcomeForm({ ...welcomeForm, embedImageUrl: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="dmEnabled"
                      checked={welcomeForm.dmEnabled}
                      onCheckedChange={(checked) =>
                        setWelcomeForm({ ...welcomeForm, dmEnabled: checked })
                      }
                    />
                    <Label htmlFor="dmEnabled">Send DM to new members</Label>
                  </div>

                  {welcomeForm.dmEnabled && (
                    <div>
                      <Label htmlFor="dmContent">DM Content</Label>
                      <Textarea
                        id="dmContent"
                        placeholder="Welcome to {server}!"
                        value={welcomeForm.dmContent}
                        onChange={(e) =>
                          setWelcomeForm({ ...welcomeForm, dmContent: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Label htmlFor="autoRoleIds">Auto-Assign Role IDs (JSON Array)</Label>
                  <Input
                    id="autoRoleIds"
                    placeholder='["1234567890", "0987654321"]'
                    value={welcomeForm.autoRoleIds}
                    onChange={(e) =>
                      setWelcomeForm({ ...welcomeForm, autoRoleIds: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON array of Discord role IDs to automatically assign to new members
                  </p>
                </div>

                <Button onClick={handleSaveWelcome} disabled={updateWelcomeMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateWelcomeMutation.isPending ? "Saving..." : "Save Welcome Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goodbye Tab */}
          <TabsContent value="goodbye">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Goodbye Configuration</CardTitle>
                    <CardDescription>
                      Send messages when members leave the server
                    </CardDescription>
                  </div>
                  <Switch
                    checked={goodbyeForm.enabled}
                    onCheckedChange={(checked) => {
                      setGoodbyeForm({ ...goodbyeForm, enabled: checked });
                      handleToggleGoodbye(checked);
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goodbyeChannelId">Channel ID</Label>
                    <Input
                      id="goodbyeChannelId"
                      placeholder="1234567890"
                      value={goodbyeForm.channelId}
                      onChange={(e) =>
                        setGoodbyeForm({ ...goodbyeForm, channelId: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Discord channel ID where goodbye messages will be sent
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="goodbyeMessageType">Message Type</Label>
                    <Select
                      value={goodbyeForm.messageType}
                      onValueChange={(value: any) =>
                        setGoodbyeForm({ ...goodbyeForm, messageType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="embed">Embed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="goodbyeMessageContent">Message Content</Label>
                  <Textarea
                    id="goodbyeMessageContent"
                    placeholder="Goodbye {username}!"
                    value={goodbyeForm.messageContent}
                    onChange={(e) =>
                      setGoodbyeForm({ ...goodbyeForm, messageContent: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                {goodbyeForm.messageType === "embed" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="goodbyeEmbedTitle">Embed Title</Label>
                      <Input
                        id="goodbyeEmbedTitle"
                        placeholder="Farewell"
                        value={goodbyeForm.embedTitle}
                        onChange={(e) =>
                          setGoodbyeForm({ ...goodbyeForm, embedTitle: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="goodbyeEmbedColor">Embed Color</Label>
                      <Input
                        id="goodbyeEmbedColor"
                        type="color"
                        value={goodbyeForm.embedColor}
                        onChange={(e) =>
                          setGoodbyeForm({ ...goodbyeForm, embedColor: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveGoodbye} disabled={updateGoodbyeMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateGoodbyeMutation.isPending ? "Saving..." : "Save Goodbye Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
