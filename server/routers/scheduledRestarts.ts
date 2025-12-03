import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc.js";
import { getDb, assertDb } from "../db.js";
import { scheduledRestarts, restartHistory } from "../../drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import cron, { type ScheduledTask } from "node-cron";

// Store active cron job
let activeCronJob: ScheduledTask | null = null;

/**
 * Parse cron expression to human-readable format
 */
function cronToHumanReadable(cronExpression: string, timezone: string): string {
  try {
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) return "Invalid cron expression";
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Simple daily restart format: "0 3 * * *" = "Daily at 3:00 AM"
    if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      const ampm = hourNum >= 12 ? "PM" : "AM";
      const displayHour = hourNum % 12 || 12;
      return `Daily at ${displayHour}:${minuteNum.toString().padStart(2, "0")} ${ampm} (${timezone})`;
    }
    
    return `Custom: ${cronExpression} (${timezone})`;
  } catch (error) {
    return "Invalid cron expression";
  }
}

/**
 * Calculate next execution time from cron expression
 */
function getNextExecutionTime(cronExpression: string): Date | null {
  try {
    const task = cron.schedule(cronExpression, () => {});
    // Get next date - this is a simplified approach
    // In production, you'd use a library like cron-parser
    const now = new Date();
    const [minute, hour] = cronExpression.split(" ");
    const nextRun = new Date(now);
    nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun;
  } catch (error) {
    return null;
  }
}

/**
 * Execute bot restart
 */
async function executeBotRestart(triggeredBy: string = "scheduled"): Promise<{ success: boolean; error?: string }> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    // Get current bot PID
    let pid: number | null = null;
    try {
      const { stdout } = await execAsync("ps aux | grep 'bot-standalone' | grep -v grep | awk '{print $2}'");
      pid = parseInt(stdout.trim());
    } catch (error) {
      // Bot not running
    }
    
    // Stop bot if running
    if (pid && !isNaN(pid)) {
      try {
        await execAsync(`kill -TERM ${pid}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force kill if still running
        try {
          await execAsync(`ps -p ${pid}`);
          await execAsync(`kill -9 ${pid}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          // Process already stopped
        }
      } catch (error) {
        console.error("[Scheduled Restart] Error stopping bot:", error);
      }
    }
    
    // Start bot
    const { spawn } = await import("child_process");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const fs = await import("fs");
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, "../..");
    
    const logsDir = path.join(projectRoot, "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const botLogPath = path.join(logsDir, "bot.log");
    const botErrorPath = path.join(logsDir, "bot-error.log");
    const outLog = fs.openSync(botLogPath, "a");
    const errLog = fs.openSync(botErrorPath, "a");
    
    const child = spawn("pnpm", ["run", "start:bot"], {
      cwd: projectRoot,
      detached: true,
      stdio: ["ignore", outLog, errLog],
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });
    
    child.unref();
    fs.closeSync(outLog);
    fs.closeSync(errLog);
    
    // Wait and verify
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if bot started
    try {
      const { stdout } = await execAsync("ps aux | grep 'bot-standalone' | grep -v grep");
      if (stdout.trim().length === 0) {
        throw new Error("Bot process not found after restart");
      }
    } catch (error) {
      throw new Error("Bot failed to start after restart");
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Start cron job for scheduled restarts
 */
async function startScheduledRestarts() {
  const db = await getDb();
  assertDb(db);
  
  // Get active schedule
  const schedules = await db
    .select()
    .from(scheduledRestarts)
    .where(eq(scheduledRestarts.enabled, 1))
    .limit(1);
  
  if (schedules.length === 0) {
    console.log("[Scheduled Restarts] No active schedule found");
    return;
  }
  
  const schedule = schedules[0];
  
  // Stop existing job if any
  if (activeCronJob) {
    activeCronJob.stop();
    activeCronJob = null;
  }
  
  // Start new cron job
  try {
    activeCronJob = cron.schedule(
      schedule.cronExpression,
      async () => {
        console.log("[Scheduled Restarts] Executing scheduled restart...");
        
        const result = await executeBotRestart("scheduled");
        
        // Log to restart history
        await db.insert(restartHistory).values({
          restartType: "scheduled",
          triggeredBy: "system",
          success: result.success ? 1 : 0,
          errorMessage: result.error,
          uptime: null, // Could calculate this if needed
        });
        
        // Update last executed time
        await db
          .update(scheduledRestarts)
          .set({
            lastExecuted: new Date(),
            nextExecution: getNextExecutionTime(schedule.cronExpression),
          })
          .where(eq(scheduledRestarts.id, schedule.id));
        
        if (result.success) {
          console.log("[Scheduled Restarts] Bot restarted successfully");
        } else {
          console.error("[Scheduled Restarts] Bot restart failed:", result.error);
        }
      },
      {
        timezone: schedule.timezone,
      }
    );
    
    console.log(`[Scheduled Restarts] Cron job started: ${schedule.cronExpression} (${schedule.timezone})`);
  } catch (error) {
    console.error("[Scheduled Restarts] Failed to start cron job:", error);
  }
}

// Initialize scheduled restarts on module load
startScheduledRestarts().catch(console.error);

export const scheduledRestartsRouter = router({
  // Get current schedule configuration
  getSchedule: publicProcedure.query(async () => {
    const db = await getDb();
  assertDb(db);
    
    const schedules = await db
      .select()
      .from(scheduledRestarts)
      .orderBy(desc(scheduledRestarts.createdAt))
      .limit(1);
    
    if (schedules.length === 0) {
      return null;
    }
    
    const schedule = schedules[0];
    
    return {
      ...schedule,
      humanReadable: cronToHumanReadable(schedule.cronExpression, schedule.timezone),
      isActive: activeCronJob !== null && schedule.enabled === 1,
    };
  }),

  // Update schedule configuration
  updateSchedule: publicProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        cronExpression: z.string(),
        timezone: z.string().default("America/New_York"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
  assertDb(db);
      
      // Validate cron expression
      try {
        cron.validate(input.cronExpression);
      } catch (error) {
        throw new Error("Invalid cron expression");
      }
      
      const nextExecution = getNextExecutionTime(input.cronExpression);
      
      // Check if schedule exists
      const existing = await db
        .select()
        .from(scheduledRestarts)
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing
        await db
          .update(scheduledRestarts)
          .set({
            enabled: input.enabled ? 1 : 0,
            cronExpression: input.cronExpression,
            timezone: input.timezone,
            nextExecution,
          })
          .where(eq(scheduledRestarts.id, existing[0].id));
      } else {
        // Create new
        await db.insert(scheduledRestarts).values({
          enabled: input.enabled ? 1 : 0,
          cronExpression: input.cronExpression,
          timezone: input.timezone,
          nextExecution,
        });
      }
      
      // Restart cron job
      await startScheduledRestarts();
      
      return {
        success: true,
        message: "Schedule updated successfully",
        humanReadable: cronToHumanReadable(input.cronExpression, input.timezone),
      };
    }),

  // Get restart history
  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  assertDb(db);
      
      const history = await db
        .select()
        .from(restartHistory)
        .orderBy(desc(restartHistory.createdAt))
        .limit(input.limit);
      
      return history;
    }),

  // Test restart (manual trigger)
  testRestart: publicProcedure.mutation(async () => {
    const db = await getDb();
  assertDb(db);
    
    console.log("[Scheduled Restarts] Manual test restart triggered");
    
    const result = await executeBotRestart("manual");
    
    // Log to restart history
    await db.insert(restartHistory).values({
      restartType: "manual",
      triggeredBy: "admin",
      success: result.success ? 1 : 0,
      errorMessage: result.error,
      uptime: null,
    });
    
    if (!result.success) {
      throw new Error(result.error || "Restart failed");
    }
    
    return {
      success: true,
      message: "Bot restarted successfully",
    };
  }),
});
