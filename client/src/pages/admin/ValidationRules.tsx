import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ValidationRules() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  const [formData, setFormData] = useState({
    ruleName: "",
    ruleType: "attribute_check" as "game_requirement" | "attribute_check" | "badge_limit" | "cooldown",
    enabled: true,
    config: "",
    errorMessage: "",
    severity: "error" as "error" | "warning",
  });

  // Fetch all validation rules
  const { data: rules = [], isLoading, refetch } = trpc.validationRules.getAll.useQuery();

  // Mutations
  const createMutation = trpc.validationRules.create.useMutation({
    onSuccess: () => {
      toast.success("Validation rule created successfully");
      refetch();
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  const updateMutation = trpc.validationRules.update.useMutation({
    onSuccess: () => {
      toast.success("Validation rule updated successfully");
      refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  const deleteMutation = trpc.validationRules.delete.useMutation({
    onSuccess: () => {
      toast.success("Validation rule deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  const toggleEnabledMutation = trpc.validationRules.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("Rule status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to toggle rule: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      ruleName: "",
      ruleType: "attribute_check",
      enabled: true,
      config: "",
      errorMessage: "",
      severity: "error",
    });
  };

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      enabled: rule.enabled,
      config: rule.config,
      errorMessage: rule.errorMessage || "",
      severity: rule.severity,
    });
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleDelete = (rule: any) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleToggleEnabled = (id: number, enabled: boolean) => {
    toggleEnabledMutation.mutate({ id, enabled });
  };

  const handleSaveCreate = () => {
    createMutation.mutate(formData);
  };

  const handleSaveEdit = () => {
    if (!selectedRule) return;
    updateMutation.mutate({
      id: selectedRule.id,
      ...formData,
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedRule) return;
    deleteMutation.mutate({ id: selectedRule.id });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Validation Rules</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Badge Upgrade Validation Rules</CardTitle>
          <CardDescription>
            Configure rules that govern badge upgrade requests and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading rules...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No validation rules found. Create your first rule to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Error Message</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.ruleName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {rule.ruleType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleEnabled(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.severity === "error" ? "destructive" : "secondary"}>
                        {rule.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                      {rule.errorMessage || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(rule)}
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

      <Card>
        <CardHeader>
          <CardTitle>Current Validation Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Badge Upgrade Window</div>
              <div className="text-2xl font-bold">Open</div>
              <div className="text-sm text-muted-foreground">
                Players can submit upgrade requests
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Approval Mode</div>
              <div className="text-2xl font-bold">Manual</div>
              <div className="text-sm text-muted-foreground">
                All requests require admin approval
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Active Rules</div>
              <div className="text-2xl font-bold">{rules.filter((r) => r.enabled).length}</div>
              <div className="text-sm text-muted-foreground">
                Validation rules currently enforced
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Rules</div>
              <div className="text-2xl font-bold">{rules.length}</div>
              <div className="text-sm text-muted-foreground">
                Rules configured in the system
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Validation Rule</DialogTitle>
            <DialogDescription>
              Add a new validation rule for badge upgrade requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={formData.ruleName}
                onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                placeholder="e.g., max_upgrades_per_window"
              />
            </div>
            <div>
              <Label htmlFor="ruleType">Rule Type</Label>
              <Select
                value={formData.ruleType}
                onValueChange={(value: any) => setFormData({ ...formData, ruleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game_requirement">Game Requirement</SelectItem>
                  <SelectItem value="attribute_check">Attribute Check</SelectItem>
                  <SelectItem value="badge_limit">Badge Limit</SelectItem>
                  <SelectItem value="cooldown">Cooldown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                placeholder='{"maxUpgrades": 6, "windowType": "fa"}'
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="errorMessage">Error Message</Label>
              <Input
                id="errorMessage"
                value={formData.errorMessage}
                onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                placeholder="e.g., Maximum 6 upgrades per FA window"
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error (blocks approval)</SelectItem>
                  <SelectItem value="warning">Warning (allows approval)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCreate}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Validation Rule</DialogTitle>
            <DialogDescription>
              Modify the validation rule configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editRuleName">Rule Name</Label>
              <Input
                id="editRuleName"
                value={formData.ruleName}
                onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editRuleType">Rule Type</Label>
              <Select
                value={formData.ruleType}
                onValueChange={(value: any) => setFormData({ ...formData, ruleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game_requirement">Game Requirement</SelectItem>
                  <SelectItem value="attribute_check">Attribute Check</SelectItem>
                  <SelectItem value="badge_limit">Badge Limit</SelectItem>
                  <SelectItem value="cooldown">Cooldown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editConfig">Configuration (JSON)</Label>
              <Textarea
                id="editConfig"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="editErrorMessage">Error Message</Label>
              <Input
                id="editErrorMessage"
                value={formData.errorMessage}
                onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editSeverity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error (blocks approval)</SelectItem>
                  <SelectItem value="warning">Warning (allows approval)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Validation Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule "{selectedRule?.ruleName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
