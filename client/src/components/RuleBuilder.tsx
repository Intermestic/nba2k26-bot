import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wand2 } from "lucide-react";

interface RuleBuilderProps {
  ruleType: "game_requirement" | "attribute_check" | "badge_limit" | "cooldown";
  config: string;
  onChange: (config: string) => void;
}

export default function RuleBuilder({ ruleType, config, onChange }: RuleBuilderProps) {
  const [parsedConfig, setParsedConfig] = useState<any>({});
  const [viewMode, setViewMode] = useState<"builder" | "json">("builder");

  // Parse config on mount and when it changes
  useEffect(() => {
    try {
      const parsed = config ? JSON.parse(config) : {};
      setParsedConfig(parsed);
    } catch (error) {
      console.error("Failed to parse config:", error);
      setParsedConfig({});
    }
  }, [config]);

  // Update config when parsed config changes
  const updateConfig = (updates: any) => {
    const newConfig = { ...parsedConfig, ...updates };
    setParsedConfig(newConfig);
    onChange(JSON.stringify(newConfig, null, 2));
  };

  return (
    <div className="space-y-4">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">
            <Wand2 className="w-4 h-4 mr-2" />
            Visual Builder
          </TabsTrigger>
          <TabsTrigger value="json">JSON Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4 mt-4">
          {ruleType === "badge_limit" && <BadgeLimitBuilder config={parsedConfig} onChange={updateConfig} />}
          {ruleType === "cooldown" && <CooldownBuilder config={parsedConfig} onChange={updateConfig} />}
          {ruleType === "attribute_check" && <AttributeCheckBuilder config={parsedConfig} onChange={updateConfig} />}
          {ruleType === "game_requirement" && <GameRequirementBuilder config={parsedConfig} onChange={updateConfig} />}
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">JSON Configuration</CardTitle>
              <CardDescription>Edit the raw JSON configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-48 p-3 font-mono text-sm border rounded-md bg-slate-950 text-slate-100"
                value={config}
                onChange={(e) => onChange(e.target.value)}
                placeholder="{}"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Live Preview */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="outline">Preview</Badge>
            Configuration Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono text-slate-300 overflow-auto max-h-32">
            {JSON.stringify(parsedConfig, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

// Badge Limit Builder
function BadgeLimitBuilder({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Badge Limit Configuration</CardTitle>
        <CardDescription>Configure badge upgrade limits and restrictions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Maximum Upgrades Per Window</Label>
          <Input
            type="number"
            value={config.maxUpgrades || ""}
            onChange={(e) => onChange({ maxUpgrades: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 6"
          />
          <p className="text-xs text-muted-foreground">Maximum number of badge upgrades allowed per FA window</p>
        </div>

        <div className="space-y-2">
          <Label>Window Type</Label>
          <Select value={config.windowType || "fa"} onValueChange={(value) => onChange({ windowType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fa">Free Agency Window</SelectItem>
              <SelectItem value="trade">Trade Window</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label>Allow Duplicate Badges</Label>
            <p className="text-xs text-muted-foreground">Allow same badge at different tiers</p>
          </div>
          <Switch
            checked={config.allowDuplicates || false}
            onCheckedChange={(checked) => onChange({ allowDuplicates: checked })}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label>Auto-Approve Bronze Badges</Label>
            <p className="text-xs text-muted-foreground">Automatically approve bronze tier badges</p>
          </div>
          <Switch
            checked={config.autoApprove || false}
            onCheckedChange={(checked) => onChange({ autoApprove: checked, tier: "bronze" })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Cooldown Builder
function CooldownBuilder({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cooldown Configuration</CardTitle>
        <CardDescription>Configure waiting periods between upgrades</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Cooldown Period (Hours)</Label>
          <Input
            type="number"
            value={config.cooldownHours || ""}
            onChange={(e) => onChange({ cooldownHours: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 24"
          />
          <p className="text-xs text-muted-foreground">
            Hours to wait between upgrade requests
            {config.cooldownHours && ` (${config.cooldownHours} hours = ${Math.floor(config.cooldownHours / 24)} days)`}
          </p>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label>Per Player</Label>
            <p className="text-xs text-muted-foreground">Apply cooldown separately for each player</p>
          </div>
          <Switch
            checked={config.perPlayer !== false}
            onCheckedChange={(checked) => onChange({ perPlayer: checked })}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label>Per Team</Label>
            <p className="text-xs text-muted-foreground">Apply cooldown to entire team</p>
          </div>
          <Switch
            checked={config.perTeam || false}
            onCheckedChange={(checked) => onChange({ perTeam: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Attribute Check Builder
function AttributeCheckBuilder({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Attribute Check Configuration</CardTitle>
        <CardDescription>Configure attribute validation requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Minimum Attributes Required</Label>
          <Input
            type="number"
            value={config.minAttributes || ""}
            onChange={(e) => onChange({ minAttributes: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 3"
          />
          <p className="text-xs text-muted-foreground">Minimum number of attributes that must be specified</p>
        </div>

        <div className="space-y-2">
          <Label>Maximum Attributes Allowed</Label>
          <Input
            type="number"
            value={config.maxAttributes || ""}
            onChange={(e) => onChange({ maxAttributes: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 5"
          />
          <p className="text-xs text-muted-foreground">Maximum number of attributes allowed (0 = unlimited)</p>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label>Require All Badge Attributes</Label>
            <p className="text-xs text-muted-foreground">Require all attributes defined in badge requirements</p>
          </div>
          <Switch
            checked={config.requireAll || false}
            onCheckedChange={(checked) => onChange({ requireAll: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Game Requirement Builder
function GameRequirementBuilder({ config, onChange }: { config: any; onChange: (updates: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Game Requirement Configuration</CardTitle>
        <CardDescription>Configure game-related validation requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label>Require Screenshot Proof</Label>
            <p className="text-xs text-muted-foreground">Require screenshot/proof for badge upgrades</p>
          </div>
          <Switch
            checked={config.requireScreenshot || false}
            onCheckedChange={(checked) => onChange({ requireScreenshot: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Minimum Games Required</Label>
          <Input
            type="number"
            value={config.minGames || ""}
            onChange={(e) => onChange({ minGames: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 5"
          />
          <p className="text-xs text-muted-foreground">Minimum number of games before upgrades allowed</p>
        </div>

        <div className="space-y-2">
          <Label>Game Requirement Type</Label>
          <Select value={config.gameType || "5GM"} onValueChange={(value) => onChange({ gameType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5GM">5 Games (Standard)</SelectItem>
              <SelectItem value="7GM">7 Games (Elite Badges)</SelectItem>
              <SelectItem value="Rookie">Rookie Exception</SelectItem>
              <SelectItem value="OG">Original Gangster Exception</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
