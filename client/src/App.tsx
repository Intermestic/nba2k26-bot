import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Admin from "./pages/Admin";
import Transactions from "./pages/Transactions";
import History from "./pages/History";

import CapCompliance from "./pages/CapCompliance";
import PlayerAliases from "./pages/admin/PlayerAliases";
import TeamAssignments from "./pages/admin/TeamAssignments";
import BotManagement from "./pages/admin/BotManagement";
import MatchLogs from "./pages/MatchLogs";
import FAManagement from "./pages/admin/FAManagement";
import CustomCommands from "./pages/CustomCommands";
import WelcomeGoodbye from "./pages/WelcomeGoodbye";
import ReactionRoles from "./pages/ReactionRoles";
import Analytics from "./pages/Analytics";

import ServerLogs from "./pages/ServerLogs";
import AdminDashboard from "./pages/AdminDashboard";
import UpgradeSummary from "./pages/admin/UpgradeSummary";
import UpgradeHistory from "./pages/admin/UpgradeHistory";
import UpgradeHistoryDashboard from "./pages/admin/UpgradeHistoryDashboard";
import ValidationRules from "./pages/admin/ValidationRules";
import TradeManagement from "./pages/TradeManagement";
import TradeMachine from "./pages/TradeMachine";
import CsvExport from "./pages/admin/CsvExport";
import BotControl from "./pages/admin/BotControl";
import BotLogs from "./pages/admin/BotLogs";
import ScheduledRestarts from "./pages/admin/ScheduledRestarts";
import HealthAlerts from "./pages/admin/HealthAlerts";
import BotActivity from "./pages/admin/BotActivity";
import TradeLog from "./pages/admin/TradeLog";
import UpgradeLog from "./pages/admin/UpgradeLog";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/players"} component={Home} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/upgrade-summary"} component={UpgradeSummary} />
      <Route path={"/admin/upgrade-history"} component={UpgradeHistory} />
      <Route path={"/admin/upgrade-dashboard"} component={UpgradeHistoryDashboard} />
      <Route path={"/admin/validation-rules"} component={ValidationRules} />
      <Route path={"/admin/trades"} component={TradeManagement} />
      <Route path={"/admin/trade-log"} component={TradeLog} />
      <Route path={"/trade-machine"} component={TradeMachine} />
      <Route path={"/admin/roster"} component={Admin} />
      <Route path={"/admin/transactions"} component={Transactions} />
      <Route path={"/admin/history"} component={History} />

      <Route path={"/admin/cap-compliance"} component={CapCompliance} />
      <Route path={"/admin/fa-management"} component={FAManagement} />
      <Route path={"/admin/player-aliases"} component={PlayerAliases} />
      <Route path={"/admin/teams"} component={TeamAssignments} />
      <Route path={"/admin/bot-management"} component={BotManagement} />
      <Route path={"/admin/match-logs"} component={MatchLogs} />

      <Route path={"/admin/custom-commands"} component={CustomCommands} />
      <Route path={"/admin/welcome-goodbye"} component={WelcomeGoodbye} />
      <Route path={"/admin/reaction-roles"} component={ReactionRoles} />
      <Route path={"/admin/analytics"} component={Analytics} />
      <Route path={"/admin/csv-export"} component={CsvExport} />
      <Route path={"/admin/bot-control"} component={BotControl} />
      <Route path={"/admin/bot-logs"} component={BotLogs} />
      <Route path={"/admin/scheduled-restarts"} component={ScheduledRestarts} />
      <Route path={"/admin/health-alerts"} component={HealthAlerts} />
      <Route path={"/admin/bot-activity"} component={BotActivity} />
      <Route path={"/admin/upgrade-log"} component={UpgradeLog} />

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
