import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { teamAssignments, teamAssignmentHistory } from '../../drizzle/schema';
import { eq, desc, or, like } from 'drizzle-orm';
import { validateTeamName } from '../team-validator';

export const teamAssignmentsRouter = router({
  /**
   * Get all team assignments with optional search
   */
  getAll: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(teamAssignments);

      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        query = query.where(
          or(
            like(teamAssignments.discordUserId, searchTerm),
            like(teamAssignments.discordUsername, searchTerm),
            like(teamAssignments.team, searchTerm)
          )
        ) as any;
      }

      const assignments = await query.orderBy(teamAssignments.team);
      return assignments;
    }),

  /**
   * Add new team assignment
   */
  add: protectedProcedure
    .input(z.object({
      discordUserId: z.string().min(1),
      discordUsername: z.string().optional(),
      team: z.string().min(1),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Validate team name
      const validatedTeam = validateTeamName(input.team);
      if (!validatedTeam) {
        throw new Error(`Invalid team name: ${input.team}`);
      }

      // Check if user already has an assignment
      const existing = await db
        .select()
        .from(teamAssignments)
        .where(eq(teamAssignments.discordUserId, input.discordUserId));

      if (existing.length > 0) {
        throw new Error('User already has a team assignment. Use update instead.');
      }

      // Insert new assignment
      const result = await db.insert(teamAssignments).values({
        discordUserId: input.discordUserId,
        discordUsername: input.discordUsername,
        team: validatedTeam,
      });

      const assignmentId = Number(result[0].insertId);

      // Log the change
      await db.insert(teamAssignmentHistory).values({
        assignmentId,
        discordUserId: input.discordUserId,
        previousTeam: null,
        newTeam: validatedTeam,
        changedBy: ctx.user.id,
        changedByDiscordId: ctx.user.openId,
        reason: input.reason,
      });

      return { success: true, assignmentId };
    }),

  /**
   * Update existing team assignment
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      team: z.string().min(1),
      discordUsername: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Validate team name
      const validatedTeam = validateTeamName(input.team);
      if (!validatedTeam) {
        throw new Error(`Invalid team name: ${input.team}`);
      }

      // Get current assignment
      const current = await db
        .select()
        .from(teamAssignments)
        .where(eq(teamAssignments.id, input.id));

      if (current.length === 0) {
        throw new Error('Team assignment not found');
      }

      const previousTeam = current[0].team;

      // Update assignment
      await db
        .update(teamAssignments)
        .set({
          team: validatedTeam,
          discordUsername: input.discordUsername,
          updatedAt: new Date(),
        })
        .where(eq(teamAssignments.id, input.id));

      // Log the change
      await db.insert(teamAssignmentHistory).values({
        assignmentId: input.id,
        discordUserId: current[0].discordUserId,
        previousTeam,
        newTeam: validatedTeam,
        changedBy: ctx.user.id,
        changedByDiscordId: ctx.user.openId,
        reason: input.reason,
      });

      return { success: true };
    }),

  /**
   * Delete team assignment
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get current assignment
      const current = await db
        .select()
        .from(teamAssignments)
        .where(eq(teamAssignments.id, input.id));

      if (current.length === 0) {
        throw new Error('Team assignment not found');
      }

      // Log the deletion
      await db.insert(teamAssignmentHistory).values({
        assignmentId: input.id,
        discordUserId: current[0].discordUserId,
        previousTeam: current[0].team,
        newTeam: 'DELETED',
        changedBy: ctx.user.id,
        changedByDiscordId: ctx.user.openId,
        reason: input.reason || 'Assignment deleted',
      });

      // Delete assignment
      await db
        .delete(teamAssignments)
        .where(eq(teamAssignments.id, input.id));

      return { success: true };
    }),

  /**
   * Get change history for a specific assignment
   */
  getHistory: protectedProcedure
    .input(z.object({
      discordUserId: z.string().optional(),
      assignmentId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(teamAssignmentHistory);

      if (input.discordUserId) {
        query = query.where(eq(teamAssignmentHistory.discordUserId, input.discordUserId)) as any;
      } else if (input.assignmentId) {
        query = query.where(eq(teamAssignmentHistory.assignmentId, input.assignmentId)) as any;
      }

      const history = await query.orderBy(desc(teamAssignmentHistory.changedAt));
      return history;
    }),

  /**
   * Bulk import team assignments from array
   */
  bulkImport: protectedProcedure
    .input(z.object({
      assignments: z.array(z.object({
        discordUserId: z.string().min(1),
        discordUsername: z.string().optional(),
        team: z.string().min(1),
      })),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const assignment of input.assignments) {
        try {
          // Validate team name
          const validatedTeam = validateTeamName(assignment.team);
          if (!validatedTeam) {
            throw new Error(`Invalid team name: ${assignment.team}`);
          }

          // Check if user already has an assignment
          const existing = await db
            .select()
            .from(teamAssignments)
            .where(eq(teamAssignments.discordUserId, assignment.discordUserId));

          if (existing.length > 0) {
            // Update existing
            const previousTeam = existing[0].team;
            await db
              .update(teamAssignments)
              .set({
                team: validatedTeam,
                discordUsername: assignment.discordUsername,
                updatedAt: new Date(),
              })
              .where(eq(teamAssignments.id, existing[0].id));

            // Log the change
            await db.insert(teamAssignmentHistory).values({
              assignmentId: existing[0].id,
              discordUserId: assignment.discordUserId,
              previousTeam,
              newTeam: validatedTeam,
              changedBy: ctx.user.id,
              changedByDiscordId: ctx.user.openId,
              reason: input.reason || 'Bulk import',
            });
          } else {
            // Insert new
            const result = await db.insert(teamAssignments).values({
              discordUserId: assignment.discordUserId,
              discordUsername: assignment.discordUsername,
              team: validatedTeam,
            });

            const assignmentId = Number(result[0].insertId);

            // Log the change
            await db.insert(teamAssignmentHistory).values({
              assignmentId,
              discordUserId: assignment.discordUserId,
              previousTeam: null,
              newTeam: validatedTeam,
              changedBy: ctx.user.id,
              changedByDiscordId: ctx.user.openId,
              reason: input.reason || 'Bulk import',
            });
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${assignment.discordUserId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errorCount === 0,
        successCount,
        errorCount,
        errors,
      };
    }),
});
