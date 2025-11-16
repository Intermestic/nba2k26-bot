import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, Award, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PlayerUpgradeTimelineProps {
  playerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerUpgradeTimeline({
  playerName,
  open,
  onOpenChange,
}: PlayerUpgradeTimelineProps) {
  const { data: upgrades = [], isLoading } = trpc.upgrades.getPlayerUpgrades.useQuery(
    { playerName },
    { enabled: open }
  );

  const { data: allRequests = [] } = trpc.upgrades.getAllUpgrades.useQuery(
    { player: playerName, limit: 100 },
    { enabled: open }
  );

  const approvedCount = allRequests.filter((r) => r.status === "approved").length;
  const pendingCount = allRequests.filter((r) => r.status === "pending").length;
  const uniqueBadges = new Set(upgrades.map((u) => u.badgeName)).size;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "bronze":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "silver":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "gold":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Award className="w-6 h-6" />
            {playerName} - Upgrade Timeline
          </DialogTitle>
        </DialogHeader>

        {/* Player Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Completed Upgrades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upgrades.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Unique Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueBadges}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upgrade History</h3>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : upgrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No completed upgrades yet
            </div>
          ) : (
            <div className="space-y-3">
              {upgrades.map((upgrade, index) => (
                <Card key={upgrade.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < upgrades.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{upgrade.badgeName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {upgrade.completedAt
                                ? format(new Date(upgrade.completedAt), "MMM d, yyyy 'at' h:mm a")
                                : "Date unknown"}
                            </p>
                          </div>
                          {upgrade.gameNumber && (
                            <Badge variant="outline" className="ml-2">
                              Game {upgrade.gameNumber}
                            </Badge>
                          )}
                        </div>

                        {/* Level progression */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className={`capitalize ${getLevelColor(upgrade.fromLevel)}`}
                          >
                            {upgrade.fromLevel}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge
                            variant="outline"
                            className={`capitalize ${getLevelColor(upgrade.toLevel)}`}
                          >
                            {upgrade.toLevel}
                          </Badge>
                        </div>

                        {/* Upgrade type */}
                        <div className="text-sm">
                          <span className="text-muted-foreground">Type: </span>
                          <span className="capitalize">
                            {upgrade.upgradeType.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Requests (including pending/rejected) */}
        {allRequests.length > upgrades.length && (
          <div className="space-y-4 mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold">All Requests</h3>
            <div className="space-y-2">
              {allRequests
                .filter((r) => r.status !== "approved")
                .map((request) => (
                  <Card key={request.id} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{request.badgeName}</span>
                            <Badge
                              variant="outline"
                              className={`capitalize ${getLevelColor(request.fromLevel)}`}
                            >
                              {request.fromLevel}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge
                              variant="outline"
                              className={`capitalize ${getLevelColor(request.toLevel)}`}
                            >
                              {request.toLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.createdAt
                              ? format(new Date(request.createdAt), "MMM d, yyyy")
                              : "Date unknown"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : request.status === "rejected"
                              ? "destructive"
                              : "default"
                          }
                          className="capitalize"
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
