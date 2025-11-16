import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Zap
} from "lucide-react";

interface AdminTool {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  section: "team" | "freeagency" | "system";
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const tools: AdminTool[] = [
    // Team Management Section
    {
      title: "Team Assignments",
      description: "Assign Discord users to teams",
      href: "/admin/teams",
      icon: <Shield className="w-6 h-6" />,
      color: "bg-blue-500",
      section: "team"
    },
    {
      title: "Team Management",
      description: "Assign players to teams and manage rosters",
      href: "/admin/roster",
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-600",
      section: "team"
    },
    {
      title: "Cap Compliance",
      description: "Monitor salary cap violations and alerts",
      href: "/admin/cap",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "bg-red-500",
      section: "team"
    },
    {
      title: "Bulk Transactions",
      description: "Process multiple player assignments at once",
      href: "/admin/transactions",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-purple-500",
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
      section: "freeagency"
    },
    {
      title: "FA Monitor",
      description: "Real-time monitoring of active FA bids",
      href: "/admin/fa-monitor",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-cyan-500",
      section: "freeagency"
    },
    {
      title: "Transaction History",
      description: "View all player movement history",
      href: "/admin/history",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-green-600",
      section: "freeagency"
    },
    
    // System Admin Section
    {
      title: "Upgrade Requests",
      description: "Review and approve pending badge upgrades",
      href: "/admin/upgrade-summary",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-green-500",
      section: "system"
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
      title: "Upgrade History",
      description: "View all badge upgrade requests and approvals",
      href: "/admin/upgrade-history",
      icon: <Database className="w-6 h-6" />,
      color: "bg-fuchsia-500",
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
      title: "Match Logs",
      description: "View fuzzy matching logs for debugging",
      href: "/admin/match-logs",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-amber-500",
      section: "system"
    },
    {
      title: "Discord Integration",
      description: "Configure Discord webhook and auto-updates",
      href: "/admin/discord",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "bg-blue-600",
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
                            <CardTitle className="text-white text-lg">{tool.title}</CardTitle>
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
