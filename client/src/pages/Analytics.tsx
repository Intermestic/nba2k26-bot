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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mic, Users, TrendingUp, Clock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<number>(7);
  const [topUsersSort, setTopUsersSort] = useState<"messages" | "voice">("messages");
  const [topUsersLimit, setTopUsersLimit] = useState<number>(10);

  const { data: serverStats } = trpc.analytics.getServerStats.useQuery();
  const { data: topUsers } = trpc.analytics.getTopUsers.useQuery({
    limit: topUsersLimit,
    sortBy: topUsersSort,
  });
  const { data: channelActivity } = trpc.analytics.getChannelActivity.useQuery({
    days: timeRange,
  });
  const { data: voiceActivity } = trpc.analytics.getVoiceActivity.useQuery({
    days: timeRange,
  });
  const { data: timeline } = trpc.analytics.getActivityTimeline.useQuery({
    days: timeRange,
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Server Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track server activity, user engagement, and channel statistics
            </p>
          </div>
          <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Total tracked users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(serverStats?.totalMessages || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voice Time</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(serverStats?.totalVoiceMinutes || 0)}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(serverStats?.todayMessages || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Voice</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(serverStats?.todayVoiceMinutes || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Top Users</TabsTrigger>
            <TabsTrigger value="channels">Channel Activity</TabsTrigger>
            <TabsTrigger value="voice">Voice Activity</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Top Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Most Active Users</CardTitle>
                    <CardDescription>
                      Users ranked by activity
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={topUsersSort} onValueChange={(v: any) => setTopUsersSort(v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="messages">By Messages</SelectItem>
                        <SelectItem value="voice">By Voice Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={topUsersLimit.toString()} onValueChange={(v) => setTopUsersLimit(parseInt(v))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">Top 10</SelectItem>
                        <SelectItem value="25">Top 25</SelectItem>
                        <SelectItem value="50">Top 50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Messages</TableHead>
                      <TableHead className="text-right">Voice Time</TableHead>
                      <TableHead className="text-right">Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers?.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.userId}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.messageCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(user.voiceMinutes)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(user.lastActive).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channel Activity Tab */}
          <TabsContent value="channels">
            <Card>
              <CardHeader>
                <CardTitle>Message Activity by Channel</CardTitle>
                <CardDescription>
                  Last {timeRange} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Channel ID</TableHead>
                      <TableHead className="text-right">Total Messages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelActivity?.map((channel) => (
                      <TableRow key={channel.channelId}>
                        <TableCell className="font-medium">
                          {channel.channelName || "Unknown"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {channel.channelId}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {(channel.totalMessages || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Activity Tab */}
          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle>Voice Channel Activity</CardTitle>
                <CardDescription>
                  Last {timeRange} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Channel ID</TableHead>
                      <TableHead className="text-right">Total Time</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voiceActivity?.map((channel) => (
                      <TableRow key={channel.channelId}>
                        <TableCell className="font-medium">
                          {channel.channelName || "Unknown"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {channel.channelId}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatDuration(channel.totalMinutes || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(channel.sessions || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Messages per day for the last {timeRange} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeline?.map((day) => (
                    <div key={day.date} className="flex items-center justify-between py-2 border-b">
                      <div className="font-medium">{day.date}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {(day.messages || 0).toLocaleString()} messages
                        </div>
                        <div
                          className="h-2 bg-primary rounded"
                          style={{
                            width: `${Math.min((day.messages || 0) / Math.max(...(timeline?.map(d => d.messages || 0) || [1])) * 200, 200)}px`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
