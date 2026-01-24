import { z } from "zod";
import { eq, like, and, gte } from "drizzle-orm";
import { players, transactionHistory } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { fuzzySearchPlayers, searchPlayersCombined } from "../utils/fuzzySearch";


export const playerRouter = router({
  // Debug: Check owner status
  checkOwner: protectedProcedure.query(async ({ ctx }) => {
    const ownerOpenId = ENV.ownerOpenId;
    const userOpenId = ctx.user?.openId;
    const processEnvOwner = process.env.OWNER_OPEN_ID;
    
    console.log('[CHECK_OWNER]', {
      'ENV.ownerOpenId': ownerOpenId,
      'process.env.OWNER_OPEN_ID': processEnvOwner,
      'userOpenId': userOpenId,
      'match': userOpenId === ownerOpenId
    });
    
    return {
      isOwner: userOpenId === ownerOpenId,
      userOpenId: userOpenId,
      ownerOpenId: ownerOpenId,
      processEnvOwner: processEnvOwner,
      userName: ctx.user?.name,
      userRole: ctx.user?.role,
      message: userOpenId === ownerOpenId 
        ? "You are the project owner" 
        : `Not owner. Your OpenID: ${userOpenId}, Expected: ${ownerOpenId} (process.env: ${processEnvOwner})`
    };
  }),

  // Public: List all players with optional filters
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        minRating: z.number().min(0).max(99).optional(),
        limit: z.number().min(1).max(1000).default(1000),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input?.search) {
        conditions.push(like(players.name, `%${input.search}%`));
      }
      if (input?.minRating !== undefined) {
        conditions.push(gte(players.overall, input.minRating));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      try {
        const result = await db
          .select()
          .from(players)
          .where(whereClause)
          .limit(input?.limit || 1000)
          .offset(input?.offset || 0);

        console.log('[player.list] Query successful, returned', result.length, 'players');
        return result;
      } catch (error: any) {
        console.error('[player.list] Query failed:', error);
        console.error('[player.list] Error details:', {
          message: error.message,
          code: error.code,
          errno: error.errno,
          sql: error.sql
        });
        throw error;
      }
    }),

  // Public: Get single player by ID
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(players)
        .where(eq(players.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Protected: Update player (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        overall: z.number().min(0).max(99).optional(),
        team: z.string().nullable().optional(),
        photoUrl: z.string().nullable().optional(),
        playerPageUrl: z.string().nullable().optional(),
        badgeCount: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // Validate team name if team is being updated
      if (updateData.team !== undefined && updateData.team !== null) {
        const { validateTeamName } = await import('../team-validator');
        const validatedTeam = validateTeamName(updateData.team);
        if (!validatedTeam) {
          throw new Error(`Invalid team name: ${updateData.team}. Must be one of the 28 valid teams or Free Agents.`);
        }
        updateData.team = validatedTeam;
      }

      await db
        .update(players)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(players.id, id));

      return { success: true };
    }),

  // Protected: Create new player (admin only)
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        overall: z.number().min(0).max(99),
        team: z.string().optional(),
        photoUrl: z.string().nullable().optional(),
        playerPageUrl: z.string().nullable().optional(),
        nbaId: z.string().nullable().optional(),
        source: z.string().optional(),
        badgeCount: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(players).values(input);

      return { success: true };
    }),

  // Protected: Update player team (admin only)
  updateTeam: protectedProcedure
    .input(
      z.object({
        playerId: z.string(),
        team: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Validate team name
      const { validateTeamName } = await import('../team-validator');
      const validatedTeam = validateTeamName(input.team);
      if (!validatedTeam) {
        throw new Error(`Invalid team name: ${input.team}. Must be one of the 28 valid teams or Free Agents.`);
      }

      // Get current player data before update
      const [player] = await db
        .select()
        .from(players)
        .where(eq(players.id, input.playerId))
        .limit(1);

      if (!player) {
        throw new Error("Player not found");
      }

      // Update player team
      await db
        .update(players)
        .set({
          team: validatedTeam,
          updatedAt: new Date(),
        })
        .where(eq(players.id, input.playerId));

      // Log transaction
      await db.insert(transactionHistory).values({
        playerId: player.id,
        playerName: player.name,
        fromTeam: player.team || null,
        toTeam: validatedTeam,
        adminId: ctx.user?.id || null,
        adminName: ctx.user?.name || "Unknown",
        transactionType: player.team ? "trade" : "signing",
      });

      // Discord auto-update removed - bot functionality cleaned up

      return { success: true };
    }),

  // Protected: Delete player (admin only with confirmation)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(players).where(eq(players.id, input.id));

      return { success: true };
    }),

  // Protected: Get transaction history (admin only)
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(100),
        playerId: z.string().optional(),
        team: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build where conditions
      const conditions = [];
      if (input.playerId) {
        conditions.push(eq(transactionHistory.playerId, input.playerId));
      }
      if (input.team) {
        // Match either fromTeam or toTeam
        conditions.push(
          and(
            like(transactionHistory.fromTeam, `%${input.team}%`),
            like(transactionHistory.toTeam, `%${input.team}%`)
          )
        );
      }

      const transactions = await db
        .select()
        .from(transactionHistory)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(transactionHistory.createdAt)
        .limit(input.limit);

      return transactions.reverse(); // Most recent first
    }),

  // Fuzzy search with typo tolerance
  fuzzySearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const allPlayers = await db.select().from(players);
        
        const results = fuzzySearchPlayers(
          input.query,
          allPlayers.map(p => ({
            id: parseInt(p.id) || 0,
            name: p.name,
            overall: p.overall,
            team: p.team,
            photo_url: p.photoUrl,
            player_page_url: p.playerPageUrl,
          })),
          input.limit
        );

        return results;
      } catch (error: any) {
        console.error('[player.fuzzySearch] Query failed:', error);
        throw error;
      }
    }),

  // Advanced search with filters
  advancedSearch: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        team: z.string().optional(),
        minRating: z.number().min(0).max(99).optional(),
        maxRating: z.number().min(0).max(99).optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const allPlayers = await db.select().from(players);
        
        const results = searchPlayersCombined(
          input.query || "",
          input.team,
          input.minRating,
          input.maxRating,
          allPlayers.map(p => ({
            id: parseInt(p.id) || 0,
            name: p.name,
            overall: p.overall,
            team: p.team,
            photo_url: p.photoUrl,
            player_page_url: p.playerPageUrl,
          }))
        );

        return results.slice(0, input.limit);
      } catch (error: any) {
        console.error('[player.advancedSearch] Query failed:', error);
        throw error;
      }
    }),
});
