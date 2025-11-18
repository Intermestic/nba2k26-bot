import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Save, X, Clock, Send, Calendar, Info, Copy, Eye, Edit3, Filter, BarChart3, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function BotManagement() {
  const [activeTab, setActiveTab] = useState("config");
  
  // Dialog states
  const [configDialog, setConfigDialog] = useState<{ open: boolean; key?: string }>({ open: false });
  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; key?: string }>({ open: false });
  const [commandDialog, setCommandDialog] = useState<{ open: boolean; command?: string }>({ open: false });
  const [scheduleDialog, setScheduleDialog] = useState<{ open: boolean; id?: number }>({ open: false });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot Management</h1>
        <p className="text-muted-foreground">
          Manage Discord bot configuration, commands, and message templates without code changes
        </p>
      </div>

      {/* Manual Tab Implementation */}
      <div className="space-y-6">
        {/* Tab List */}
        <div className="inline-flex h-9 w-full items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
          <button
            onClick={() => setActiveTab("config")}
            className={`inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${activeTab === "config" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${activeTab === "templates" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            Message Templates
          </button>
          <button
            onClick={() => setActiveTab("commands")}
            className={`inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${activeTab === "commands" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            Commands
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${activeTab === "scheduled" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            Scheduled Messages
          </button>
          <button
            onClick={() => setActiveTab("automation")}
            className={`inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${activeTab === "automation" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            Automation
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "config" && (
            <ConfigTab 
              onEdit={(key) => setConfigDialog({ open: true, key })}
              onAdd={() => setConfigDialog({ open: true })}
            />
          )}
          {activeTab === "templates" && (
            <TemplatesTab 
              onEdit={(key) => setTemplateDialog({ open: true, key })}
              onAdd={() => setTemplateDialog({ open: true })}
            />
          )}
          {activeTab === "commands" && (
            <CommandsTab 
              onEdit={(command) => setCommandDialog({ open: true, command })}
              onAdd={() => setCommandDialog({ open: true })}
            />
          )}
          {activeTab === "scheduled" && (
            <ScheduledMessagesTab 
              onEdit={(id) => setScheduleDialog({ open: true, id })}
              onAdd={() => setScheduleDialog({ open: true })}
            />
          )}
          {activeTab === "automation" && <AutomationTab />}
        </div>
      </div>

      {/* Dialogs */}
      <ConfigDialog 
        open={configDialog.open}
        configKey={configDialog.key}
        onClose={() => setConfigDialog({ open: false })}
      />
      <TemplateDialog 
        open={templateDialog.open}
        templateKey={templateDialog.key}
        onClose={() => setTemplateDialog({ open: false })}
      />
      <CommandDialog 
        open={commandDialog.open}
        commandName={commandDialog.command}
        onClose={() => setCommandDialog({ open: false })}
      />
      <ScheduledMessageDialog 
        open={scheduleDialog.open}
        messageId={scheduleDialog.id}
        onClose={() => setScheduleDialog({ open: false })}
      />
    </div>
  );
}

// ==================== CONFIG TAB ====================

function ConfigTab({ onEdit, onAdd }: { onEdit: (key: string) => void; onAdd: () => void }) {
  const { data: configs, isLoading, refetch } = trpc.botManagement.getConfig.useQuery();
  const deleteConfig = trpc.botManagement.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration deleted");
      refetch();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bot Configuration</CardTitle>
            <CardDescription>Manage general bot settings and feature toggles</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Config
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs?.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-mono text-sm">{config.key}</TableCell>
                <TableCell className="font-mono text-sm max-w-[200px] truncate">{config.value}</TableCell>
                <TableCell>{config.category || "-"}</TableCell>
                <TableCell className="max-w-[300px] truncate">{config.description || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(config.key)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete config "${config.key}"?`)) {
                          deleteConfig.mutate({ key: config.key });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ==================== TEMPLATES TAB ====================

function TemplatesTab({ onEdit, onAdd }: { onEdit: (key: string) => void; onAdd: () => void }) {
  const { data: templates, isLoading, refetch } = trpc.botManagement.getTemplates.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const deleteTemplate = trpc.botManagement.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      refetch();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  // Get unique categories and counts
  const categories = templates ? Array.from(new Set(templates.map(t => t.category || 'uncategorized'))) : [];
  const categoryCounts = templates?.reduce((acc, t) => {
    const cat = t.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates?.filter(t => (t.category || 'uncategorized') === selectedCategory);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>Customize bot messages and notifications</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b overflow-x-auto">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            All ({templates?.length || 0})
          </button>
          {categories.sort().map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {category} ({categoryCounts[category] || 0})
            </button>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-mono text-sm">{template.key}</TableCell>
                <TableCell>{template.category || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{template.description || "-"}</TableCell>
                <TableCell className="max-w-[300px] truncate font-mono text-xs">
                  {template.content.substring(0, 100)}...
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(template.key)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete template "${template.key}"?`)) {
                          deleteTemplate.mutate({ key: template.key });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ==================== COMMANDS TAB ====================

function CommandsTab({ onEdit, onAdd }: { onEdit: (command: string) => void; onAdd: () => void }) {
  const { data: commands, isLoading, refetch } = trpc.botManagement.getCommands.useQuery();
  const toggleCommand = trpc.botManagement.toggleCommand.useMutation({
    onSuccess: () => {
      toast.success("Command updated");
      refetch();
    },
  });
  const deleteCommand = trpc.botManagement.deleteCommand.useMutation({
    onSuccess: () => {
      toast.success("Command deleted");
      refetch();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bot Commands</CardTitle>
            <CardDescription>Manage Discord bot commands and responses</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Command
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Command</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commands?.map((command) => (
              <TableRow key={command.id}>
                <TableCell className="font-mono text-sm">{command.command}</TableCell>
                <TableCell className="max-w-[250px] truncate">{command.description}</TableCell>
                <TableCell>{command.category || "-"}</TableCell>
                <TableCell>{command.permissions || "all"}</TableCell>
                <TableCell>
                  <Switch
                    checked={command.enabled}
                    onCheckedChange={(checked) => {
                      toggleCommand.mutate({ command: command.command, enabled: checked });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(command.command)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete command "${command.command}"?`)) {
                          deleteCommand.mutate({ command: command.command });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ==================== DIALOGS ====================

function ConfigDialog({ open, configKey, onClose }: { open: boolean; configKey?: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: "",
    category: "",
  });

  const { data: existingConfig } = trpc.botManagement.getConfigByKey.useQuery(
    { key: configKey! },
    { enabled: !!configKey }
  );

  const upsertConfig = trpc.botManagement.upsertConfig.useMutation({
    onSuccess: () => {
      toast.success(configKey ? "Configuration updated" : "Configuration created");
      onClose();
    },
  });

  // Load existing data when it arrives
  useEffect(() => {
    if (existingConfig) {
      setFormData({
        key: existingConfig.key,
        value: existingConfig.value,
        description: existingConfig.description || "",
        category: existingConfig.category || "",
      });
    }
  }, [existingConfig]);

  const handleSubmit = () => {
    if (!formData.key || !formData.value) {
      toast.error("Key and value are required");
      return;
    }
    upsertConfig.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{configKey ? "Edit Configuration" : "Add Configuration"}</DialogTitle>
          <DialogDescription>
            Configure bot settings and feature toggles
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="key">Key *</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g., fa_bidding_enabled"
              disabled={!!configKey}
            />
          </div>
          <div>
            <Label htmlFor="value">Value *</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="e.g., true"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., features, channels"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this configuration controls"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={upsertConfig.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDialog({ open, templateKey, onClose }: { open: boolean; templateKey?: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    key: "",
    content: "",
    description: "",
    category: "",
    variables: "",
  });
  const [previewMode, setPreviewMode] = useState(false);

  // Reset form when dialog closes or templateKey changes
  useEffect(() => {
    if (!open) {
      setFormData({
        key: "",
        content: "",
        description: "",
        category: "",
        variables: "",
      });
      setPreviewMode(false);
    }
  }, [open]);

  // Sample data for preview
  const getSampleData = (category: string): Record<string, string> => {
    const samples: Record<string, Record<string, string>> = {
      fa: {
        playerName: "LeBron James",
        teamName: "Lakers",
        bidAmount: "150",
        windowId: "FA Window 3",
        totalBids: "42",
        totalCoins: "3,250",
        userId: "123456789",
        username: "GM_Lakers",
      },
      trades: {
        team1: "Lakers",
        team2: "Celtics",
        tradeId: "#TRD-2024-001",
        userId: "123456789",
      },
      upgrades: {
        playerName: "Stephen Curry",
        currentOVR: "92",
        previousOVR: "92",
        newOVR: "94",
        upgradeAmount: "2",
        teamName: "Warriors",
        userId: "123456789",
        reason: "Insufficient activity points",
      },
      roster: {
        teamName: "Heat",
        issueType: "Salary Cap Violation",
        issueDetails: "Your team is $250 over the salary cap. Please make roster adjustments.",
      },
      games: {
        team1: "Lakers",
        team2: "Celtics",
        gameTime: "7:00 PM ET",
        location: "Staples Center",
      },
      activity: {
        teamName: "Knicks",
        gamesPlayed: "2",
        gamesRequired: "5",
        gamesRemaining: "3",
      },
      cap: {
        teamName: "Nets",
        capSpace: "$500",
        totalSalary: "$5,500",
        capLimit: "$5,000",
      },
    };
    return samples[category] || samples.fa;
  };

  const renderPreview = () => {
    let previewContent = formData.content;
    try {
      const vars = JSON.parse(formData.variables || '[]');
      const sampleData = getSampleData(formData.category);
      vars.forEach((variable: string) => {
        const value = sampleData[variable] || `{${variable}}`;
        previewContent = previewContent.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
      });
    } catch (e) {
      // Invalid JSON, show content as-is
    }
    return previewContent;
  };

  const { data: existingTemplate } = trpc.botManagement.getTemplateByKey.useQuery(
    { key: templateKey! },
    { enabled: !!templateKey }
  );

  const upsertTemplate = trpc.botManagement.upsertTemplate.useMutation({
    onSuccess: () => {
      toast.success(templateKey ? "Template updated" : "Template created");
      onClose();
    },
  });

  // Load existing data when template changes
  useEffect(() => {
    if (existingTemplate && open) {
      setFormData({
        key: existingTemplate.key,
        content: existingTemplate.content,
        description: existingTemplate.description || "",
        category: existingTemplate.category || "",
        variables: existingTemplate.variables || "",
      });
    }
  }, [existingTemplate, open]);

  const handleSubmit = () => {
    if (!formData.key || !formData.content) {
      toast.error("Key and content are required");
      return;
    }
    upsertTemplate.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{templateKey ? "Edit Template" : "Add Template"}</DialogTitle>
          <DialogDescription>
            Customize bot messages and notifications
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="key">Key *</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g., welcome_message"
              disabled={!!templateKey}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">Content * (supports Discord markdown)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={previewMode ? "outline" : "default"}
                  size="sm"
                  onClick={() => setPreviewMode(false)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant={previewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode(true)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
            {!previewMode ? (
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Message content with {variables}"
                rows={15}
                className="font-mono text-sm"
              />
            ) : (
              <div className="border rounded-md p-4 bg-[#36393f] text-[#dcddde] min-h-[300px]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                    BOT
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">NBA 2K26 Bot</span>
                      <span className="text-xs bg-[#5865f2] text-white px-1.5 py-0.5 rounded">BOT</span>
                      <span className="text-xs text-[#72767d]">Today at 12:00 PM</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                      {renderPreview()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Variable Documentation */}
            {formData.variables && (() => {
              try {
                const vars = JSON.parse(formData.variables);
                if (Array.isArray(vars) && vars.length > 0) {
                  return (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Available Variables</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {vars.map((variable: string) => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => {
                              const textarea = document.getElementById('content') as HTMLTextAreaElement;
                              if (textarea) {
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = textarea.value;
                                const before = text.substring(0, start);
                                const after = text.substring(end, text.length);
                                const newText = before + `{${variable}}` + after;
                                setFormData({ ...formData, content: newText });
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
                                }, 0);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-background border rounded hover:bg-accent transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            {`{${variable}}`}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Click a variable to insert it at cursor position
                      </p>
                    </div>
                  );
                }
              } catch (e) {
                // Invalid JSON, don't show anything
              }
              return null;
            })()}
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., welcome, notifications, commands"
            />
          </div>
          <div>
            <Label htmlFor="variables">Available Variables (JSON array)</Label>
            <Input
              id="variables"
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              placeholder='["teamName", "userId", "username"]'
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this template is used for"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={upsertTemplate.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommandDialog({ open, commandName, onClose }: { open: boolean; commandName?: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    command: "",
    description: "",
    enabled: true,
    responseTemplate: "",
    permissions: "",
    category: "",
  });

  const { data: existingCommand } = trpc.botManagement.getCommandByName.useQuery(
    { command: commandName! },
    { enabled: !!commandName }
  );

  const upsertCommand = trpc.botManagement.upsertCommand.useMutation({
    onSuccess: () => {
      toast.success(commandName ? "Command updated" : "Command created");
      onClose();
    },
  });

  // Load existing data when it arrives
  useEffect(() => {
    if (existingCommand) {
      setFormData({
        command: existingCommand.command,
        description: existingCommand.description,
        enabled: existingCommand.enabled,
        responseTemplate: existingCommand.responseTemplate || "",
        permissions: existingCommand.permissions || "",
        category: existingCommand.category || "",
      });
    }
  }, [existingCommand]);

  const handleSubmit = () => {
    if (!formData.command || !formData.description) {
      toast.error("Command and description are required");
      return;
    }
    upsertCommand.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{commandName ? "Edit Command" : "Add Command"}</DialogTitle>
          <DialogDescription>
            Configure bot command behavior and responses
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="command">Command *</Label>
            <Input
              id="command"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="e.g., !sync-team-roles"
              disabled={!!commandName}
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this command does"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="responseTemplate">Response Template</Label>
            <Textarea
              id="responseTemplate"
              value={formData.responseTemplate}
              onChange={(e) => setFormData({ ...formData, responseTemplate: e.target.value })}
              placeholder="Message to send when command is executed"
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., admin, team, fa"
              />
            </div>
            <div>
              <Label htmlFor="permissions">Permissions</Label>
              <Input
                id="permissions"
                value={formData.permissions}
                onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                placeholder="e.g., admin, user (leave empty for all)"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label htmlFor="enabled">Command Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={upsertCommand.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MANUAL TRADE VOTE CHECK ====================

function ManualTradeVoteCheck() {
  const [messageId, setMessageId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; upvotes?: number; downvotes?: number } | null>(null);
  
  const checkVotes = trpc.botManagement.manuallyCheckTradeVotes.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsChecking(false);
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      setIsChecking(false);
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const handleCheck = () => {
    if (!messageId.trim()) {
      toast.error('Please enter a message ID');
      return;
    }
    setIsChecking(true);
    setResult(null);
    checkVotes.mutate({ messageId: messageId.trim() });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Trade Vote Check</CardTitle>
        <CardDescription>
          Manually check and process votes for a trade message. Use this when the bot was offline and missed vote threshold.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="trade_message_id">Trade Message ID</Label>
          <Input
            id="trade_message_id"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="1440108805689053186"
            className="font-mono"
          />
        </div>
        <div className="flex items-end">
          <Button 
            onClick={handleCheck} 
            disabled={isChecking || !messageId.trim()}
          >
            {isChecking ? 'Checking...' : 'Check Votes'}
          </Button>
        </div>
      </div>
      
      {result && (
        <div className={`p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{result.message}</p>
              {result.upvotes !== undefined && result.downvotes !== undefined && (
                <p className="text-sm mt-1">
                  Current votes: {result.upvotes} 👍, {result.downvotes} 👎
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}

// ==================== DISCORD CAP STATUS SECTION ====================

function DiscordCapStatusSection() {
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(window.location.origin);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);

  // Load existing config
  const { data: config } = trpc.discord.getConfig.useQuery();
  
  // Check bot status
  const { data: botStatus, isLoading: botStatusLoading } = trpc.discord.getBotStatus.useQuery();
  console.log('[DiscordCapStatusSection] Bot status:', botStatus);

  // Update form when config loads
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

    updateMutation.mutate({ channelId, messageId, websiteUrl });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discord Cap Status Updates</CardTitle>
        <CardDescription>
          Post auto-updating team cap status messages to Discord
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cap_channel_id">Discord Channel ID</Label>
          <Input
            id="cap_channel_id"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="1234567890123456789"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Right-click your Discord channel → Copy Channel ID
          </p>
        </div>

        <div>
          <Label htmlFor="cap_website_url">Website URL</Label>
          <Input
            id="cap_website_url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://your-site.manus.space"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Team links in the Discord embed will point to this URL
          </p>
        </div>

        <div>
          <Label htmlFor="cap_message_id">Message ID (for updates)</Label>
          <Input
            id="cap_message_id"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="1234567890123456789"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Enter the message ID to update an existing message
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div>
            <Label htmlFor="cap_auto_update" className="font-medium">Auto-Update</Label>
            <p className="text-sm text-muted-foreground">
              Automatically update Discord when team assignments change
            </p>
          </div>
          <Switch
            id="cap_auto_update"
            checked={autoUpdateEnabled}
            onCheckedChange={setAutoUpdateEnabled}
          />
        </div>

        {autoUpdateEnabled && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Auto-update is enabled. Discord will refresh automatically when players are assigned to teams (max once per minute).
            </p>
          </div>
        )}

        {/* Bot Status Indicator */}
        {botStatusLoading ? (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking bot status...</span>
          </div>
        ) : botStatus?.online ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Bot is online: <strong>{botStatus.username}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Bot is offline. Please check the bot connection.
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveConfig}
            disabled={saveConfigMutation.isPending}
            variant="outline"
          >
            {saveConfigMutation.isPending ? "Saving..." : "Save Config"}
          </Button>
          <Button
            onClick={handlePost}
            disabled={postMutation.isPending || !channelId || !botStatus?.online}
          >
            <Send className="w-4 h-4 mr-2" />
            {postMutation.isPending ? "Posting..." : "Post New Message"}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateMutation.isPending || !messageId || !channelId || !botStatus?.online}
            variant="secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Updating..." : "Update Existing"}
          </Button>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Use "Post New Message" first, then copy the message ID from Discord and paste it above. 
            Then use "Update Existing" to refresh the same message.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== AUTOMATION TAB ====================

function AutomationTab() {
  return (
    <div className="space-y-6">
      {/* Manual Trade Vote Check */}
      <ManualTradeVoteCheck />

      {/* Discord Cap Status Posting */}
      <DiscordCapStatusSection />
    </div>
  );
}

// ==================== SCHEDULED MESSAGES TAB ====================

function ScheduledMessagesTab({ onEdit, onAdd }: { onEdit: (id: number) => void; onAdd: () => void }) {
  const { data: messages, isLoading, refetch } = trpc.botManagement.getScheduledMessages.useQuery();
  const [analyticsMessageId, setAnalyticsMessageId] = useState<number | null>(null);
  const toggleMessage = trpc.botManagement.toggleScheduledMessage.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated");
      refetch();
    },
  });
  const deleteMessage = trpc.botManagement.deleteScheduledMessage.useMutation({
    onSuccess: () => {
      toast.success("Scheduled message deleted");
      refetch();
    },
  });
  const testMessage = trpc.botManagement.testScheduledMessage.useMutation({
    onSuccess: () => {
      toast.success("Test message sent");
    },
    onError: () => {
      toast.error("Failed to send test message");
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading scheduled messages...</div>;
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Scheduled Messages
            </CardTitle>
            <CardDescription>Automate recurring messages to Discord channels</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!messages || messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled messages yet</p>
            <p className="text-sm">Create your first scheduled message to automate Discord notifications</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel ID</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">{msg.name}</TableCell>
                  <TableCell className="font-mono text-sm">{msg.channelId}</TableCell>
                  <TableCell className="text-sm">{msg.schedule}</TableCell>
                  <TableCell>
                    <Switch
                      checked={msg.enabled}
                      onCheckedChange={(checked) => toggleMessage.mutate({ id: msg.id, enabled: checked })}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {msg.lastRun ? new Date(msg.lastRun).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <ScheduledMessageSuccessRate messageId={msg.id} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAnalyticsMessageId(msg.id)}
                        title="View analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testMessage.mutate({ id: msg.id })}
                        title="Send test message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(msg.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Delete this scheduled message?')) {
                            deleteMessage.mutate({ id: msg.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    
    {/* Analytics Dialog */}
    {analyticsMessageId !== null && analyticsMessageId !== undefined && typeof analyticsMessageId === 'number' && (
      <ScheduledMessageAnalyticsDialog
        open={true}
        messageId={analyticsMessageId as number}
        onClose={() => setAnalyticsMessageId(null)}
      />
    )}
    </>
  );
}

// Helper component to show success rate
function ScheduledMessageSuccessRate({ messageId }: { messageId: number }) {
  const { data: analytics } = trpc.botManagement.getScheduledMessageAnalytics.useQuery({ messageId });
  
  if (!analytics || analytics.totalAttempts === 0) {
    return <span className="text-xs text-muted-foreground">No data</span>;
  }
  
  const color = analytics.successRate >= 90 ? 'text-green-600' : analytics.successRate >= 70 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <span className={`text-sm font-medium ${color}`}>
      {String(analytics.successRate ?? 0)}%
    </span>
  );
}

// Analytics Dialog
function ScheduledMessageAnalyticsDialog({ open, messageId, onClose }: { open: boolean; messageId: number; onClose: () => void }) {
  const { data: analytics, isLoading: analyticsLoading } = trpc.botManagement.getScheduledMessageAnalytics.useQuery({ messageId });
  const { data: logs, isLoading: logsLoading } = trpc.botManagement.getScheduledMessageLogs.useQuery({ messageId });
  const { data: message, isLoading: messageLoading } = trpc.botManagement.getScheduledMessageById.useQuery({ id: messageId });
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Analytics: {message?.name ?? 'Loading...'}</DialogTitle>
          <DialogDescription>
            View delivery history and success metrics
          </DialogDescription>
        </DialogHeader>
        
        {(analyticsLoading || logsLoading || messageLoading) && (
          <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
        )}
        
        {!analyticsLoading && !logsLoading && !messageLoading && (
          <>
        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{String(analytics.successCount ?? 0)}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold">{String(analytics.failedCount ?? 0)}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                  <div className="text-2xl font-bold">{String(analytics.retryCount ?? 0)}</div>
                  <div className="text-xs text-muted-foreground">Retries</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{String(analytics.successRate ?? 0)}%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Delivery Logs */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Deliveries</h3>
          {logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {log.executedAt ? (log.executedAt instanceof Date ? log.executedAt.toLocaleString() : new Date(log.executedAt).toLocaleString()) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {log.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Success
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                      {log.status === 'retrying' && (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="w-4 h-4" />
                          Retrying
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{String(log.attemptNumber ?? 0)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {log.errorMessage || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No delivery logs yet
            </div>
          )}
        </div>
        </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduledMessageDialog({ open, messageId, onClose }: { open: boolean; messageId?: number; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    channelId: "",
    message: "",
    schedule: "daily",
    enabled: true,
  });

  const { data: existingMessage } = trpc.botManagement.getScheduledMessageById.useQuery(
    { id: messageId! },
    { enabled: !!messageId }
  );

  const upsertMessage = trpc.botManagement.upsertScheduledMessage.useMutation({
    onSuccess: () => {
      toast.success(messageId ? "Schedule updated" : "Schedule created");
      onClose();
    },
  });

  // Load existing data when it arrives
  useEffect(() => {
    if (existingMessage) {
      setFormData({
        name: existingMessage.name,
        channelId: existingMessage.channelId,
        message: existingMessage.message,
        schedule: existingMessage.schedule,
        enabled: existingMessage.enabled,
      });
    }
  }, [existingMessage]);

  const handleSubmit = () => {
    if (!formData.name || !formData.channelId || !formData.message || !formData.schedule) {
      toast.error("All fields are required");
      return;
    }
    upsertMessage.mutate({ ...formData, id: messageId });
  };

  const schedulePresets = [
    { value: "daily", label: "Daily at noon ET" },
    { value: "weekly", label: "Weekly (Monday noon ET)" },
    { value: "bidding_window", label: "Before bidding windows (11:50 AM/PM ET)" },
    { value: "custom", label: "Custom cron expression" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{messageId ? "Edit Scheduled Message" : "Add Scheduled Message"}</DialogTitle>
          <DialogDescription>
            Configure automated messages to be sent to Discord channels on a schedule
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Daily FA Reminder"
            />
          </div>
          <div>
            <Label htmlFor="channelId">Discord Channel ID *</Label>
            <Input
              id="channelId"
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              placeholder="e.g., 1095812920056762510"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Right-click a channel in Discord (with Developer Mode enabled) and select "Copy ID"
            </p>
          </div>
          <div>
            <Label htmlFor="message">Message Content *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Your message here (supports Discord markdown)"
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="schedule">Schedule *</Label>
            <select
              id="schedule"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {schedulePresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label htmlFor="enabled">Schedule Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={upsertMessage.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
