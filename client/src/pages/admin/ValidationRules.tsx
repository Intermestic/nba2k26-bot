import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Settings, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function ValidationRules() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch all validation rules
  const { data: rules = [], isLoading, refetch } = trpc.validationRules.getAll.useQuery();

  // Toggle enabled mutation
  const toggleEnabledMutation = trpc.validationRules.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("Rule status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to toggle rule: ${error.message}`);
    },
  });

  const handleToggleEnabled = (id: number, enabled: number) => {
    toggleEnabledMutation.mutate({ id, enabled });
  };

  // Get unique upgrade types
  const upgradeTypes = ["all", ...Array.from(new Set(rules.map(r => r.ruleType)))];

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.ruleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || rule.ruleType === selectedType;
    return matchesSearch && matchesType;
  });

  // Group rules by upgrade type
  const groupedRules = filteredRules.reduce((acc, rule) => {
    if (!acc[rule.ruleType]) {
      acc[rule.ruleType] = [];
    }
    acc[rule.ruleType].push(rule);
    return acc;
  }, {} as Record<string, typeof rules>);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Validation Rules</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upgrade Validation Rules</CardTitle>
          <CardDescription>
            Comprehensive rules governing all upgrade types: Global, Welcome, 5-Game Badge, 7-Game Attribute, Rookie, OG, Superstar Pack, and Activity Bonus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              {upgradeTypes.map(type => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading rules...</div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No validation rules found matching your search.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRules).map(([upgradeType, typeRules]) => (
                <div key={upgradeType}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {upgradeType}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({typeRules.length} rules)
                    </span>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Category</TableHead>
                        <TableHead>Rule Description</TableHead>
                        <TableHead className="w-[100px]">Enabled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typeRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {rule.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {rule.description}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.enabled === 1}
                              onCheckedChange={(checked) => handleToggleEnabled(rule.id, checked ? 1 : 0)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation System Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Rules</div>
              <div className="text-2xl font-bold">{rules.length}</div>
              <div className="text-sm text-muted-foreground">
                All validation rules
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Active Rules</div>
              <div className="text-2xl font-bold">{rules.filter((r) => r.enabled === 1).length}</div>
              <div className="text-sm text-muted-foreground">
                Currently enforced
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Upgrade Types</div>
              <div className="text-2xl font-bold">{upgradeTypes.length - 1}</div>
              <div className="text-sm text-muted-foreground">
                Different categories
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Approval Mode</div>
              <div className="text-2xl font-bold">Manual</div>
              <div className="text-sm text-muted-foreground">
                Admin review required
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
