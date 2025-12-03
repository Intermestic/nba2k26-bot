// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CsvExport() {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "fullName",
    "team",
    "overall",
  ]);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const exportMutation = trpc.csvExport.generateCsv.useMutation({
    onSuccess: (data) => {
      // Create blob and download
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${data.filename}`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const columnOptions = [
    { id: "fullName", label: "Full Player Name" },
    { id: "firstInitialLastName", label: "First Initial Last Name (e.g., C Flagg)" },
    { id: "team", label: "Team" },
    { id: "overall", label: "Overall Rating" },
    { id: "photoUrl", label: "Photo URL" },
    { id: "playerPageUrl", label: "2K Ratings URL" },
    { id: "height", label: "Height" },
    { id: "isRookie", label: "Rookie Status (Yes/No)" },
    { id: "draftYear", label: "Draft Year" },
    { id: "salaryCap", label: "Salary Cap" },
  ];

  const toggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column");
      return;
    }

    exportMutation.mutate({
      columns: selectedColumns,
      filterType,
      team: selectedTeam || undefined,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">CSV Export</h1>
        <p className="text-slate-400">
          Customize your player data export by selecting columns and filters
        </p>
      </div>

      <div className="grid gap-6">
        {/* Column Selection */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Select Columns</CardTitle>
            <CardDescription>Choose which data fields to include in your CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columnOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedColumns.includes(option.id)}
                    onCheckedChange={() => toggleColumn(option.id)}
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-white"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedColumns(columnOptions.map((o) => o.id))}
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedColumns([])}
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
            <CardDescription>Filter which players to include</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="filterType" className="text-white mb-2 block">
                Player Filter
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger
                  id="filterType"
                  className="bg-slate-700 border-slate-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="rookies">Rookies Only (Class of 2025)</SelectItem>
                  <SelectItem value="team">Specific Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "team" && (
              <div>
                <Label htmlFor="teamSelect" className="text-white mb-2 block">
                  Select Team
                </Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger
                    id="teamSelect"
                    className="bg-slate-700 border-slate-600 text-white"
                  >
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Hawks">Hawks</SelectItem>
                    <SelectItem value="Celtics">Celtics</SelectItem>
                    <SelectItem value="Nets">Nets</SelectItem>
                    <SelectItem value="Hornets">Hornets</SelectItem>
                    <SelectItem value="Bulls">Bulls</SelectItem>
                    <SelectItem value="Cavaliers">Cavaliers</SelectItem>
                    <SelectItem value="Mavs">Mavs</SelectItem>
                    <SelectItem value="Nuggets">Nuggets</SelectItem>
                    <SelectItem value="Pistons">Pistons</SelectItem>
                    <SelectItem value="Warriors">Warriors</SelectItem>
                    <SelectItem value="Rockets">Rockets</SelectItem>
                    <SelectItem value="Grizzlies">Grizzlies</SelectItem>
                    <SelectItem value="Heat">Heat</SelectItem>
                    <SelectItem value="Bucks">Bucks</SelectItem>
                    <SelectItem value="Timberwolves">Timberwolves</SelectItem>
                    <SelectItem value="Pelicans">Pelicans</SelectItem>
                    <SelectItem value="Knicks">Knicks</SelectItem>
                    <SelectItem value="Jazz">Jazz</SelectItem>
                    <SelectItem value="Lakers">Lakers</SelectItem>
                    <SelectItem value="Magic">Magic</SelectItem>
                    <SelectItem value="Trail Blazers">Trail Blazers</SelectItem>
                    <SelectItem value="Sixers">Sixers</SelectItem>
                    <SelectItem value="Suns">Suns</SelectItem>
                    <SelectItem value="Kings">Kings</SelectItem>
                    <SelectItem value="Spurs">Spurs</SelectItem>
                    <SelectItem value="Raptors">Raptors</SelectItem>
                    <SelectItem value="Wizards">Wizards</SelectItem>
                    <SelectItem value="Pacers">Pacers</SelectItem>
                    <SelectItem value="Free Agents">Free Agents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Button */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">
                  {selectedColumns.length} column{selectedColumns.length !== 1 ? "s" : ""} selected
                </p>
                <p className="text-slate-400 text-sm">
                  {filterType === "all"
                    ? "All players"
                    : filterType === "rookies"
                    ? "Rookies only"
                    : selectedTeam
                    ? `${selectedTeam} players`
                    : "Select a team"}
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending || selectedColumns.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {exportMutation.isPending ? (
                  <>
                    <FileDown className="w-4 h-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
