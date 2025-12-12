import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function MatchLogs() {
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');

  const { data: logs, isLoading } = trpc.matchLogs.getAll.useQuery({
    minConfidence: confidenceFilter === 'low' ? 0 : confidenceFilter === 'medium' ? 70 : 0,
    maxConfidence: confidenceFilter === 'low' ? 70 : confidenceFilter === 'medium' ? 90 : 100,
    context: contextFilter === 'all' ? undefined : contextFilter,
  });

  const { data: stats } = trpc.matchLogs.getStats.useQuery();

  const getConfidenceBadge = (score: number | null, success: boolean) => {
    if (!success) return <Badge variant="destructive">Failed</Badge>;
    if (score === null) return <Badge variant="secondary">N/A</Badge>;
    if (score >= 90) return <Badge variant="default" className="bg-green-600">High ({score}%)</Badge>;
    if (score >= 70) return <Badge variant="secondary">Medium ({score}%)</Badge>;
    return <Badge variant="destructive">Low ({score}%)</Badge>;
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Match Logs</h1>
        <p className="text-muted-foreground">
          Review fuzzy matching confidence scores to fine-tune player name matching
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMatches}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgConfidence.toFixed(0)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Low Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lowConfidenceCount}</div>
              <p className="text-xs text-muted-foreground">Below 70%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Match History</CardTitle>
          <CardDescription>
            Filter by confidence score and context to identify matching issues
          </CardDescription>
          <div className="flex gap-4 pt-4">
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="low">Low (&lt; 70%)</SelectItem>
                <SelectItem value="medium">Medium (70-90%)</SelectItem>
                <SelectItem value="high">High (&gt; 90%)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contexts</SelectItem>
                <SelectItem value="trade">Trades</SelectItem>
                <SelectItem value="fa_bid">FA Bids</SelectItem>
                <SelectItem value="fa_batch_validation">FA Validation</SelectItem>
                <SelectItem value="fa_batch_process">FA Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Input Name</TableHead>
                  <TableHead>Matched Name</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Team Filter</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.inputName}</TableCell>
                    <TableCell>{log.matchedName || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>{getConfidenceBadge(log.confidenceScore, log.success)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.strategy}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.context}</Badge>
                    </TableCell>
                    <TableCell>{log.teamFilter || <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No match logs found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
