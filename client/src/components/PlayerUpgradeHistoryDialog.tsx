import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Award, Filter, AlertTriangle, CheckCircle, User, Users } from "lucide-react";
import { format } from "date-fns";
import type { UpgradeRequest } from "../../../drizzle/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface PlayerUpgradeHistoryDialogProps {
  playerName: string | null;
  open: boolean;
  onClose: () => void;
}

export function PlayerUpgradeHistoryDialog({ playerName, open, onClose }: PlayerUpgradeHistoryDialogProps) {
  const [upgradeTypeFilter, setUpgradeTypeFilter] = useState<string>("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  const { data: upgrades = [], isLoading } = trpc.upgrades.getByPlayer.useQuery(
    { playerName: playerName || "" },
    { enabled: open && !!playerName }
  );

  // Fetch upgrade log for limit tracking
  const { data: upgradeLog = [] } = trpc.upgradeLog.getByPlayer.useQuery(
    { playerName: playerName || "" },
    { enabled: open && !!playerName }
  );

  // Fetch upgrade history grouped by user
  const { data: upgradesByUser = [] } = trpc.upgradeHistory.getPlayerUpgradesByUser.useQuery(
    { playerId: currentPlayer?.id || "" },
    { enabled: open && !!currentPlayer?.id }
  );

  // Fetch player info to check if rookie
  const { data: players = [] } = trpc.player.list.useQuery({ limit: 1000 });
  const currentPlayer = useMemo(() => 
    players.find(p => p.name === playerName),
    [players, playerName]
  );
  const isRookie = currentPlayer?.isRookie === 1;

  if (!playerName) return null;

  // Apply filters
  let filteredUpgrades = upgrades;
  
  // Filter by upgrade type (Badge/Attribute)
  if (upgradeTypeFilter !== "all") {
    filteredUpgrades = filteredUpgrades.filter((u: UpgradeRequest) => 
      u.upgradeType?.toLowerCase() === upgradeTypeFilter.toLowerCase()
    );
  }
  
  // Filter by source type
  if (sourceTypeFilter !== "all") {
    filteredUpgrades = filteredUpgrades.filter((u: UpgradeRequest) => 
      u.sourceType?.toLowerCase() === sourceTypeFilter.toLowerCase()
    );
  }
  
  // Filter by date range
  if (dateFilter !== "all") {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (dateFilter) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    filteredUpgrades = filteredUpgrades.filter((u: UpgradeRequest) => 
      new Date(u.createdAt) >= cutoffDate
    );
  }

  // Calculate statistics (from filtered data)
  const totalUpgrades = filteredUpgrades.length;
  const pendingCount = filteredUpgrades.filter((u: UpgradeRequest) => u.status === "pending").length;
  const approvedCount = filteredUpgrades.filter((u: UpgradeRequest) => u.status === "approved").length;
  const rejectedCount = filteredUpgrades.filter((u: UpgradeRequest) => u.status === "rejected").length;
  const uniqueBadges = new Set(filteredUpgrades.map((u: UpgradeRequest) => u.badgeName)).size;

  // Calculate upgrade limits
  const sevenGameOverallIncrease = useMemo(() => {
    return upgradeLog
      .filter(log => 
        log.sourceType?.toLowerCase().includes('game') && 
        log.upgradeType === 'Attribute'
      )
      .reduce((total, log) => {
        // Parse attribute increases from sourceDetail or toValue
        const increase = parseInt(log.toValue || '0') - parseInt(log.fromValue || '0');
        return total + (isNaN(increase) ? 0 : increase);
      }, 0);
  }, [upgradeLog]);

  const rookieSilverBadgeCount = useMemo(() => {
    if (!isRookie) return 0;
    return upgradeLog
      .filter(log => 
        log.sourceType?.toLowerCase().includes('rookie') &&
        log.upgradeType === 'Badge' &&
        log.fromValue === 'None' &&
        log.toValue === 'Silver'
      )
      .length;
  }, [upgradeLog, isRookie]);

  const OVERALL_CAP = 6;
  const ROOKIE_BADGE_CAP = 2;
  const overallProgress = (sevenGameOverallIncrease / OVERALL_CAP) * 100;
  const rookieBadgeProgress = (rookieSilverBadgeCount / ROOKIE_BADGE_CAP) * 100;
  const overallExceeded = sevenGameOverallIncrease > OVERALL_CAP;
  const rookieBadgeExceeded = rookieSilverBadgeCount > ROOKIE_BADGE_CAP;

  // Get unique source types for filter dropdown
  const uniqueSourceTypes = Array.from(new Set(upgrades.map((u: UpgradeRequest) => u.sourceType).filter(Boolean)));

  // Group by status
  const approvedUpgrades = filteredUpgrades.filter((u: UpgradeRequest) => u.status === "approved");
  const pendingUpgrades = filteredUpgrades.filter((u: UpgradeRequest) => u.status === "pending");
  const rejectedUpgrades = filteredUpgrades.filter((u: UpgradeRequest) => u.status === "rejected");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            {playerName} - Upgrade History
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Complete upgrade timeline and statistics
          </DialogDescription>
        </DialogHeader>

        {/* Filter Controls */}
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Upgrade Type Filter */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Upgrade Type</label>
              <Select value={upgradeTypeFilter} onValueChange={setUpgradeTypeFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="badge">Badge</SelectItem>
                  <SelectItem value="attribute">Attribute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source Type Filter */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Source Type</label>
              <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSourceTypes.map((source) => (
                    <SelectItem key={source} value={source?.toLowerCase() || ""}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Upgrade Limit Tracking */}
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-300">Upgrade Limits</span>
          </div>
          
          {/* 7-Game Overall Cap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">7-Game Overall Increase</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  overallExceeded ? 'text-red-400' : 
                  sevenGameOverallIncrease >= OVERALL_CAP - 1 ? 'text-yellow-400' : 
                  'text-green-400'
                }`}>
                  +{sevenGameOverallIncrease} / +{OVERALL_CAP}
                </span>
                {overallExceeded ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : sevenGameOverallIncrease >= OVERALL_CAP ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : null}
              </div>
            </div>
            <Progress 
              value={Math.min(overallProgress, 100)} 
              className={`h-2 ${
                overallExceeded ? 'bg-red-900/30' : 'bg-slate-600'
              }`}
            />
            {overallExceeded && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Exceeded maximum +6 overall cap!
              </p>
            )}
          </div>

          {/* Rookie Badge Cap */}
          {isRookie && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Rookie Added Badges (Silver)</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    rookieBadgeExceeded ? 'text-red-400' : 
                    rookieSilverBadgeCount >= ROOKIE_BADGE_CAP - 1 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {rookieSilverBadgeCount} / {ROOKIE_BADGE_CAP}
                  </span>
                  {rookieBadgeExceeded ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : rookieSilverBadgeCount >= ROOKIE_BADGE_CAP ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : null}
                </div>
              </div>
              <Progress 
                value={Math.min(rookieBadgeProgress, 100)} 
                className={`h-2 ${
                  rookieBadgeExceeded ? 'bg-red-900/30' : 'bg-slate-600'
                }`}
              />
              {rookieBadgeExceeded && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Exceeded maximum 2 rookie badges to silver!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upgrade History by User */}
        {upgradesByUser.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-300">Upgrades by User</span>
            </div>
            <div className="space-y-3">
              {upgradesByUser.map((userSummary: any) => (
                <div key={userSummary.userId} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-white">{userSummary.userName}</span>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {userSummary.upgradeCount} upgrade{userSummary.upgradeCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {userSummary.upgrades}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="text-2xl font-bold text-white">{totalUpgrades}</div>
            <div className="text-xs text-slate-400">Total Upgrades</div>
          </div>
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-700">
            <div className="text-2xl font-bold text-green-400">{approvedCount}</div>
            <div className="text-xs text-slate-400">Approved</div>
          </div>
          <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-700">
            <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
            <div className="text-xs text-slate-400">Pending</div>
          </div>
          <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
            <div className="text-2xl font-bold text-purple-400">{uniqueBadges}</div>
            <div className="text-xs text-slate-400">Unique Badges</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading upgrade history...</div>
        ) : totalUpgrades === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No upgrades found matching the selected filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Approved Upgrades */}
            {approvedUpgrades.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Approved Upgrades ({approvedCount})
                </h3>
                <div className="space-y-2">
                  {approvedUpgrades.map((upgrade: UpgradeRequest) => (
                    <div
                      key={upgrade.id}
                      className="bg-slate-700/50 border border-green-700/30 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{upgrade.badgeName}</span>
                            <Badge className="bg-green-600 text-white">{upgrade.toLevel}</Badge>
                            {upgrade.upgradeType && (
                              <Badge variant="outline" className="text-xs">
                                {upgrade.upgradeType}
                              </Badge>
                            )}
                            {upgrade.sourceType && (
                              <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-700">
                                {upgrade.sourceType}
                              </Badge>
                            )}
                          </div>
                          {upgrade.attributes && (
                            <div className="text-sm text-slate-300 mb-1">
                              Attributes: {upgrade.attributes}
                            </div>
                          )}
                          {upgrade.ruleViolations && (
                            <div className="text-xs text-yellow-400">
                              ⚠️ {upgrade.ruleViolations}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(upgrade.createdAt), "MMM d, yyyy")}
                          </div>
                          {upgrade.approvedAt && (
                            <div className="text-green-400">
                              Approved {format(new Date(upgrade.approvedAt), "MMM d")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Upgrades */}
            {pendingUpgrades.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Pending Upgrades ({pendingCount})
                </h3>
                <div className="space-y-2">
                  {pendingUpgrades.map((upgrade: UpgradeRequest) => (
                    <div
                      key={upgrade.id}
                      className="bg-slate-700/50 border border-yellow-700/30 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{upgrade.badgeName}</span>
                            <Badge className="bg-yellow-600 text-white">{upgrade.toLevel}</Badge>
                            {upgrade.upgradeType && (
                              <Badge variant="outline" className="text-xs">
                                {upgrade.upgradeType}
                              </Badge>
                            )}
                            {upgrade.sourceType && (
                              <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-700">
                                {upgrade.sourceType}
                              </Badge>
                            )}
                          </div>
                          {upgrade.attributes && (
                            <div className="text-sm text-slate-300 mb-1">
                              Attributes: {upgrade.attributes}
                            </div>
                          )}
                          {upgrade.ruleViolations && (
                            <div className="text-xs text-yellow-400">
                              ⚠️ {upgrade.ruleViolations}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(upgrade.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Upgrades */}
            {rejectedUpgrades.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Rejected Upgrades ({rejectedCount})
                </h3>
                <div className="space-y-2">
                  {rejectedUpgrades.map((upgrade: UpgradeRequest) => (
                    <div
                      key={upgrade.id}
                      className="bg-slate-700/50 border border-red-700/30 rounded-lg p-4 opacity-75"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{upgrade.badgeName}</span>
                            <Badge className="bg-red-600 text-white">{upgrade.toLevel}</Badge>
                            {upgrade.upgradeType && (
                              <Badge variant="outline" className="text-xs">
                                {upgrade.upgradeType}
                              </Badge>
                            )}
                            {upgrade.sourceType && (
                              <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-700">
                                {upgrade.sourceType}
                              </Badge>
                            )}
                          </div>
                          {upgrade.attributes && (
                            <div className="text-sm text-slate-300 mb-1">
                              Attributes: {upgrade.attributes}
                            </div>
                          )}
                          {upgrade.ruleViolations && (
                            <div className="text-xs text-red-400">
                              ❌ {upgrade.ruleViolations}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(upgrade.createdAt), "MMM d, yyyy")}
                          </div>
                          {upgrade.status === "rejected" && upgrade.approvedAt && (
                            <div className="text-red-400">
                              Rejected {format(new Date(upgrade.approvedAt), "MMM d")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
