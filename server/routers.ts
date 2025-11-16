import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { playerRouter } from "./routers/player";
import { discordRouter } from "./routers/discord";
import { coinsRouter } from "./routers/coins";
import { capViolationsRouter } from "./routers/cap-violations";
import { playerAliasesRouter } from "./routers/player-aliases";
import { teamAssignmentsRouter } from "./routers/team-assignments";
import { matchLogsRouter } from "./routers/match-logs";
import { botManagementRouter } from "./routers/botManagement";
import { customCommandsRouter } from "./routers/customCommands";
import { welcomeGoodbyeRouter } from "./routers/welcomeGoodbye";
import { reactionRolesRouter } from "./routers/reactionRoles";
import { analyticsRouter } from "./routers/analytics";
import { serverLogsRouter } from "./routers/serverLogs";
import { upgradesRouter } from "./routers/upgrades";
import { dashboardRouter } from "./routers/dashboard";

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
  
  // Discord webhook integration
  discord: discordRouter,
  
  // FA coin management
  coins: coinsRouter,
  
  // Cap violation tracking
  capViolations: capViolationsRouter,
  
  // Player name aliases
  playerAliases: playerAliasesRouter,
  
  // Team assignments
  teamAssignments: teamAssignmentsRouter,
  
  // Match logs for fuzzy matching analysis
  matchLogs: matchLogsRouter,
  
  // Bot management and configuration
  botManagement: botManagementRouter,
  
  // Custom commands (MEE6-style)
  customCommands: customCommandsRouter,
  
  // Welcome & Goodbye messages
  welcomeGoodbye: welcomeGoodbyeRouter,
  
  // Reaction roles
  reactionRoles: reactionRolesRouter,
  
  // Analytics
  analytics: analyticsRouter,
  
  // Server logs
  serverLogs: serverLogsRouter,
  
  // Upgrade requests and management
  upgrades: upgradesRouter,
  
  // Dashboard statistics
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
