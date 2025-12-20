import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Settings, 
  MessageSquare,
  BarChart3,
  Shield,
  Award,
  CheckCircle,
  AlertTriangle,
  Database,
  Zap,
  ArrowLeftRight,
  Cloud,
  FileDown,
  Power,
  ScrollText,
  Clock,
  Heart,
  ShieldCheck,
  RotateCcw,
  Edit
} from "lucide-react";

interface AdminTool {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  section: "team" | "freeagency" | "system";
  statKey?: keyof DashboardStats;
}

interface DashboardStats {
  pendingUpgrades: number;
  activeBids: number;
  capViolations: number;
  totalPlayers: number;
  totalTeams: number;
  totalTransactions: number;
  totalAssignments: number;
}

/**
 * Get badge color based on stat type and value
 * Red = urgent/critical, Yellow = warning, Green = normal
 */
function getBadgeColor(statKey: keyof DashboardStats, value: number): string {
  switch (statKey) {
    case 'capViolations':
      // Any cap violations are critical
      return value > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-700 text-white';
    
    case 'pendingUpgrades':
      // Many pending upgrades need attention
      if (value > 10) return 'bg-red-600 text-white hover:bg-red-700';
      if (value > 5) return 'bg-yellow-600 text-white hover:bg-yellow-700';
      return 'bg-green-600 text-white hover:bg-green-700';
    
    case 'activeBids':
      // High activity is good (green)
      if (value > 20) return 'bg-green-600 text-white hover:bg-green-700';
      if (value > 10) return 'bg-yellow-600 text-white hover:bg-yellow-700';
      return 'bg-slate-700 text-white';
    
    default:
      // Default neutral color for informational stats
      return 'bg-slate-700 text-white';
  }
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery(undefined, {
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  const tools: AdminTool[] = [
    // Team Management Section
    {
      title: "Team Assignments",
      description: "Assign Discord users to teams",
      href: "/admin/teams",
      icon: <Shield className="w-6 h-6" />,
      color: "bg-blue-500",
      section: "team",
      statKey: "totalAssignments"
    },
    {
      title: "Team Management",
      description: "Assign players to teams and manage rosters",
      href: "/admin/roster",
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-600",
      section: "team",
      statKey: "totalPlayers"
    },

    {
      title: "Trade Management",
      description: "View, approve, reject, and reverse trades",
      href: "/admin/trades",
      icon: <ArrowLeftRight className="w-6 h-6" />,
      color: "bg-emerald-500",
      section: "team"
    },
    {
      title: "Trade Log Review",
      description: "Review and approve trades from Trade Machine",
      href: "/admin/trade-log",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-teal-600",
      section: "team"
    },
    
    // Free Agency Section
    {
      title: "FA Coins",
      description: "Manage team FA coins and transaction reversals",
      href: "/admin/coins",
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-yellow-500",
      section: "freeagency"
    },
    {
      title: "FA History",
      description: "View all free agency transactions and bids",
      href: "/admin/fa-history",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-indigo-500",
      section: "freeagency"
    },
    {
      title: "FA Window Summary",
      description: "Generate and process FA window close summaries",
      href: "/admin/fa-summary",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-teal-500",
      section: "freeagency",
      statKey: "activeBids"
    },
    {
      title: "FA Monitor",
      description: "Real-time monitoring of active FA bids",
      href: "/admin/fa-monitor",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-cyan-500",
      section: "freeagency",
      statKey: "activeBids"
    },
    {
      title: "Transaction History",
      description: "View all player movement history",
      href: "/admin/history",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-green-600",
      section: "freeagency",
      statKey: "totalTransactions"
    },
    
    // System Admin Section
    {
      title: "Player Aliases",
      description: "Manage player name aliases for fuzzy matching",
      href: "/admin/player-aliases",
      icon: <Users className="w-6 h-6" />,
      color: "bg-orange-500",
      section: "system"
    },
    {
      title: "Team Aliases",
      description: "Manage team name aliases for trade parsing",
      href: "/admin/team-aliases",
      icon: <Shield className="w-6 h-6" />,
      color: "bg-cyan-500",
      section: "system"
    },

    {
      title: "CSV Export",
      description: "Export player data with customizable columns",
      href: "/admin/csv-export",
      icon: <FileDown className="w-6 h-6" />,
      color: "bg-green-500",
      section: "system"
    },
    {
      title: "Bot Status Monitor",
      description: "Monitor bot health and control Discord bot",
      href: "/admin/bot-status",
      icon: <Power className="w-6 h-6" />,
      color: "bg-red-500",
      section: "system"
    },
    {
      title: "Bot Dashboard",
      description: "View uptime, command stats, and health metrics",
      href: "/admin/bot-dashboard",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-purple-500",
      section: "system"
    },
    {
      title: "Monitoring Alerts",
      description: "Configure Discord webhook notifications for bot offline",
      href: "/admin/monitoring-alerts",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "bg-orange-500",
      section: "system"
    },


  ];

  const sections = [
    { id: "team" as const, title: "Team Management", description: "Manage teams, rosters, and salary cap compliance" },
    { id: "freeagency" as const, title: "Free Agency", description: "Monitor and manage free agency bidding and transactions" },
    { id: "system" as const, title: "System Admin", description: "Configure bot settings, upgrades, and system features" }
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
                <p className="text-sm text-slate-400 mt-1">Welcome back, {user?.name || 'Admin'}</p>
              </div>
            </div>
            <Link href="/">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {sections.map((section) => {
          const sectionTools = tools.filter(tool => tool.section === section.id);
          
          return (
            <div key={section.id} className="mb-12">
              {/* Section Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{section.title}</h2>
                <p className="text-slate-400">{section.description}</p>
              </div>

              {/* Tool Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sectionTools.map((tool) => (
                  <Link key={tool.href} href={tool.href}>
                    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-all hover:scale-105 cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className={`${tool.color} p-3 rounded-lg`}>
                            {tool.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-white text-lg">{tool.title}</CardTitle>
                              {tool.statKey && (
                                <div>
                                  {isLoading ? (
                                    <Skeleton className="h-6 w-8 rounded-full" />
                                  ) : (
                                    stats && stats[tool.statKey] > 0 && (
                                      <Badge 
                                        variant="secondary" 
                                        className={getBadgeColor(tool.statKey, stats[tool.statKey])}
                                      >
                                        {stats[tool.statKey]}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-slate-400">
                          {tool.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
