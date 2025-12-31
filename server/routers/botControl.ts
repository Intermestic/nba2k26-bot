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

const SERVICE_NAME = "nba2k26-discord-bot";

// Store bot process info in memory
let botProcess: {
  pid: number | null;
  startTime: Date | null;
} = {
  pid: null,
  startTime: null,
};

// Check if systemd service is available
async function isSystemdAvailable(): Promise<boolean> {
  try {
    await execAsync(`systemctl is-enabled ${SERVICE_NAME} 2>/dev/null`);
    return true;
  } catch (error) {
    return false;
  }
}

// Get systemd service status
async function getSystemdStatus(): Promise<{
  active: boolean;
  status: string;
  pid: number | null;
  uptime: number | null;
}> {
  try {
    const { stdout } = await execAsync(`systemctl show ${SERVICE_NAME} --property=ActiveState,MainPID,ExecMainStartTimestamp --no-pager`);
    const lines = stdout.trim().split('\n');
    const props: Record<string, string> = {};
    
    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value) {
        props[key] = value;
      }
    }
    
    const active = props.ActiveState === 'active';
    const pid = parseInt(props.MainPID) || null;
    
    // Calculate uptime from start timestamp
    let uptime: number | null = null;
    if (props.ExecMainStartTimestamp && props.ExecMainStartTimestamp !== '') {
      const startTime = new Date(props.ExecMainStartTimestamp);
      if (!isNaN(startTime.getTime())) {
        uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
      }
    }
    
    return {
      active,
      status: props.ActiveState || 'unknown',
      pid: active ? pid : null,
      uptime: active ? uptime : null
    };
  } catch (error) {
    return { active: false, status: 'unknown', pid: null, uptime: null };
  }
}

// Check if bot process is running (fallback method)
async function isBotRunning(): Promise<boolean> {
  try {
    // Check for bot-standalone process
    const { stdout } = await execAsync("ps aux | grep 'bot-standalone' | grep -v grep");
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Get bot process ID (fallback method)
async function getBotPid(): Promise<number | null> {
  try {
    const { stdout } = await execAsync("ps aux | grep 'bot-standalone' | grep -v grep | awk '{print $2}'");
    const pid = parseInt(stdout.trim());
    return isNaN(pid) ? null : pid;
  } catch (error) {
    return null;
  }
}

// Get bot uptime in seconds (fallback method)
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
    const useSystemd = await isSystemdAvailable();
    
    let isRunning = false;
    let pid: number | null = null;
    let uptime: number | null = null;
    let managementMode = 'manual';
    
    if (useSystemd) {
      const systemdStatus = await getSystemdStatus();
      isRunning = systemdStatus.active;
      pid = systemdStatus.pid;
      uptime = systemdStatus.uptime;
      managementMode = 'systemd';
    } else {
      isRunning = await isBotRunning();
      pid = await getBotPid();
      uptime = await getBotUptime();
    }
    
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
      managementMode: managementMode,
      systemdAvailable: useSystemd,
    };
  }),

  // Start bot
  start: publicProcedure.mutation(async () => {
    const useSystemd = await isSystemdAvailable();
    
    if (useSystemd) {
      // Use systemd to start
      try {
        console.log("[Bot Control] Starting bot via systemd...");
        await execAsync(`sudo systemctl start ${SERVICE_NAME}`);
        
        // Wait for startup
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const status = await getSystemdStatus();
        if (!status.active) {
          // Get journal logs for error details
          let errorDetails = "No error details available";
          try {
            const { stdout } = await execAsync(`sudo journalctl -u ${SERVICE_NAME} -n 20 --no-pager`);
            errorDetails = stdout;
          } catch (e) {
            // Ignore
          }
          throw new Error(`Bot failed to start via systemd. Recent logs:\n${errorDetails}`);
        }
        
        console.log(`[Bot Control] Bot started via systemd (PID: ${status.pid})`);
        
        return {
          success: true,
          message: "Bot started successfully via systemd",
          pid: status.pid,
          managementMode: 'systemd',
        };
      } catch (error) {
        console.error("[Bot Control] Failed to start bot via systemd:", error);
        throw new Error(`Failed to start bot: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fallback: manual start
    const isRunning = await isBotRunning();
    
    if (isRunning) {
      throw new Error("Bot is already running");
    }

    try {
      console.log("[Bot Control] Starting bot process (manual mode)...");
      
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
        message: "Bot started successfully (manual mode - no auto-restart)",
        pid: pid,
        managementMode: 'manual',
      };
    } catch (error) {
      console.error("[Bot Control] Failed to start bot:", error);
      throw new Error(`Failed to start bot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  // Stop bot
  stop: publicProcedure.mutation(async () => {
    const useSystemd = await isSystemdAvailable();
    
    if (useSystemd) {
      try {
        console.log("[Bot Control] Stopping bot via systemd...");
        await execAsync(`sudo systemctl stop ${SERVICE_NAME}`);
        
        // Wait for shutdown
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("[Bot Control] Bot stopped via systemd");
        
        return {
          success: true,
          message: "Bot stopped successfully via systemd",
          managementMode: 'systemd',
        };
      } catch (error) {
        console.error("[Bot Control] Failed to stop bot via systemd:", error);
        throw new Error(`Failed to stop bot: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fallback: manual stop
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
        managementMode: 'manual',
      };
    } catch (error) {
      console.error("[Bot Control] Failed to stop bot:", error);
      throw new Error(`Failed to stop bot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  // Restart bot
  restart: publicProcedure.mutation(async () => {
    const useSystemd = await isSystemdAvailable();
    
    if (useSystemd) {
      try {
        console.log("[Bot Control] Restarting bot via systemd...");
        await execAsync(`sudo systemctl restart ${SERVICE_NAME}`);
        
        // Wait for restart
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const status = await getSystemdStatus();
        if (!status.active) {
          throw new Error("Bot failed to restart via systemd");
        }
        
        console.log(`[Bot Control] Bot restarted via systemd (PID: ${status.pid})`);
        
        return {
          success: true,
          message: "Bot restarted successfully via systemd",
          pid: status.pid,
          managementMode: 'systemd',
        };
      } catch (error) {
        console.error("[Bot Control] Failed to restart bot via systemd:", error);
        throw new Error(`Failed to restart bot: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Fallback: manual restart
    try {
      console.log("[Bot Control] Restarting bot (manual mode)...");
      
      // Stop the bot - kill all bot-standalone processes
      try {
        // Use pkill to kill all bot-standalone processes
        await execAsync("pkill -f bot-standalone");
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // pkill returns error if no process found, which is fine
        console.log("[Bot Control] No bot processes to kill or already stopped");
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
        message: "Bot restarted successfully (manual mode - no auto-restart)",
        pid: newPid,
        managementMode: 'manual',
      };
    } catch (error) {
      console.error("[Bot Control] Failed to restart bot:", error);
      throw new Error(`Failed to restart bot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),
  
  // Get systemd service logs
  getLogs: publicProcedure
    .input(z.object({ lines: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const useSystemd = await isSystemdAvailable();
      
      if (useSystemd) {
        try {
          const { stdout } = await execAsync(`sudo journalctl -u ${SERVICE_NAME} -n ${input.lines} --no-pager`);
          return {
            logs: stdout,
            source: 'systemd',
          };
        } catch (error) {
          return {
            logs: `Failed to get systemd logs: ${error instanceof Error ? error.message : String(error)}`,
            source: 'systemd',
          };
        }
      }
      
      // Fallback: read log files
      try {
        const botLogPath = path.join(projectRoot, "logs", "bot.log");
        const botErrorPath = path.join(projectRoot, "logs", "bot-error.log");
        
        let logs = "";
        
        if (fs.existsSync(botLogPath)) {
          const content = fs.readFileSync(botLogPath, 'utf-8');
          const lines = content.split('\n').slice(-input.lines);
          logs += "=== Bot Log ===\n" + lines.join('\n') + "\n\n";
        }
        
        if (fs.existsSync(botErrorPath)) {
          const content = fs.readFileSync(botErrorPath, 'utf-8');
          const lines = content.split('\n').slice(-input.lines);
          logs += "=== Error Log ===\n" + lines.join('\n');
        }
        
        return {
          logs: logs || "No logs available",
          source: 'file',
        };
      } catch (error) {
        return {
          logs: `Failed to read log files: ${error instanceof Error ? error.message : String(error)}`,
          source: 'file',
        };
      }
    }),
});
