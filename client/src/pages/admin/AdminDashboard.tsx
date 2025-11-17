import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Shield, Users, Coins, AlertTriangle, History, TrendingUp, MessageSquare, Bot, Command, Smile, MousePointer, BarChart, FileText, Award, Settings, Activity, Hash, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch dashboard statistics
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery(undefined, {
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  // Redirect if not admin
  if (isAuthenticated && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-slate-400 mb-4">You must be logged in as an admin to access this page.</p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper to get badge color based on stat type and value
  const getBadgeColor = (statKey: string, value: number): string => {
    if (statKey === "capViolations" && value > 0) return "bg-red-500 text-white hover:bg-red-600";
    if (statKey === "pendingUpgrades") {
      if (value > 10) return "bg-red-500 text-white hover:bg-red-600";
      if (value >= 6) return "bg-yellow-500 text-black hover:bg-yellow-600";
      if (value > 0) return "bg-green-500 text-white hover:bg-green-600";
    }
    if (statKey === "activeBids") {
      if (value > 20) return "bg-green-500 text-white hover:bg-green-600";
      if (value >= 11) return "bg-yellow-500 text-black hover:bg-yellow-600";
    }
    return "bg-slate-600 text-white hover:bg-slate-700";
  };

  const tools = [
    // Team Management Section
    {
      section: "Team Management",
      description: "Manage team rosters and assignments",
      items: [
        {
          title: "Team Assignments",
          description: "Assign Discord users to teams",
          icon: Users,
          href: "/admin/teams",
          statKey: "totalAssignments" as const,
        },
        {
          title: "Team Management",
          description: "Assign players to teams and manage rosters",
          icon: Shield,
          href: "/admin/roster",
          statKey: "totalPlayers" as const,
        },
        {
          title: "Cap Compliance",
          description: "Monitor salary cap violations",
          icon: AlertTriangle,
          href: "/admin/cap-compliance",
          statKey: "capViolations" as const,
        },
        {
          title: "Bulk Transactions",
          description: "Process multiple player assignments",
          icon: Zap,
          href: "/admin/transactions",
        },
      ],
    },
    // Free Agency Section
    {
      section: "Free Agency",
      description: "Manage FA bids, coins, and transactions",
      items: [
        {
          title: "FA Coins",
          description: "Manage team FA coins and reversals",
          icon: Coins,
          href: "/admin/coins",
        },
        {
          title: "FA History",
          description: "View all free agency transactions and bids",
          icon: History,
          href: "/admin/fa-history",
          statKey: "totalTransactions" as const,
        },
        {
          title: "FA Window Summary",
          description: "Generate and process FA window close summaries",
          icon: TrendingUp,
          href: "/admin/fa-summary",
          statKey: "activeBids" as const,
        },
        {
          title: "FA Monitor",
          description: "Real-time monitoring of active FA bids",
          icon: Activity,
          href: "/admin/fa-monitor",
          statKey: "activeBids" as const,
        },
        {
          title: "Transaction History",
          description: "View all player movement history",
          icon: FileText,
          href: "/admin/history",
          statKey: "totalTransactions" as const,
        },
      ],
    },
    // System Admin Section
    {
      section: "System Admin",
      description: "Bot configuration and system management",
      items: [

        {
          title: "Player Aliases",
          description: "Manage player name aliases",
          icon: Hash,
          href: "/admin/player-aliases",
        },
        {
          title: "Bot Management",
          description: "Configure Discord bot settings",
          icon: Bot,
          href: "/admin/bot-management",
        },
        {
          title: "Custom Commands",
          description: "Create custom Discord commands",
          icon: Command,
          href: "/admin/custom-commands",
        },
        {
          title: "Welcome & Goodbye",
          description: "Configure welcome/goodbye messages",
          icon: Smile,
          href: "/admin/welcome-goodbye",
        },
        {
          title: "Reaction Roles",
          description: "Set up reaction role panels",
          icon: MousePointer,
          href: "/admin/reaction-roles",
        },
        {
          title: "Analytics",
          description: "View server activity and statistics",
          icon: BarChart,
          href: "/admin/analytics",
        },
        {
          title: "Server Logs",
          description: "View server event logs",
          icon: FileText,
          href: "/admin/logs",
        },

        {
          title: "Match Logs",
          description: "View fuzzy matching logs",
          icon: Activity,
          href: "/admin/match-logs",
        },
        {
          title: "Discord Integration",
          description: "Configure webhooks and auto-updates",
          icon: MessageSquare,
          href: "/admin/discord",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-16 w-auto" />
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">Manage all league operations</p>
              </div>
            </div>
            <Button asChild variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
              <Link href="/">
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {tools.map((section) => (
          <div key={section.section} className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{section.section}</h2>
              <p className="text-slate-400">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {section.items.map((tool) => {
                const Icon = tool.icon;
                const statValue = tool.statKey && stats ? stats[tool.statKey] : undefined;
                const showBadge = statValue !== undefined && statValue > 0;

                return (
                  <Link key={tool.href} href={tool.href}>
                    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <Icon className="w-8 h-8 text-blue-400 mb-2" />
                          {isLoading ? (
                            <Skeleton className="h-6 w-12 rounded-full" />
                          ) : (
                            showBadge && (
                              <Badge className={getBadgeColor(tool.statKey!, statValue)}>
                                {statValue}
                              </Badge>
                            )
                          )}
                        </div>
                        <CardTitle className="text-white">{tool.title}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {tool.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
