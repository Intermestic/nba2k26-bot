import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";
import type { UpgradeRequest } from "../../../drizzle/schema";

interface PlayerUpgradeHistoryDialogProps {
  playerName: string | null;
  open: boolean;
  onClose: () => void;
}

export function PlayerUpgradeHistoryDialog({ playerName, open, onClose }: PlayerUpgradeHistoryDialogProps) {
  const { data: upgrades = [], isLoading } = trpc.upgrades.getByPlayer.useQuery(
    { playerName: playerName || "" },
    { enabled: open && !!playerName }
  );

  if (!playerName) return null;

  // Calculate statistics
  const totalUpgrades = upgrades.length;
  const pendingCount = upgrades.filter((u: UpgradeRequest) => u.status === "pending").length;
  const approvedCount = upgrades.filter((u: UpgradeRequest) => u.status === "approved").length;
  const rejectedCount = upgrades.filter((u: UpgradeRequest) => u.status === "rejected").length;
  const uniqueBadges = new Set(upgrades.map((u: UpgradeRequest) => u.badgeName)).size;

  // Group by status
  const approvedUpgrades = upgrades.filter((u: UpgradeRequest) => u.status === "approved");
  const pendingUpgrades = upgrades.filter((u: UpgradeRequest) => u.status === "pending");
  const rejectedUpgrades = upgrades.filter((u: UpgradeRequest) => u.status === "rejected");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            {playerName} - Upgrade History
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Complete upgrade timeline and statistics
          </DialogDescription>
        </DialogHeader>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
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
            <p>No upgrades found for this player</p>
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
