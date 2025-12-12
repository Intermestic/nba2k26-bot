import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, RefreshCw, Trash2, AlertCircle, Info, AlertTriangle, Bug } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BotLogs() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [level, setLevel] = useState<"info" | "warn" | "error" | "debug" | undefined>();
  const [eventType, setEventType] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: logsData, isLoading, refetch } = trpc.botLogs.getLogs.useQuery({
    page,
    pageSize,
    level,
    eventType,
    search: search || undefined,
  });

  const { data: eventTypes } = trpc.botLogs.getEventTypes.useQuery();
  const { data: stats } = trpc.botLogs.getStats.useQuery();

  const deleteOldLogsMutation = trpc.botLogs.deleteOldLogs.useMutation({
    onSuccess: () => {
      toast.success("Old logs deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete logs: ${error.message}`);
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setLevel(undefined);
    setEventType(undefined);
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleDeleteOldLogs = () => {
    if (confirm("Delete logs older than 30 days?")) {
      deleteOldLogsMutation.mutate({ daysToKeep: 30 });
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4" />;
      case "debug":
        return <Bug className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "destructive";
      case "warn":
        return "default";
      case "debug":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot Activity Logs</h1>
        <p className="text-muted-foreground">
          View Discord bot commands, errors, and events
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.errorCount24h}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Warnings (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byLevel.warn || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Info (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byLevel.info || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter logs by level, event type, or search text</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Level</label>
              <Select value={level || "all"} onValueChange={(v) => setLevel(v === "all" ? undefined : v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={eventType || "all"} onValueChange={(v) => setEventType(v === "all" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {eventTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search message, username, or command..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteOldLogs}
              disabled={deleteOldLogsMutation.isPending}
            >
              {deleteOldLogsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Old Logs (30+ days)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            {logsData && `Showing ${logsData.logs.length} of ${logsData.total} logs`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logsData && logsData.logs.length > 0 ? (
            <>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {logsData.logs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelColor(log.level) as any} className="flex items-center gap-1">
                            {getLevelIcon(log.level)}
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{log.eventType}</Badge>
                          {log.commandName && (
                            <Badge variant="secondary">{log.commandName}</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </span>
                      </div>

                      <p className="text-sm mb-2">{log.message}</p>

                      {(log.username || log.userId) && (
                        <div className="text-xs text-muted-foreground mb-1">
                          User: {log.username || "Unknown"} {log.userId && `(${log.userId})`}
                        </div>
                      )}

                      {log.channelId && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Channel ID: {log.channelId}
                        </div>
                      )}

                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {log.details}
                          </pre>
                        </details>
                      )}

                      {log.errorStack && (
                        <details className="mt-2">
                          <summary className="text-xs text-destructive cursor-pointer hover:text-destructive/80">
                            View Stack Trace
                          </summary>
                          <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded overflow-x-auto text-destructive">
                            {log.errorStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {logsData.page} of {logsData.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= logsData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No logs found. Try adjusting your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
