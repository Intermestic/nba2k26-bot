import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock validation rules for display
const mockRules = [
  {
    ruleKey: "require_match_proof",
    ruleType: "boolean",
    value: true,
    description: "Require screenshot proof for badge upgrade requests",
  },
  {
    ruleKey: "max_upgrades_per_window",
    ruleType: "numeric",
    value: 6,
    description: "Maximum number of badge upgrades allowed per FA window",
  },
  {
    ruleKey: "auto_approve_bronze",
    ruleType: "boolean",
    value: false,
    description: "Automatically approve bronze badge upgrade requests",
  },
  {
    ruleKey: "min_attributes_required",
    ruleType: "numeric",
    value: 3,
    description: "Minimum number of attributes required for upgrade request",
  },
  {
    ruleKey: "allow_duplicate_badges",
    ruleType: "boolean",
    value: false,
    description: "Allow players to have duplicate badges at different tiers",
  },
];

export default function ValidationRules() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Validation Rules</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Badge Upgrade Validation Rules</CardTitle>
          <CardDescription>
            Configure rules that govern badge upgrade requests and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRules.map((rule) => (
                <TableRow key={rule.ruleKey}>
                  <TableCell className="font-medium">{rule.ruleKey}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {rule.ruleType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rule.ruleType === "boolean" ? (
                      <Switch checked={rule.value as boolean} disabled />
                    ) : (
                      <span className="font-mono">{rule.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rule.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <div className="text-2xl font-bold">{mockRules.length}</div>
              <div className="text-sm text-muted-foreground">
                Validation rules currently enforced
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Pending Approvals</div>
              <div className="text-2xl font-bold text-yellow-600">12</div>
              <div className="text-sm text-muted-foreground">
                Requests awaiting review
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
