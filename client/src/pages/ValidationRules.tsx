import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Save, RefreshCw, Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ValidationRules() {
  const { data: rules = [], isLoading, refetch } = trpc.validationRules.getAll.useQuery();
  const updateRule = trpc.validationRules.update.useMutation();
  const toggleRule = trpc.validationRules.toggle.useMutation();
  const createRule = trpc.validationRules.create.useMutation();
  const deleteRule = trpc.validationRules.delete.useMutation();

  const [editingValues, setEditingValues] = useState<Record<number, number>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    ruleKey: "",
    ruleName: "",
    description: "",
    ruleType: "boolean" as "boolean" | "numeric" | "text",
    enabled: 1,
    numericValue: null as number | null,
    textValue: null as string | null,
  });

  const handleToggle = async (ruleId: number) => {
    try {
      await toggleRule.mutateAsync({ id: ruleId });
      toast.success("Rule updated successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to update rule");
      console.error(error);
    }
  };

  const handleSaveNumeric = async (ruleId: number, value: number) => {
    try {
      await updateRule.mutateAsync({
        id: ruleId,
        numericValue: value,
      });
      toast.success("Rule value updated");
      refetch();
      // Clear editing state
      setEditingValues((prev) => {
        const next = { ...prev };
        delete next[ruleId];
        return next;
      });
    } catch (error) {
      toast.error("Failed to update rule value");
      console.error(error);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.ruleKey || !newRule.ruleName) {
      toast.error("Rule key and name are required");
      return;
    }

    try {
      await createRule.mutateAsync(newRule);
      toast.success("Rule created successfully");
      setCreateDialogOpen(false);
      setNewRule({
        ruleKey: "",
        ruleName: "",
        description: "",
        ruleType: "boolean",
        enabled: 1,
        numericValue: null,
        textValue: null,
      });
      refetch();
    } catch (error) {
      toast.error("Failed to create rule");
      console.error(error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await deleteRule.mutateAsync({ id: ruleId });
      toast.success("Rule deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete rule");
      console.error(error);
    }
  };

  const getRuleIcon = (ruleType: string) => {
    return <Shield className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Validation Rules</h1>
            <p className="text-muted-foreground mt-1">
              Configure upgrade validation rules without code changes
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Validation Rule</DialogTitle>
                <DialogDescription>
                  Add a custom validation rule for upgrade requests
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleKey">Rule Key *</Label>
                  <Input
                    id="ruleKey"
                    placeholder="e.g., max_upgrades_per_week"
                    value={newRule.ruleKey}
                    onChange={(e) => setNewRule({ ...newRule, ruleKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (lowercase, underscores only)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruleName">Rule Name *</Label>
                  <Input
                    id="ruleName"
                    placeholder="e.g., Max Upgrades Per Week"
                    value={newRule.ruleName}
                    onChange={(e) => setNewRule({ ...newRule, ruleName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Explain what this rule does..."
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruleType">Rule Type</Label>
                  <Select
                    value={newRule.ruleType}
                    onValueChange={(value: "boolean" | "numeric" | "text") =>
                      setNewRule({ ...newRule, ruleType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">Boolean (On/Off)</SelectItem>
                      <SelectItem value="numeric">Numeric (Number Value)</SelectItem>
                      <SelectItem value="text">Text (String Value)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newRule.ruleType === "numeric" && (
                  <div className="space-y-2">
                    <Label htmlFor="numericValue">Numeric Value</Label>
                    <Input
                      id="numericValue"
                      type="number"
                      placeholder="e.g., 3"
                      value={newRule.numericValue || ""}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          numericValue: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                )}
                {newRule.ruleType === "text" && (
                  <div className="space-y-2">
                    <Label htmlFor="textValue">Text Value</Label>
                    <Input
                      id="textValue"
                      placeholder="Enter text value"
                      value={newRule.textValue || ""}
                      onChange={(e) =>
                        setNewRule({ ...newRule, textValue: e.target.value || null })
                      }
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>Create Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getRuleIcon(rule.ruleType)}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rule.ruleName}</CardTitle>
                      <CardDescription className="mt-1">
                        {rule.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${rule.id}`} className="text-sm text-muted-foreground">
                        {rule.enabled === 1 ? "Enabled" : "Disabled"}
                      </Label>
                      <Switch
                        id={`toggle-${rule.id}`}
                        checked={rule.enabled === 1}
                        onCheckedChange={() => handleToggle(rule.id)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Numeric Value Editor */}
              {rule.ruleType === "numeric" && (
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`value-${rule.id}`} className="text-sm">
                        Current Value
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          id={`value-${rule.id}`}
                          type="number"
                          value={
                            editingValues[rule.id] !== undefined
                              ? editingValues[rule.id]
                              : rule.numericValue || 0
                          }
                          onChange={(e) =>
                            setEditingValues((prev) => ({
                              ...prev,
                              [rule.id]: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            handleSaveNumeric(
                              rule.id,
                              editingValues[rule.id] !== undefined
                                ? editingValues[rule.id]
                                : rule.numericValue || 0
                            )
                          }
                          disabled={
                            editingValues[rule.id] === undefined ||
                            editingValues[rule.id] === rule.numericValue
                          }
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Rule Key:</span> {rule.ruleKey}
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Boolean Rule Info */}
              {rule.ruleType === "boolean" && (
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Rule Key:</span> {rule.ruleKey}
                  </div>
                </CardContent>
              )}

              {/* Text Rule Display */}
              {rule.ruleType === "text" && (
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Value:</span> {rule.textValue || "Not set"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Rule Key:</span> {rule.ruleKey}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • <strong>Boolean rules</strong> can be toggled on/off with the switch
            </p>
            <p>
              • <strong>Numeric rules</strong> allow you to change threshold values - edit the number and click Save
            </p>
            <p>
              • <strong>Create custom rules</strong> by clicking the "Create Rule" button
            </p>
            <p>
              • Changes take effect immediately for new upgrade requests
            </p>
            <p>
              • Disabled rules will not be checked during validation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
