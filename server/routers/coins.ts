import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { teamCoins, faTransactions } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export const coinsRouter = router({
  /**
   * Get all team coin balances (public, read-only)
   */
  getTeamCoins: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get all team coins, ordered by team name
      const coins = await db.select().from(teamCoins).orderBy(teamCoins.team);

      return coins;
    }),

  /**
   * Get all team coin balances (admin only, for management)
   */
  getAllTeamCoins: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get all team coins, ordered by team name
      const coins = await db.select().from(teamCoins).orderBy(teamCoins.team);

      return coins;
    }),

  /**
   * Get transaction history
   */
  getTransactionHistory: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get recent transactions, ordered by date descending
      const transactions = await db
        .select()
        .from(faTransactions)
        .orderBy(desc(faTransactions.processedAt))
        .limit(100);

      return transactions;
    }),

  /**
   * Manually adjust team coins
   */
  adjustCoins: protectedProcedure
    .input(z.object({
      team: z.string(),
      amount: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: { team: string; amount: number; reason?: string } }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Validate team name
      const { isValidTeam } = await import('../team-validator');
      if (!isValidTeam(input.team)) {
        throw new Error(`Invalid team name: ${input.team}. Only the 28 league teams + Free Agents are allowed.`);
      }

      // Get current coins
      const existing = await db.select().from(teamCoins).where(eq(teamCoins.team, input.team));

      if (existing.length === 0) {
        // Initialize if doesn't exist
        const initialCoins = (input.team === 'Nuggets' || input.team === 'Hawks') ? 115 : 100;
        const newCoins = initialCoins + input.amount;

        await db.insert(teamCoins).values({
          team: input.team,
          coinsRemaining: newCoins
        });

        return { success: true, newBalance: newCoins };
      }

      // Update coins
      const currentCoins = existing[0].coinsRemaining;
      const newCoins = currentCoins + input.amount;

      // Prevent negative coins
      if (newCoins < 0) {
        throw new Error("Cannot set coins below 0");
      }

      await db
        .update(teamCoins)
        .set({ coinsRemaining: newCoins })
        .where(eq(teamCoins.team, input.team));

      // Log the adjustment as a transaction
      await db.insert(faTransactions).values({
        team: input.team,
        dropPlayer: "N/A",
        signPlayer: "Manual Adjustment",
        signPlayerOvr: 0,
        bidAmount: input.amount,
        adminUser: ctx.user.name || ctx.user.openId,
        coinsRemaining: newCoins
      });

      return { success: true, newBalance: newCoins };
    }),

  /**
   * Send all back - full rollback (return signed player to FA, restore cut player, refund coins)
   */
  sendAllBack: protectedProcedure
    .input(z.object({
      transactionId: z.number()
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: { transactionId: number } }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get transaction details
      const { players } = await import('../../drizzle/schema');
      const txs = await db.select().from(faTransactions).where(eq(faTransactions.id, input.transactionId));
      
      if (txs.length === 0) {
        throw new Error("Transaction not found");
      }

      const tx = txs[0];
      
      // Normalize team name to handle aliases (Blazers -> Trail Blazers, etc.)
      const { validateTeamName } = await import('../team-validator');
      const normalizedTeam = validateTeamName(tx.team) || tx.team;

      // 1. Return signed player to Free Agents
      const signedPlayers = await db.select().from(players).where(sql`LOWER(${players.name}) = LOWER(${tx.signPlayer})`);
      if (signedPlayers.length > 0) {
        await db.update(players).set({ team: 'Free Agents' }).where(eq(players.id, signedPlayers[0].id));
      }

      // 2. Restore cut player to team
      const cutPlayers = await db.select().from(players).where(sql`LOWER(${players.name}) = LOWER(${tx.dropPlayer})`);
      if (cutPlayers.length > 0) {
        await db.update(players).set({ team: normalizedTeam }).where(eq(players.id, cutPlayers[0].id));
      }

      // 3. Refund coins
      const teamCoinsData = await db.select().from(teamCoins).where(eq(teamCoins.team, normalizedTeam));
      if (teamCoinsData.length > 0) {
        const newBalance = teamCoinsData[0].coinsRemaining + tx.bidAmount;
        await db.update(teamCoins).set({ coinsRemaining: newBalance }).where(eq(teamCoins.team, normalizedTeam));
      }

      // 4. Log reversal
      await db.insert(faTransactions).values({
        team: tx.team,
        dropPlayer: tx.signPlayer,
        signPlayer: tx.dropPlayer,
        signPlayerOvr: 0,
        bidAmount: -tx.bidAmount,
        adminUser: ctx.user.name || ctx.user.openId,
        coinsRemaining: teamCoinsData[0].coinsRemaining + tx.bidAmount
      });

      return { success: true, message: "Transaction fully reversed" };
    }),

  /**
   * Remove signed player only (keep cut player removed, refund coins)
   */
  removeSignedPlayer: protectedProcedure
    .input(z.object({
      transactionId: z.number()
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: { transactionId: number } }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const { players } = await import('../../drizzle/schema');
      const txs = await db.select().from(faTransactions).where(eq(faTransactions.id, input.transactionId));
      
      if (txs.length === 0) {
        throw new Error("Transaction not found");
      }

      const tx = txs[0];
      
      // Normalize team name
      const { validateTeamName } = await import('../team-validator');
      const normalizedTeam = validateTeamName(tx.team) || tx.team;

      // 1. Return signed player to Free Agents
      const signedPlayers = await db.select().from(players).where(sql`LOWER(${players.name}) = LOWER(${tx.signPlayer})`);
      if (signedPlayers.length > 0) {
        await db.update(players).set({ team: 'Free Agents' }).where(eq(players.id, signedPlayers[0].id));
      }

      // 2. Refund coins
      const teamCoinsData = await db.select().from(teamCoins).where(eq(teamCoins.team, normalizedTeam));
      if (teamCoinsData.length > 0) {
        const newBalance = teamCoinsData[0].coinsRemaining + tx.bidAmount;
        await db.update(teamCoins).set({ coinsRemaining: newBalance }).where(eq(teamCoins.team, normalizedTeam));
      }

      // 3. Log action
      await db.insert(faTransactions).values({
        team: tx.team,
        dropPlayer: "N/A",
        signPlayer: `Removed: ${tx.signPlayer}`,
        signPlayerOvr: 0,
        bidAmount: -tx.bidAmount,
        adminUser: ctx.user.name || ctx.user.openId,
        coinsRemaining: teamCoinsData[0].coinsRemaining + tx.bidAmount
      });

      return { success: true, message: "Signed player removed, coins refunded" };
    }),

  /**
   * Re-sign cut player only (restore cut player, keep signed player)
   */
  resignCutPlayer: protectedProcedure
    .input(z.object({
      transactionId: z.number()
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: { transactionId: number } }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const { players } = await import('../../drizzle/schema');
      const txs = await db.select().from(faTransactions).where(eq(faTransactions.id, input.transactionId));
      
      if (txs.length === 0) {
        throw new Error("Transaction not found");
      }

      const tx = txs[0];
      
      // Normalize team name
      const { validateTeamName } = await import('../team-validator');
      const normalizedTeam = validateTeamName(tx.team) || tx.team;

      // Restore cut player to team
      const cutPlayers = await db.select().from(players).where(sql`LOWER(${players.name}) = LOWER(${tx.dropPlayer})`);
      if (cutPlayers.length > 0) {
        await db.update(players).set({ team: normalizedTeam }).where(eq(players.id, cutPlayers[0].id));
      }

      // Log action (no coin change)
      const teamCoinsData = await db.select().from(teamCoins).where(eq(teamCoins.team, normalizedTeam));
      await db.insert(faTransactions).values({
        team: tx.team,
        dropPlayer: "N/A",
        signPlayer: `Restored: ${tx.dropPlayer}`,
        signPlayerOvr: 0,
        bidAmount: 0,
        adminUser: ctx.user.name || ctx.user.openId,
        coinsRemaining: teamCoinsData[0]?.coinsRemaining || 0
      });

      return { success: true, message: "Cut player restored to roster" };
    }),

  /**
   * Return coins only (manual coin refund without roster changes)
   */
  returnCoinsOnly: protectedProcedure
    .input(z.object({
      transactionId: z.number()
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: { transactionId: number } }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const txs = await db.select().from(faTransactions).where(eq(faTransactions.id, input.transactionId));
      
      if (txs.length === 0) {
        throw new Error("Transaction not found");
      }

      const tx = txs[0];
      
      // Normalize team name
      const { validateTeamName } = await import('../team-validator');
      const normalizedTeam = validateTeamName(tx.team) || tx.team;

      // Refund coins only
      const teamCoinsData = await db.select().from(teamCoins).where(eq(teamCoins.team, normalizedTeam));
      if (teamCoinsData.length > 0) {
        const newBalance = teamCoinsData[0].coinsRemaining + tx.bidAmount;
        await db.update(teamCoins).set({ coinsRemaining: newBalance }).where(eq(teamCoins.team, normalizedTeam));
      }

      // Log action
      await db.insert(faTransactions).values({
        team: tx.team,
        dropPlayer: "N/A",
        signPlayer: "Coin Refund Only",
        signPlayerOvr: 0,
        bidAmount: -tx.bidAmount,
        adminUser: ctx.user.name || ctx.user.openId,
        coinsRemaining: teamCoinsData[0].coinsRemaining + tx.bidAmount
      });

      return { success: true, message: "Coins refunded" };
    }),

  /**
   * Get all bid windows
   */
  getBidWindows: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const { bidWindows } = await import('../../drizzle/schema');
      const windows = await db.select().from(bidWindows).orderBy(desc(bidWindows.startTime));

      return windows;
    }),

  /**
   * Get all bids
   */
  getAllBids: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const { faBids } = await import('../../drizzle/schema');
      const bids = await db.select().from(faBids).orderBy(desc(faBids.createdAt));

      return bids;
    }),

});
