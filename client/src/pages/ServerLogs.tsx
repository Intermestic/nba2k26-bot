import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  MessageSquare, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Hash,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const EVENT_TYPES = [
  { value: "all", label: "All Events", icon: FileText },
  { value: "message_edit", label: "Message Edits", icon: MessageSquare },
  { value: "message_delete", label: "Message Deletes", icon: Trash2 },
  { value: "member_join", label: "Member Joins", icon: UserPlus },
  { value: "member_leave", label: "Member Leaves", icon: UserMinus },
  { value: "role_add", label: "Role Adds", icon: Shield },
  { value: "role_remove", label: "Role Removes", icon: Shield },
  { value: "kick", label: "Kicks", icon: UserMinus },
  { value: "ban", label: "Bans", icon: UserMinus },
  { value: "timeout", label: "Timeouts", icon: UserMinus },
  { value: "channel_create", label: "Channel Creates", icon: Hash },
  { value: "channel_delete", label: "Channel Deletes", icon: Hash },
  { value: "channel_update", label: "Channel Updates", icon: Hash },
  { value: "nickname_change", label: "Nickname Changes", icon: UserPlus },
  { value: "username_change", label: "Username Changes", icon: UserPlus },
] as const;

const EVENT_COLORS: Record<string, string> = {
  message_edit: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  message_delete: "bg-red-500/10 text-red-500 border-red-500/20",
  member_join: "bg-green-500/10 text-green-500 border-green-500/20",
  member_leave: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  role_add: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  role_remove: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  kick: "bg-red-500/10 text-red-500 border-red-500/20",
  ban: "bg-red-500/10 text-red-500 border-red-500/20",
  timeout: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  channel_create: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  channel_delete: "bg-red-500/10 text-red-500 border-red-500/20",
  channel_update: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  nickname_change: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  username_change: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

export default function ServerLogs() {
  const [eventType, setEventType] = useState<any>("all");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 50;

  const { data: logsData, isLoading } = trpc.serverLogs.getLogs.useQuery({
    limit,
    offset: page * limit,
    eventType,
  });

  const { data: stats } = trpc.serverLogs.getLogStats.useQuery({
    days: 7,
  });

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getEventIcon = (eventType: string) => {
    const event = EVENT_TYPES.find(e => e.value === eventType);
    if (!event || !event.icon) return FileText;
    return event.icon;
  };

  const totalPages = logsData ? Math.ceil(logsData.total / limit) : 0;

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Server Logs</h1>
            <p className="text-muted-foreground mt-1">
              View and search all server events and moderation actions
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && stats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7 mb-6">
            {stats.map((stat) => {
              const EventIcon = getEventIcon(stat.eventType);
              const eventLabel = EVENT_TYPES.find(e => e.value === stat.eventType)?.label || stat.eventType;
              
              return (
                <Card key={stat.eventType}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium truncate">{eventLabel}</CardTitle>
                    <EventIcon className="h-3 w-3 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{stat.count}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter logs by event type or search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Event Logs</CardTitle>
                <CardDescription>
                  {logsData ? `Showing ${page * limit + 1}-${Math.min((page + 1) * limit, logsData.total)} of ${logsData.total} logs` : 'Loading...'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Event Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logsData?.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logsData?.logs.map((log) => {
                    const EventIcon = getEventIcon(log.eventType);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={EVENT_COLORS[log.eventType] || ""}>
                            <EventIcon className="h-3 w-3 mr-1" />
                            {log.eventType.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.username ? (
                            <div>
                              <div className="font-medium">{log.username}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.userId}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.channelName ? (
                            <div>
                              <div className="font-medium">#{log.channelName}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.channelId}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-md">
                            {log.oldValue && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Old: </span>
                                <span className="font-mono">{log.oldValue.substring(0, 100)}{log.oldValue.length > 100 ? '...' : ''}</span>
                              </div>
                            )}
                            {log.newValue && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">New: </span>
                                <span className="font-mono">{log.newValue.substring(0, 100)}{log.newValue.length > 100 ? '...' : ''}</span>
                              </div>
                            )}
                            {log.reason && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Reason: </span>
                                <span>{log.reason}</span>
                              </div>
                            )}
                            {log.moderatorName && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">By: </span>
                                <span className="font-medium">{log.moderatorName}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
