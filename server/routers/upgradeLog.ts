import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { upgradeLog } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

export const upgradeLogRouter = router({
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const upgrades = await db.select().from(upgradeLog);
    return upgrades;
  }),

  updateNotes: publicProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().nullable(),
      })
    )
    .mutation(async ({ input }: { input: { id: number; notes: string | null } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(upgradeLog)
        .set({ notes: input.notes, updatedAt: new Date() })
        .where(eq(upgradeLog.id, input.id));

      return { success: true };
    }),

  toggleFlag: publicProcedure
    .input(
      z.object({
        id: z.number(),
        flagged: z.boolean(),
        flagReason: z.string().nullable(),
      })
    )
    .mutation(async ({ input }: { input: { id: number; flagged: boolean; flagReason: string | null } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(upgradeLog)
        .set({
          flagged: input.flagged ? 1 : 0,
          flagReason: input.flagReason,
          updatedAt: new Date(),
        })
        .where(eq(upgradeLog.id, input.id));

      return { success: true };
    }),
});
