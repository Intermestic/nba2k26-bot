import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface CommandFormData {
  trigger: string;
  response: string;
  responseType: "text" | "embed" | "reaction";
  embedTitle?: string;
  embedColor?: string;
  cooldownSeconds: number;
  cooldownType: "user" | "channel" | "global";
  permissionLevel: "everyone" | "role" | "admin";
  requiredRoleIds?: string;
  enabled: boolean;
}

const defaultFormData: CommandFormData = {
  trigger: "",
  response: "",
  responseType: "text",
  embedTitle: "",
  embedColor: "#5865F2",
  cooldownSeconds: 0,
  cooldownType: "user",
  permissionLevel: "everyone",
  requiredRoleIds: "",
  enabled: true,
};

export default function CustomCommands() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<any>(null);
  const [formData, setFormData] = useState<CommandFormData>(defaultFormData);

  const { data: commands, refetch } = trpc.customCommands.getAll.useQuery({ search: searchTerm });
  const { data: stats } = trpc.customCommands.getStats.useQuery();
  const createMutation = trpc.customCommands.create.useMutation();
  const updateMutation = trpc.customCommands.update.useMutation();
  const deleteMutation = trpc.customCommands.delete.useMutation();
  const toggleMutation = trpc.customCommands.toggleEnabled.useMutation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Command created successfully!");
      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create command");
    }
  };

  const handleEdit = async () => {
    if (!editingCommand) return;
    try {
      await updateMutation.mutateAsync({
        id: editingCommand.id,
        ...formData,
      });
      toast.success("Command updated successfully!");
      setIsEditDialogOpen(false);
      setEditingCommand(null);
      setFormData(defaultFormData);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update command");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this command?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Command deleted successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete command");
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, enabled });
      toast.success(`Command ${enabled ? "enabled" : "disabled"}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle command");
    }
  };

  const openEditDialog = (command: any) => {
    setEditingCommand(command);
    setFormData({
      trigger: command.trigger,
      response: command.response,
      responseType: command.responseType,
      embedTitle: command.embedTitle || "",
      embedColor: command.embedColor || "#5865F2",
      cooldownSeconds: command.cooldownSeconds,
      cooldownType: command.cooldownType,
      permissionLevel: command.permissionLevel,
      requiredRoleIds: command.requiredRoleIds || "",
      enabled: command.enabled,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Custom Commands</h1>
            <p className="text-muted-foreground mt-1">
              Create user-defined commands with custom triggers and responses (separate from hardcoded bot commands in Bot Management)
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Command
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCommands}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.enabledCommands} enabled
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUses}</div>
                <p className="text-xs text-muted-foreground">
                  All-time command executions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Most Used</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.mostUsed.length > 0 ? (
                  <div className="text-2xl font-bold">{stats.mostUsed[0].trigger}</div>
                ) : (
                  <div className="text-sm text-muted-foreground">No commands yet</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {stats.mostUsed[0]?.useCount || 0} uses
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Commands Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commands</CardTitle>
            <CardDescription>
              Available variables: {"{user}"}, {"{channel}"}, {"{server}"}, {"{memberCount}"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cooldown</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commands?.map((command) => (
                  <TableRow key={command.id}>
                    <TableCell className="font-mono font-semibold">
                      {command.trigger}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {command.response}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{command.responseType}</Badge>
                    </TableCell>
                    <TableCell>
                      {command.cooldownSeconds > 0
                        ? `${command.cooldownSeconds}s (${command.cooldownType})`
                        : "None"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{command.permissionLevel}</Badge>
                    </TableCell>
                    <TableCell>{command.useCount || 0}</TableCell>
                    <TableCell>
                      <Switch
                        checked={command.enabled}
                        onCheckedChange={(checked) =>
                          handleToggle(command.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(command)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(command.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Command</DialogTitle>
              <DialogDescription>
                Create a new custom command with variables and cooldowns
              </DialogDescription>
            </DialogHeader>
            <CommandForm formData={formData} setFormData={setFormData} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Command"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Command</DialogTitle>
              <DialogDescription>
                Update command settings and response
              </DialogDescription>
            </DialogHeader>
            <CommandForm formData={formData} setFormData={setFormData} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Command"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface CommandFormProps {
  formData: CommandFormData;
  setFormData: (data: CommandFormData) => void;
}

function CommandForm({ formData, setFormData }: CommandFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="trigger">Command Trigger</Label>
        <Input
          id="trigger"
          placeholder="!rules"
          value={formData.trigger}
          onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          The command users will type (e.g., !rules, !help)
        </p>
      </div>

      <div>
        <Label htmlFor="response">Response</Label>
        <Textarea
          id="response"
          placeholder="Welcome to our server! Please read the rules..."
          value={formData.response}
          onChange={(e) => setFormData({ ...formData, response: e.target.value })}
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Variables: {"{user}"}, {"{channel}"}, {"{server}"}, {"{memberCount}"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="responseType">Response Type</Label>
          <Select
            value={formData.responseType}
            onValueChange={(value: any) =>
              setFormData({ ...formData, responseType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="embed">Embed</SelectItem>
              <SelectItem value="reaction">Reaction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="permissionLevel">Permission Level</Label>
          <Select
            value={formData.permissionLevel}
            onValueChange={(value: any) =>
              setFormData({ ...formData, permissionLevel: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="role">Specific Roles</SelectItem>
              <SelectItem value="admin">Admin Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.responseType === "embed" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="embedTitle">Embed Title</Label>
            <Input
              id="embedTitle"
              placeholder="Server Rules"
              value={formData.embedTitle}
              onChange={(e) =>
                setFormData({ ...formData, embedTitle: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="embedColor">Embed Color</Label>
            <Input
              id="embedColor"
              type="color"
              value={formData.embedColor}
              onChange={(e) =>
                setFormData({ ...formData, embedColor: e.target.value })
              }
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cooldownSeconds">Cooldown (seconds)</Label>
          <Input
            id="cooldownSeconds"
            type="number"
            min="0"
            value={formData.cooldownSeconds}
            onChange={(e) =>
              setFormData({
                ...formData,
                cooldownSeconds: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="cooldownType">Cooldown Type</Label>
          <Select
            value={formData.cooldownType}
            onValueChange={(value: any) =>
              setFormData({ ...formData, cooldownType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Per User</SelectItem>
              <SelectItem value="channel">Per Channel</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.permissionLevel === "role" && (
        <div>
          <Label htmlFor="requiredRoleIds">Required Role IDs (JSON array)</Label>
          <Input
            id="requiredRoleIds"
            placeholder='["123456789", "987654321"]'
            value={formData.requiredRoleIds}
            onChange={(e) =>
              setFormData({ ...formData, requiredRoleIds: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            JSON array of Discord role IDs
          </p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, enabled: checked })
          }
        />
        <Label htmlFor="enabled">Enabled</Label>
      </div>
    </div>
  );
}
