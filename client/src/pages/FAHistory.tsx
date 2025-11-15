import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface FATransaction {
  id: number;
  team: string;
  dropPlayer: string;
  signPlayer: string;
  signPlayerOvr: number | null;
  bidAmount: number;
  adminUser: string | null;
  coinsRemaining: number;
  processedAt: string;
  batchId: string | null;
  rolledBack: boolean;
  rolledBackAt: string | null;
  rolledBackBy: string | null;
  previousTeam: string | null;
}

export default function FAHistory() {
  const [transactions, setTransactions] = useState<FATransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FATransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [playerFilter, setPlayerFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, rolled-back
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [transactions, teamFilter, playerFilter, batchFilter, statusFilter]);
  
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/fa-transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter(t => t.team === teamFilter);
    }
    
    // Player filter (search in both sign and drop player)
    if (playerFilter) {
      const search = playerFilter.toLowerCase();
      filtered = filtered.filter(t => 
        t.signPlayer.toLowerCase().includes(search) || 
        t.dropPlayer.toLowerCase().includes(search)
      );
    }
    
    // Batch filter
    if (batchFilter) {
      filtered = filtered.filter(t => t.batchId?.includes(batchFilter));
    }
    
    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(t => !t.rolledBack);
    } else if (statusFilter === 'rolled-back') {
      filtered = filtered.filter(t => t.rolledBack);
    }
    
    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const exportToCSV = () => {
    const headers = [
      'ID', 'Team', 'Drop Player', 'Sign Player', 'OVR', 'Bid Amount', 
      'Coins Remaining', 'Processed By', 'Processed At', 'Batch ID', 
      'Rolled Back', 'Rolled Back At', 'Rolled Back By', 'Previous Team'
    ];
    
    const rows = filteredTransactions.map(t => [
      t.id,
      t.team,
      t.dropPlayer,
      t.signPlayer,
      t.signPlayerOvr || 'N/A',
      t.bidAmount,
      t.coinsRemaining,
      t.adminUser || 'N/A',
      new Date(t.processedAt).toLocaleString(),
      t.batchId || 'N/A',
      t.rolledBack ? 'Yes' : 'No',
      t.rolledBackAt ? new Date(t.rolledBackAt).toLocaleString() : 'N/A',
      t.rolledBackBy || 'N/A',
      t.previousTeam || 'N/A'
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fa-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Transaction history exported to CSV');
  };
  
  // Get unique teams for filter dropdown
  const teams = Array.from(new Set(transactions.map(t => t.team))).sort();
  
  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading transaction history...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>FA Transaction History</CardTitle>
          <CardDescription>
            View and export all free agent transactions processed by the bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Team</label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Player</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search player..."
                  value={playerFilter}
                  onChange={(e) => setPlayerFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Batch ID</label>
              <Input
                placeholder="Filter by batch..."
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="rolled-back">Rolled Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Export Button */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
            </p>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>
          
          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Sign Player</TableHead>
                  <TableHead>OVR</TableHead>
                  <TableHead>Bid</TableHead>
                  <TableHead>Coins Left</TableHead>
                  <TableHead>Processed At</TableHead>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className={transaction.rolledBack ? 'opacity-50' : ''}>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell className="font-medium">{transaction.team}</TableCell>
                      <TableCell>{transaction.signPlayer}</TableCell>
                      <TableCell>{transaction.signPlayerOvr || 'N/A'}</TableCell>
                      <TableCell>${transaction.bidAmount}</TableCell>
                      <TableCell>${transaction.coinsRemaining}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(transaction.processedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {transaction.batchId ? transaction.batchId.substring(0, 20) + '...' : 'Manual'}
                      </TableCell>
                      <TableCell>
                        {transaction.rolledBack ? (
                          <span className="text-red-500 text-sm">Rolled Back</span>
                        ) : (
                          <span className="text-green-500 text-sm">Active</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
