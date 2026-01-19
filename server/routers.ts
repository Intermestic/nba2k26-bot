import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { playerRouter } from "./routers/player";

import { coinsRouter } from "./routers/coins";

import { playerAliasesRouter } from "./routers/player-aliases";
import { teamAssignmentsRouter } from "./routers/team-assignments";
import { matchLogsRouter } from "./routers/match-logs";




import { analyticsRouter } from "./routers/analytics";


import { dashboardRouter } from "./routers/dashboard";
import { validationRulesRouter } from "./routers/validationRules";
import { tradesRouter } from "./routers/trades";
import { tradeMachineRouter } from "./routers/tradeMachine";
import { tradeLogRouter } from "./routers/tradeLog";
import { csvExportRouter } from "./routes/csvExport";





import { upgradeLogRouter } from "./routers/upgradeLog";
import { playerSwapsRouter } from "./routers/playerSwaps";
import { upgradeComplianceRouter } from './routers/upgradeCompliance';
import { upgradeLimitsRouter } from './routers/upgradeLimits';
import { badgeAdditionsRouter } from './routers/badgeAdditions';
import { upgradeHistoryRouter } from './routers/upgradeHistory';
import { teamAliasesRouter } from './routers/teamAliases';




export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Player router for NBA 2K26 database
  player: playerRouter,
  
  
  // FA coin management
  coins: coinsRouter,
  
  
  // Player name aliases
  playerAliases: playerAliasesRouter,
  
  // Team assignments
  teamAssignments: teamAssignmentsRouter,
  
  // Match logs for fuzzy matching analysis
  matchLogs: matchLogsRouter,
  
  
  
  
  
  // Analytics
  analytics: analyticsRouter,
  
  
  
  // Dashboard statistics
  dashboard: dashboardRouter,
  
  // Validation rules management
  validationRules: validationRulesRouter,
  
  // Trade management
  trades: tradesRouter,
  
  // Trade machine for building and posting trades
  tradeMachine: tradeMachineRouter,
  
  // Trade log for admin review and approval
  tradeLog: tradeLogRouter,
  
  // CSV export with customizable columns
  csvExport: csvExportRouter,
  
  
  
  
  
  // Upgrade log with notes and flags
  upgradeLog: upgradeLogRouter,
  
  // Player swaps tracking for Season 17
  playerSwaps: playerSwapsRouter,
  
  // Upgrade compliance and audit system
  upgradeCompliance: upgradeComplianceRouter,
  
  // Upgrade limits dashboard
  upgradeLimits: upgradeLimitsRouter,
  
  // Badge additions tracking for rookies
  badgeAdditions: badgeAdditionsRouter,
  
  // Upgrade history tracking for audit trail
  upgradeHistory: upgradeHistoryRouter,
  
  // Team aliases management for trade parsing
  teamAliases: teamAliasesRouter,
  
  
   });

export type AppRouter = typeof appRouter;
