import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LeagueInfo from "./pages/LeagueInfo";
import Season17Hub from "./pages/Season17Hub";
import Season18Hub from "./pages/Season18Hub";
import Recaps from "./pages/Recaps";
import Highlights from "./pages/Highlights";
import Matchups from "./pages/Matchups";
import News from "./pages/News";
import Playoffs from "./pages/Playoffs";
import Awards from "./pages/Awards";
import WizardsTrueEraStory from "./pages/WizardsTrueEraStory";
import MavsJaBrownStory from "./pages/MavsJaBrownStory";
import HornetsDefensiveStory from "./pages/HornetsDefensiveStory";
import Season17WrapUp from "./pages/Season17WrapUp";
import PlayerProfile from "./pages/PlayerProfile";
import RaptorsPacersSeries from "./pages/RaptorsPacersSeries";
import JazzNuggetsSeries from "./pages/JazzNuggetsSeries";
import KingsBullsSeries from "./pages/KingsBullsSeries";
import CavsRocketsGame1 from "./pages/CavsRocketsGame1";
import CavsRocketsSeries from "./pages/CavsRocketsSeries";
import WizardsBlazersSeries from "./pages/WizardsBlazersSeries";
import BucksSpursSeries from "./pages/BucksSpursSeries";
import HawksHornetsSeries from "./pages/HawksHornetsSeries";
import PistonsMavsSeries from "./pages/PistonsMavsSeries";
import BucksRaptorsSeries from "./pages/BucksRaptorsSeries";
import RecentGames from "./pages/RecentGames";

import Season17Awards from "./pages/Season17Awards";
import PlayoffBracketPage from "./pages/PlayoffBracketPage";
import AdminHighlights from "./pages/AdminHighlights";
import AdminDashboard from "./pages/AdminDashboard";


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/league-info"} component={LeagueInfo} />
      <Route path={"/season17-hub"} component={Season17Hub} />
      <Route path={"/season18-hub"} component={Season18Hub} />
      <Route path={"/playoff-bracket"} component={PlayoffBracketPage} />
      <Route path={"/404"} component={NotFound} />
      <Route path="/highlights" component={Highlights} />
      <Route path="/matchups" component={Matchups} />
      <Route path="/news" component={News} />
      <Route path="/playoffs" component={Playoffs} />
      <Route path="/awards" component={Awards} />
      <Route path="/wizards-trae-era-story" component={WizardsTrueEraStory} />
      <Route path="/mavs-ja-brown-story" component={MavsJaBrownStory} />
      <Route path="/hornets-defensive-story" component={HornetsDefensiveStory} />
      <Route path="/season17-wrapup" component={Season17WrapUp} />
      <Route path="/recent-games" component={RecentGames} />
      <Route path="/player/:slug" component={PlayerProfile} />
      <Route path="/playoffs/raptors-pacers-series" component={RaptorsPacersSeries} />
      <Route path="/playoffs/jazz-nuggets-series" component={JazzNuggetsSeries} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/highlights">{() => <AdminHighlights />}</Route>
      <Route path="/playoffs/kings-bulls-series" component={KingsBullsSeries} />
      <Route path="/playoffs/cavs-rockets-game1" component={CavsRocketsGame1} />
      <Route path="/playoffs/cavs-rockets-series" component={CavsRocketsSeries} />
      <Route path="/playoffs/wizards-blazers-series" component={WizardsBlazersSeries} />
      <Route path="/playoffs/bucks-spurs-series" component={BucksSpursSeries} />
      <Route path="/playoffs/hawks-hornets-series" component={HawksHornetsSeries} />
      <Route path="/playoffs/pistons-mavs-series" component={PistonsMavsSeries} />
      <Route path="/playoffs/bucks-raptors-series" component={BucksRaptorsSeries} />
      
      {/* Dynamic route for CSV-generated series pages */}
      <Route path="/series/:seriesSlug">
        {(params) => {
          // Dynamically import series component based on slug
          const seriesSlug = params.seriesSlug;
          try {
            // Convert slug to component name (e.g., "bucks-spurs" -> "BucksSpursSeries")
            const componentName = seriesSlug
              .split('-')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join('') + 'Series';
            
            // Try to dynamically import the component
            const Component = require(`./pages/${componentName}.tsx`).default;
            return <Component />;
          } catch (error) {
            console.error(`Failed to load series component for ${seriesSlug}:`, error);
            return <NotFound />;
          }
        }}
      </Route>

      <Route path="/season17-awards" component={Season17Awards} />
      <Route path="/season17-all-hof-teams" component={Season17Awards} />

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
