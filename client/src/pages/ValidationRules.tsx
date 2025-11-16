import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Save, RefreshCw } from "lucide-react";

export default function ValidationRules() {
  const { data: rules = [], isLoading, refetch } = trpc.validationRules.getAll.useQuery();
  const updateRule = trpc.validationRules.update.useMutation();
  const toggleRule = trpc.validationRules.toggle.useMutation();

  const [editingValues, setEditingValues] = useState<Record<number, number>>({});

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
        <div>
          <h1 className="text-3xl font-bold">Validation Rules</h1>
          <p className="text-muted-foreground mt-1">
            Configure upgrade validation rules without code changes
          </p>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getRuleIcon(rule.ruleType)}</div>
                    <div>
                      <CardTitle className="text-lg">{rule.ruleName}</CardTitle>
                      <CardDescription className="mt-1">
                        {rule.description}
                      </CardDescription>
                    </div>
                  </div>
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
                </div>
              </CardHeader>

              {/* Numeric Value Editor */}
              {rule.ruleType === "numeric" && rule.enabled === 1 && (
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
                        {editingValues[rule.id] !== undefined &&
                          editingValues[rule.id] !== rule.numericValue && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSaveNumeric(rule.id, editingValues[rule.id])
                              }
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                          )}
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
              • <strong>Numeric rules</strong> allow you to change threshold values (e.g., +6 limit)
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
