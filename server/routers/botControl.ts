import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc.js";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
// Note: This function reads from bot-status.json file
async function getBotUsername(): Promise<string | null> {
  try {
    const statusFile = path.join(projectRoot, 'bot-status.json');
    if (fs.existsSync(statusFile)) {
      const statusData = fs.readFileSync(statusFile, 'utf-8');
      const status = JSON.parse(statusData);
      return status.username || null;
    }
  } catch (error) {
    console.error('[Bot Control] Failed to read bot username:', error);
  }
  return null;
}

export const botControlRouter = router({
  // Get bot status
  getStatus: publicProcedure.query(async () => {
    const isRunning = await isBotRunning();
    const pid = await getBotPid();
    const uptime = await getBotUptime();
    
    // Read Discord client status from file (cross-process communication)
    let discordStatus = {
      online: false,
      username: null as string | null,
    };
    
    try {
      const statusFile = path.join(projectRoot, 'bot-status.json');
      if (fs.existsSync(statusFile)) {
        const statusData = fs.readFileSync(statusFile, 'utf-8');
        const status = JSON.parse(statusData);
        discordStatus = {
          online: status.online || false,
          username: status.username || null,
        };
      }
    } catch (error) {
      console.error('[Bot Control] Failed to read bot status file:', error);
    }
    
    return {
      isOnline: isRunning && discordStatus.online,
      processId: pid,
      uptime: uptime,
      botUsername: discordStatus.username,
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
      
      // Create logs directory if it doesn't exist
      const logsDir = path.join(projectRoot, "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Open log files for stdout and stderr
      const botLogPath = path.join(logsDir, "bot.log");
      const botErrorPath = path.join(logsDir, "bot-error.log");
      const outLog = fs.openSync(botLogPath, "a");
      const errLog = fs.openSync(botErrorPath, "a");
      
      // Start bot in detached mode so it survives after this process
      // Use pnpm to ensure proper dependency resolution
      const child = spawn("pnpm", ["start:bot"], {
        cwd: projectRoot,
        detached: true,
        stdio: ["ignore", outLog, errLog],
        env: {
          ...process.env,
          NODE_ENV: "production",
        },
      });

      // Detach the child process
      child.unref();
      
      // Close file descriptors in parent process
      fs.closeSync(outLog);
      fs.closeSync(errLog);

      // Wait for bot to start and check status
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const isNowRunning = await isBotRunning();
      if (!isNowRunning) {
        // Read error log to get failure reason
        let errorDetails = "No error details available";
        try {
          const errorLog = fs.readFileSync(botErrorPath, "utf-8");
          const lastErrors = errorLog.split("\n").filter(line => line.trim()).slice(-10);
          if (lastErrors.length > 0) {
            errorDetails = lastErrors.join("\n");
          }
        } catch (e) {
          // Ignore read errors
        }
        throw new Error(`Bot process failed to start. Last errors:\n${errorDetails}`);
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
    
    // Allow restart even when offline - it will stop if running, then start
    // This is useful when bot is stuck or disconnected

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
      const logsDir = path.join(projectRoot, "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      const botLogPath = path.join(logsDir, "bot.log");
      const botErrorPath = path.join(logsDir, "bot-error.log");
      const outLog = fs.openSync(botLogPath, "a");
      const errLog = fs.openSync(botErrorPath, "a");
      
      const child = spawn("pnpm", ["start:bot"], {
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
