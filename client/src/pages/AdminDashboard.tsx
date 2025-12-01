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
  ShieldCheck
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
      title: "Cap Compliance",
      description: "Monitor salary cap violations and alerts",
      href: "/admin/cap-compliance",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "bg-red-500",
      section: "team",
      statKey: "capViolations"
    },
    {
      title: "Bulk Transactions",
      description: "Process multiple player assignments at once",
      href: "/admin/transactions",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-purple-500",
      section: "team"
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
      title: "Upgrade Requests",
      description: "Review and approve pending badge upgrades",
      href: "/admin/upgrade-summary",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-green-500",
      section: "system",
      statKey: "pendingUpgrades"
    },
    {
      title: "Player Aliases",
      description: "Manage player name aliases for fuzzy matching",
      href: "/admin/player-aliases",
      icon: <Users className="w-6 h-6" />,
      color: "bg-orange-500",
      section: "system"
    },
    {
      title: "Bot Management",
      description: "Configure Discord bot settings and commands",
      href: "/admin/bot-management",
      icon: <Settings className="w-6 h-6" />,
      color: "bg-gray-500",
      section: "system"
    },
    {
      title: "Custom Commands",
      description: "Create and manage custom Discord commands",
      href: "/admin/custom-commands",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "bg-violet-500",
      section: "system"
    },
    {
      title: "Welcome & Goodbye",
      description: "Configure welcome and goodbye messages",
      href: "/admin/welcome-goodbye",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "bg-lime-500",
      section: "system"
    },
    {
      title: "Reaction Roles",
      description: "Set up reaction role panels",
      href: "/admin/reaction-roles",
      icon: <Award className="w-6 h-6" />,
      color: "bg-emerald-500",
      section: "system"
    },
    {
      title: "Analytics",
      description: "View server activity and user statistics",
      href: "/admin/analytics",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-sky-500",
      section: "system"
    },
    {
      title: "Server Logs",
      description: "View comprehensive server event logs",
      href: "/admin/logs",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-slate-500",
      section: "system"
    },

    {
      title: "Upgrade Log",
      description: "Track player badge and attribute upgrades with notes and flags",
      href: "/admin/upgrade-log",
      icon: <ScrollText className="w-6 h-6" />,
      color: "bg-amber-500",
      section: "system"
    },
    {
      title: "Upgrade Log Dashboard",
      description: "View complete history and statistics of all player upgrades from all sources",
      href: "/admin/upgrade-log-dashboard",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-indigo-500",
      section: "system"
    },
    {
      title: "Validation Rules",
      description: "Configure upgrade validation rules",
      href: "/admin/validation-rules",
      icon: <Settings className="w-6 h-6" />,
      color: "bg-rose-500",
      section: "system"
    },
    {
      title: "Upgrade Compliance",
      description: "Audit and validate all player upgrades against official rules",
      href: "/admin/upgrade-compliance",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "bg-purple-500",
      section: "system"
    },
    {
      title: "Player Upgrade Progress",
      description: "Track all player upgrades and monitor progress toward limits (7GM, Welcome, 5GM, Rookie, OG, etc.)",
      href: "/admin/upgrade-limits",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "bg-orange-500",
      section: "system"
    },
    {
      title: "Badge Additions Tracking",
      description: "View rookie badge additions and silver upgrade usage",
      href: "/admin/badge-additions",
      icon: <Award className="w-6 h-6" />,
      color: "bg-yellow-500",
      section: "system"
    },
    {
      title: "Match Logs",
      description: "View fuzzy matching logs for debugging",
      href: "/admin/match-logs",
      icon: <Database className="w-6 h-6" />,
      color: "bg-gray-500",
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
      title: "Bot Control",
      description: "Start, stop, and restart the Discord bot",
      href: "/admin/bot-control",
      icon: <Power className="w-6 h-6" />,
      color: "bg-red-500",
      section: "system"
    },
    {
      title: "Bot Activity Logs",
      description: "View Discord bot commands, errors, and events",
      href: "/admin/bot-logs",
      icon: <ScrollText className="w-6 h-6" />,
      color: "bg-purple-500",
      section: "system"
    },
    {
      title: "Scheduled Restarts",
      description: "Configure automatic bot restarts for stability",
      href: "/admin/scheduled-restarts",
      icon: <Clock className="w-6 h-6" />,
      color: "bg-indigo-500",
      section: "system"
    },
    {
      title: "Health Alerts",
      description: "Monitor bot health and receive Discord alerts",
      href: "/admin/health-alerts",
      icon: <Heart className="w-6 h-6" />,
      color: "bg-pink-500",
      section: "system"
    },
    {
      title: "Bot Activity Dashboard",
      description: "View command usage statistics and performance metrics",
      href: "/admin/bot-activity",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-cyan-500",
      section: "system"
    },
    {
      title: "Player Swaps",
      description: "Track DNA swaps and player replacements for Season 17",
      href: "/admin/player-swaps",
      icon: <ArrowLeftRight className="w-6 h-6" />,
      color: "bg-amber-500",
      section: "team"
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
