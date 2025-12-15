import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers.js";

describe("Bot Control Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // Create a caller without authentication context for testing
    caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });
  });

  describe("getStatus", () => {
    it("should return bot status information", async () => {
      const result = await caller.botControl.getStatus();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("isOnline");
      expect(result).toHaveProperty("processId");
      expect(result).toHaveProperty("uptime");
      expect(result).toHaveProperty("botUsername");
      expect(result).toHaveProperty("lastStarted");

      // Type checks
      expect(typeof result.isOnline).toBe("boolean");
      expect(result.processId === null || typeof result.processId === "number").toBe(true);
      expect(result.uptime === null || typeof result.uptime === "number").toBe(true);
      expect(result.botUsername === null || typeof result.botUsername === "string").toBe(true);
      expect(result.lastStarted === null || typeof result.lastStarted === "string").toBe(true);
    });

    it("should return consistent status structure", async () => {
      const result1 = await caller.botControl.getStatus();
      const result2 = await caller.botControl.getStatus();

      // Both calls should return the same structure
      expect(Object.keys(result1).sort()).toEqual(Object.keys(result2).sort());
    });
  });

  describe("start", () => {
    it("should have start mutation available", () => {
      expect(caller.botControl.start).toBeDefined();
      expect(typeof caller.botControl.start).toBe("function");
    });

    it("should reject starting when bot is already running", async () => {
      const status = await caller.botControl.getStatus();
      
      if (status.isOnline) {
        // Bot is running, should reject start
        await expect(caller.botControl.start()).rejects.toThrow("Bot is already running");
      } else {
        // Bot is not running, this test is not applicable
        console.log("Bot is not running, skipping 'already running' test");
      }
    });
  });

  describe("stop", () => {
    it("should have stop mutation available", () => {
      expect(caller.botControl.stop).toBeDefined();
      expect(typeof caller.botControl.stop).toBe("function");
    });

    it("should reject stopping when bot is not running", async () => {
      const status = await caller.botControl.getStatus();
      
      if (!status.isOnline) {
        // Bot is not running, should reject stop
        await expect(caller.botControl.stop()).rejects.toThrow("Bot is not running");
      } else {
        // Bot is running, this test is not applicable
        console.log("Bot is running, skipping 'not running' test");
      }
    });
  });

  describe("restart", () => {
    it("should have restart mutation available", () => {
      expect(caller.botControl.restart).toBeDefined();
      expect(typeof caller.botControl.restart).toBe("function");
    });

    it("should reject restarting when bot is not running", async () => {
      const status = await caller.botControl.getStatus();
      
      if (!status.isOnline) {
        // Bot is not running, should reject restart
        await expect(caller.botControl.restart()).rejects.toThrow("Bot is not running");
      } else {
        // Bot is running, this test is not applicable
        console.log("Bot is running, skipping 'not running' restart test");
      }
    });
  });

  describe("integration", () => {
    it("should maintain consistent state across operations", async () => {
      const status1 = await caller.botControl.getStatus();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status2 = await caller.botControl.getStatus();
      
      // Status should be consistent
      expect(status1.isOnline).toBe(status2.isOnline);
      
      // If online, PID should be the same
      if (status1.isOnline && status2.isOnline) {
        expect(status1.processId).toBe(status2.processId);
      }
    });
  });
});
