import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Transactions from "./pages/Transactions";
import History from "./pages/History";
import DiscordIntegration from "./pages/DiscordIntegration";
import CoinDashboard from "./pages/CoinDashboard";
import CapCompliance from "./pages/CapCompliance";
import FAHistory from "./pages/FAHistory";
import PlayerAliases from "./pages/admin/PlayerAliases";
import TeamAssignments from "./pages/admin/TeamAssignments";
import BotManagement from "./pages/admin/BotManagement";
import MatchLogs from "./pages/MatchLogs";
import FAWindowSummary from "./pages/FAWindowSummary";
import FAMonitor from "./pages/FAMonitor";
import CustomCommands from "./pages/CustomCommands";
import WelcomeGoodbye from "./pages/WelcomeGoodbye";
import ReactionRoles from "./pages/ReactionRoles";
import Analytics from "./pages/Analytics";
import ServerLogs from "./pages/ServerLogs";
import AdminDashboard from "./pages/AdminDashboard";
import UpgradeSummary from "./pages/admin/UpgradeSummary";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/upgrade-summary"} component={UpgradeSummary} />
      <Route path={"/admin/roster"} component={Admin} />
      <Route path={"/admin/transactions"} component={Transactions} />
      <Route path={"/admin/history"} component={History} />
      <Route path={"/admin/discord"} component={DiscordIntegration} />
      <Route path={"/admin/coins"} component={CoinDashboard} />
      <Route path={"/admin/cap-compliance"} component={CapCompliance} />
      <Route path={"/admin/fa-history"} component={FAHistory} />
      <Route path={"/admin/player-aliases"} component={PlayerAliases} />
      <Route path={"/admin/teams"} component={TeamAssignments} />
      <Route path={"/admin/bot-management"} component={BotManagement} />
      <Route path={"/admin/match-logs"} component={MatchLogs} />
      <Route path={"/admin/fa-summary"} component={FAWindowSummary} />
      <Route path={"/admin/fa-monitor"} component={FAMonitor} />
      <Route path={"/admin/custom-commands"} component={CustomCommands} />
      <Route path={"/admin/welcome-goodbye"} component={WelcomeGoodbye} />
      <Route path={"/admin/reaction-roles"} component={ReactionRoles} />
      <Route path={"/admin/analytics"} component={Analytics} />
      <Route path={"/admin/logs"} component={ServerLogs} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
