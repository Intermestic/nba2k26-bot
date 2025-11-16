import { useState } from "react";
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
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";

export default function BotManagement() {
  const [activeTab, setActiveTab] = useState("config");
  
  // Dialog states
  const [configDialog, setConfigDialog] = useState<{ open: boolean; key?: string }>({ open: false });
  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; key?: string }>({ open: false });
  const [commandDialog, setCommandDialog] = useState<{ open: boolean; command?: string }>({ open: false });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot Management</h1>
        <p className="text-muted-foreground">
          Manage Discord bot configuration, commands, and message templates without code changes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <ConfigTab 
            onEdit={(key) => setConfigDialog({ open: true, key })}
            onAdd={() => setConfigDialog({ open: true })}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatesTab 
            onEdit={(key) => setTemplateDialog({ open: true, key })}
            onAdd={() => setTemplateDialog({ open: true })}
          />
        </TabsContent>

        <TabsContent value="commands" className="mt-6">
          <CommandsTab 
            onEdit={(command) => setCommandDialog({ open: true, command })}
            onAdd={() => setCommandDialog({ open: true })}
          />
        </TabsContent>
      </Tabs>

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
  const deleteTemplate = trpc.botManagement.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      refetch();
    },
  });

  if (isLoading) return <div>Loading...</div>;

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
            {templates?.map((template) => (
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

  // Load existing data
  if (existingConfig && formData.key === "") {
    setFormData({
      key: existingConfig.key,
      value: existingConfig.value,
      description: existingConfig.description || "",
      category: existingConfig.category || "",
    });
  }

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

  // Load existing data
  if (existingTemplate && formData.key === "") {
    setFormData({
      key: existingTemplate.key,
      content: existingTemplate.content,
      description: existingTemplate.description || "",
      category: existingTemplate.category || "",
      variables: existingTemplate.variables || "",
    });
  }

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
            <Label htmlFor="content">Content * (supports Discord markdown)</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Message content with {variables}"
              rows={15}
              className="font-mono text-sm"
            />
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

  // Load existing data
  if (existingCommand && formData.command === "") {
    setFormData({
      command: existingCommand.command,
      description: existingCommand.description,
      enabled: existingCommand.enabled,
      responseTemplate: existingCommand.responseTemplate || "",
      permissions: existingCommand.permissions || "",
      category: existingCommand.category || "",
    });
  }

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
