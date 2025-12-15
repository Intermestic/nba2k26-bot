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
import { Plus, Edit, Trash2, Send, Settings } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface PanelFormData {
  name: string;
  channelId: string;
  title: string;
  description: string;
  embedColor: string;
  maxRoles: number;
  enabled: boolean;
}

interface RoleFormData {
  emoji: string;
  roleId: string;
  roleName: string;
  description: string;
  requiredRoleIds: string;
}

const defaultPanelForm: PanelFormData = {
  name: "",
  channelId: "",
  title: "Select Your Roles",
  description: "React to this message to get roles!",
  embedColor: "#5865F2",
  maxRoles: 0,
  enabled: true,
};

const defaultRoleForm: RoleFormData = {
  emoji: "",
  roleId: "",
  roleName: "",
  description: "",
  requiredRoleIds: "[]",
};

export default function ReactionRoles() {
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [panelForm, setPanelForm] = useState<PanelFormData>(defaultPanelForm);
  const [roleForm, setRoleForm] = useState<RoleFormData>(defaultRoleForm);

  const { data: panels, refetch } = trpc.reactionRoles.getAllPanels.useQuery();
  const createPanelMutation = trpc.reactionRoles.createPanel.useMutation();
  const updatePanelMutation = trpc.reactionRoles.updatePanel.useMutation();
  const deletePanelMutation = trpc.reactionRoles.deletePanel.useMutation();
  const togglePanelMutation = trpc.reactionRoles.togglePanel.useMutation();
  const addRoleMutation = trpc.reactionRoles.addRole.useMutation();
  const deleteRoleMutation = trpc.reactionRoles.deleteRole.useMutation();
  const postPanelMutation = trpc.reactionRoles.postPanel.useMutation();

  const handleCreatePanel = async () => {
    try {
      await createPanelMutation.mutateAsync(panelForm);
      toast.success("Panel created successfully!");
      setIsCreatePanelOpen(false);
      setPanelForm(defaultPanelForm);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create panel");
    }
  };

  const handleUpdatePanel = async () => {
    if (!selectedPanel) return;
    try {
      await updatePanelMutation.mutateAsync({
        id: selectedPanel.id,
        ...panelForm,
      });
      toast.success("Panel updated successfully!");
      setIsEditPanelOpen(false);
      setSelectedPanel(null);
      setPanelForm(defaultPanelForm);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update panel");
    }
  };

  const handleDeletePanel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this panel? All associated roles will be removed.")) return;
    try {
      await deletePanelMutation.mutateAsync({ id });
      toast.success("Panel deleted successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete panel");
    }
  };

  const handleTogglePanel = async (id: number, enabled: boolean) => {
    try {
      await togglePanelMutation.mutateAsync({ id, enabled });
      toast.success(`Panel ${enabled ? "enabled" : "disabled"}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle panel");
    }
  };

  const handleAddRole = async () => {
    if (!selectedPanel) return;
    try {
      await addRoleMutation.mutateAsync({
        panelId: selectedPanel.id,
        ...roleForm,
      });
      toast.success("Role added successfully!");
      setIsAddRoleOpen(false);
      setRoleForm(defaultRoleForm);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to add role");
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteRoleMutation.mutateAsync({ id: roleId });
      toast.success("Role deleted successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role");
    }
  };

  const handlePostPanel = async (id: number) => {
    try {
      await postPanelMutation.mutateAsync({ id });
      toast.success("Panel posted to Discord! Check the configured channel.");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to post panel");
    }
  };

  const openEditPanel = (panel: any) => {
    setSelectedPanel(panel);
    setPanelForm({
      name: panel.name,
      channelId: panel.channelId,
      title: panel.title,
      description: panel.description || "",
      embedColor: panel.embedColor || "#5865F2",
      maxRoles: panel.maxRoles,
      enabled: panel.enabled,
    });
    setIsEditPanelOpen(true);
  };

  const openAddRole = (panel: any) => {
    setSelectedPanel(panel);
    setRoleForm(defaultRoleForm);
    setIsAddRoleOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Reaction Roles</h1>
            <p className="text-muted-foreground mt-1">
              Create panels where users can react to get roles
            </p>
          </div>
          <Button onClick={() => setIsCreatePanelOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Panel
          </Button>
        </div>

        {/* Panels List */}
        <div className="space-y-4">
          {panels?.map((panel) => (
            <Card key={panel.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle>{panel.name}</CardTitle>
                      <Badge variant={panel.enabled ? "default" : "secondary"}>
                        {panel.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {panel.messageId && (
                        <Badge variant="outline">Posted</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      Channel ID: {panel.channelId} • Max roles: {panel.maxRoles || "Unlimited"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={panel.enabled}
                      onCheckedChange={(checked) => handleTogglePanel(panel.id, checked)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePostPanel(panel.id)}
                      title="Post to Discord"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditPanel(panel)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePanel(panel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Panel Preview:</h4>
                  <div
                    className="border rounded-lg p-4"
                    style={{ borderLeftColor: panel.embedColor || undefined, borderLeftWidth: 4 }}
                  >
                    <h3 className="font-bold text-lg mb-2">{panel.title}</h3>
                    {panel.description && (
                      <p className="text-sm text-muted-foreground mb-3">{panel.description}</p>
                    )}
                    {panel.roles && panel.roles.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">React to get a role:</p>
                        {panel.roles.map((role: any) => (
                          <div key={role.id} className="text-sm">
                            {role.emoji} - <strong>{role.roleName}</strong>
                            {role.description && ` - ${role.description}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    Roles ({panel.roles?.length || 0})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddRole(panel)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Role
                  </Button>
                </div>

                {panel.roles && panel.roles.length > 0 && (
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Emoji</TableHead>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Role ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {panel.roles.map((role: any) => (
                        <TableRow key={role.id}>
                          <TableCell className="text-2xl">{role.emoji}</TableCell>
                          <TableCell className="font-medium">{role.roleName}</TableCell>
                          <TableCell className="font-mono text-xs">{role.roleId}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {role.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Panel Dialog */}
        <Dialog open={isCreatePanelOpen} onOpenChange={setIsCreatePanelOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Reaction Role Panel</DialogTitle>
              <DialogDescription>
                Create a new panel where users can react to get roles
              </DialogDescription>
            </DialogHeader>
            <PanelForm formData={panelForm} setFormData={setPanelForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePanelOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePanel} disabled={createPanelMutation.isPending}>
                {createPanelMutation.isPending ? "Creating..." : "Create Panel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Panel Dialog */}
        <Dialog open={isEditPanelOpen} onOpenChange={setIsEditPanelOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Panel</DialogTitle>
              <DialogDescription>Update panel settings</DialogDescription>
            </DialogHeader>
            <PanelForm formData={panelForm} setFormData={setPanelForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditPanelOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePanel} disabled={updatePanelMutation.isPending}>
                {updatePanelMutation.isPending ? "Updating..." : "Update Panel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Role Dialog */}
        <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
              <DialogDescription>
                Add a new emoji-role mapping to {selectedPanel?.name}
              </DialogDescription>
            </DialogHeader>
            <RoleForm formData={roleForm} setFormData={setRoleForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={addRoleMutation.isPending}>
                {addRoleMutation.isPending ? "Adding..." : "Add Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface PanelFormProps {
  formData: PanelFormData;
  setFormData: (data: PanelFormData) => void;
}

function PanelForm({ formData, setFormData }: PanelFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Panel Name</Label>
        <Input
          id="name"
          placeholder="Role Selection"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Internal name for this panel (not shown to users)
        </p>
      </div>

      <div>
        <Label htmlFor="channelId">Channel ID</Label>
        <Input
          id="channelId"
          placeholder="1234567890"
          value={formData.channelId}
          onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Discord channel ID where the panel will be posted
        </p>
      </div>

      <div>
        <Label htmlFor="title">Panel Title</Label>
        <Input
          id="title"
          placeholder="Select Your Roles"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="React to this message to get roles!"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="embedColor">Embed Color</Label>
          <Input
            id="embedColor"
            type="color"
            value={formData.embedColor}
            onChange={(e) => setFormData({ ...formData, embedColor: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="maxRoles">Max Roles Per User</Label>
          <Input
            id="maxRoles"
            type="number"
            min="0"
            value={formData.maxRoles}
            onChange={(e) =>
              setFormData({ ...formData, maxRoles: parseInt(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">0 = unlimited</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label htmlFor="enabled">Enabled</Label>
      </div>
    </div>
  );
}

interface RoleFormProps {
  formData: RoleFormData;
  setFormData: (data: RoleFormData) => void;
}

function RoleForm({ formData, setFormData }: RoleFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="emoji">Emoji</Label>
        <Input
          id="emoji"
          placeholder="🎮"
          value={formData.emoji}
          onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Unicode emoji or custom emoji (e.g., &lt;:name:id&gt;)
        </p>
      </div>

      <div>
        <Label htmlFor="roleId">Role ID</Label>
        <Input
          id="roleId"
          placeholder="1234567890"
          value={formData.roleId}
          onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="roleName">Role Name</Label>
        <Input
          id="roleName"
          placeholder="Gamer"
          value={formData.roleName}
          onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          placeholder="For gaming enthusiasts"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="requiredRoleIds">Required Role IDs (JSON Array)</Label>
        <Input
          id="requiredRoleIds"
          placeholder='["1234567890"]'
          value={formData.requiredRoleIds}
          onChange={(e) => setFormData({ ...formData, requiredRoleIds: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Users must have one of these roles to get this role
        </p>
      </div>
    </div>
  );
}
