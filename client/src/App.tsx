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
import FAManagement from "./pages/admin/FAManagement";
import FACoins from "./pages/admin/FACoins";
import FAHistory from "./pages/admin/FAHistory";
import FASummary from "./pages/admin/FASummary";
import AdminDashboard from "./pages/AdminDashboard";
import TradeManagement from "./pages/TradeManagement";
import TradeMachine from "./pages/TradeMachine";
import CsvExport from "./pages/admin/CsvExport";

import TradeLog from "./pages/admin/TradeLog";
import TeamAliases from "./pages/admin/TeamAliases";
import TradeParser from "./pages/TradeParser";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/players"} component={Home} />
      <Route path={"/admin"} component={AdminDashboard} />

      <Route path={"/admin/trades"} component={TradeManagement} />
      <Route path={"/admin/trade-log"} component={TradeLog} />
      <Route path={"/trade-machine"} component={TradeMachine} />
      <Route path={"/admin/roster"} component={Admin} />
      <Route path={"/admin/transactions"} component={Transactions} />
      <Route path={"/admin/history"} component={History} />

      <Route path={"/admin/cap-compliance"} component={CapCompliance} />
      <Route path={"/admin/fa-management"} component={FAManagement} />
      <Route path={"/admin/coins"} component={FACoins} />
      <Route path={"/admin/fa-history"} component={FAHistory} />
      <Route path={"/admin/fa-summary"} component={FASummary} />
      <Route path={"/admin/player-aliases"} component={PlayerAliases} />
      <Route path={"/admin/teams"} component={TeamAssignments} />
      <Route path={"/admin/team-assignments"} component={TeamAssignments} />
      <Route path={"/admin/csv-export"} component={CsvExport} />
   <Route path={"/admin/team-aliases"} component={TeamAliases} />
      <Route path={"/trade-parser"} component={TradeParser} />

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
