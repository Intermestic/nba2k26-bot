import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Image, 
  Trophy, 
  Calendar,
  Users,
  Settings,
  ChevronLeft,
  Home
} from "lucide-react";
import AdminHighlights from "./AdminHighlights";

type AdminModule = "dashboard" | "highlights" | "playoffs" | "awards" | "settings";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeModule, setActiveModule] = useState<AdminModule>("dashboard");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If not logged in, show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin (owner)
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
            <CardDescription>
              Only the site owner can access the admin dashboard. You are logged in as a regular user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Return to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard" as AdminModule, label: "Dashboard", icon: LayoutDashboard },
    { id: "highlights" as AdminModule, label: "Highlight Cards", icon: Image },
    { id: "playoffs" as AdminModule, label: "Playoffs", icon: Trophy },
    { id: "awards" as AdminModule, label: "Awards", icon: Trophy },
    { id: "settings" as AdminModule, label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case "highlights":
        return <AdminHighlights embedded />;
      case "playoffs":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Playoff Management</CardTitle>
              <CardDescription>
                Manage playoff bracket, series, and games from the dedicated playoff bracket page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/playoff-bracket">
                <Button>
                  <Trophy className="w-4 h-4 mr-2" />
                  Go to Playoff Bracket
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      case "awards":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Awards Management</CardTitle>
              <CardDescription>
                Award data is currently managed through code. Future updates will add a UI for managing awards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        );
      case "settings":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>
                Configure site-wide settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveModule("highlights")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Highlight Cards</CardTitle>
                    <CardDescription>Manage homepage & highlights page cards</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveModule("playoffs")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Playoffs</CardTitle>
                    <CardDescription>Manage bracket & game results</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveModule("awards")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Awards</CardTitle>
                    <CardDescription>Manage season awards & voting</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveModule("settings")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Settings</CardTitle>
                    <CardDescription>Site configuration & preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
          </Link>
        </div>
        
        <div className="p-4">
          <h2 className="text-lg font-bold text-gold-400">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground">HoFSN Management</p>
        </div>

        <nav className="flex-1 p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeModule === item.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Logged in as: {user.name || "Admin"}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {activeModule !== "dashboard" && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4"
              onClick={() => setActiveModule("dashboard")}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          
          <h1 className="text-2xl font-bold mb-6">
            {menuItems.find(m => m.id === activeModule)?.label || "Dashboard"}
          </h1>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
