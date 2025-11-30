import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc.js";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

// Store bot process info in memory
let botProcess: {
  pid: number | null;
  startTime: Date | null;
} = {
  pid: null,
  startTime: null,
};

// Check if bot process is running
async function isBotRunning(): Promise<boolean> {
  try {
    // Check for bot-standalone process
    const { stdout } = await execAsync("ps aux | grep 'bot-standalone' | grep -v grep");
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Get bot process ID
async function getBotPid(): Promise<number | null> {
  try {
    const { stdout } = await execAsync("ps aux | grep 'bot-standalone' | grep -v grep | awk '{print $2}'");
    const pid = parseInt(stdout.trim());
    return isNaN(pid) ? null : pid;
  } catch (error) {
    return null;
  }
}

// Get bot uptime in seconds
async function getBotUptime(): Promise<number | null> {
  try {
    const pid = await getBotPid();
    if (!pid) return null;
    
    // Get process start time using ps
    const { stdout } = await execAsync(`ps -p ${pid} -o etimes=`);
    const seconds = parseInt(stdout.trim());
    return isNaN(seconds) ? null : seconds;
  } catch (error) {
    return null;
  }
}

// Get bot username from Discord client
async function getBotUsername(): Promise<string | null> {
  // This would require accessing the Discord client instance
  // For now, return null - can be enhanced later
  return null;
}

export const botControlRouter = router({
  // Get bot status
  getStatus: publicProcedure.query(async () => {
    const isRunning = await isBotRunning();
    const pid = await getBotPid();
    const uptime = await getBotUptime();
    const username = await getBotUsername();

    return {
      isOnline: isRunning,
      processId: pid,
      uptime: uptime,
      botUsername: username,
      lastStarted: botProcess.startTime?.toISOString() || null,
    };
  }),

  // Start bot
  start: publicProcedure.mutation(async () => {
    const isRunning = await isBotRunning();
    
    if (isRunning) {
      throw new Error("Bot is already running");
    }

    try {
      console.log("[Bot Control] Starting bot process...");
      
      // Start bot in detached mode so it survives after this process
      const child = spawn("pnpm", ["run", "start:bot"], {
        cwd: projectRoot,
        detached: true,
        stdio: "ignore",
        env: {
          ...process.env,
          NODE_ENV: "production",
        },
      });

      // Detach the child process
      child.unref();

      // Wait a bit to verify it started
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isNowRunning = await isBotRunning();
      if (!isNowRunning) {
        throw new Error("Bot process failed to start");
      }

      const pid = await getBotPid();
      botProcess = {
        pid: pid,
        startTime: new Date(),
      };

      console.log(`[Bot Control] Bot started successfully (PID: ${pid})`);
      
      return {
        success: true,
        message: "Bot started successfully",
        pid: pid,
      };
    } catch (error) {
      console.error("[Bot Control] Failed to start bot:", error);
      throw new Error(`Failed to start bot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  // Stop bot
  stop: publicProcedure.mutation(async () => {
    const isRunning = await isBotRunning();
    
    if (!isRunning) {
      throw new Error("Bot is not running");
    }

    try {
      const pid = await getBotPid();
      if (!pid) {
        throw new Error("Could not find bot process ID");
      }

      console.log(`[Bot Control] Stopping bot process (PID: ${pid})...`);
      
      // Send SIGTERM for graceful shutdown
      await execAsync(`kill -TERM ${pid}`);
      
      // Wait for process to stop
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isStillRunning = await isBotRunning();
      if (isStillRunning) {
        // Force kill if still running
        console.log("[Bot Control] Bot didn't stop gracefully, forcing...");
        await execAsync(`kill -9 ${pid}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      botProcess = {
        pid: null,
        startTime: null,
      };

      console.log("[Bot Control] Bot stopped successfully");
      
      return {
        success: true,
        message: "Bot stopped successfully",
      };
    } catch (error) {
      console.error("[Bot Control] Failed to stop bot:", error);
      throw new Error(`Failed to stop bot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  // Restart bot
  restart: publicProcedure.mutation(async () => {
    const isRunning = await isBotRunning();
    
    if (!isRunning) {
      throw new Error("Bot is not running - use Start instead");
    }

    try {
      console.log("[Bot Control] Restarting bot...");
      
      // Stop the bot
      const pid = await getBotPid();
      if (pid) {
        await execAsync(`kill -TERM ${pid}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const isStillRunning = await isBotRunning();
        if (isStillRunning) {
          await execAsync(`kill -9 ${pid}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Start the bot
      const child = spawn("pnpm", ["run", "start:bot"], {
        cwd: projectRoot,
        detached: true,
        stdio: "ignore",
        env: {
          ...process.env,
          NODE_ENV: "production",
        },
      });

      child.unref();

      // Wait and verify
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isNowRunning = await isBotRunning();
      if (!isNowRunning) {
        throw new Error("Bot process failed to restart");
      }

      const newPid = await getBotPid();
      botProcess = {
        pid: newPid,
        startTime: new Date(),
      };

      console.log(`[Bot Control] Bot restarted successfully (PID: ${newPid})`);
      
      return {
        success: true,
        message: "Bot restarted successfully",
        pid: newPid,
      };
    } catch (error) {
      console.error("[Bot Control] Failed to restart bot:", error);
      throw new Error(`Failed to restart bot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),
});
