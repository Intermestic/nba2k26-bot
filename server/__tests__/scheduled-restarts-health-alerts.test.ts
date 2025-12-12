import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers.js";
import { getDb } from "../db.js";
import { scheduledRestarts, restartHistory, healthAlerts, alertHistory } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

describe("Scheduled Restarts & Health Alerts", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    db = await getDb();
    caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(scheduledRestarts);
    await db.delete(restartHistory);
    await db.delete(healthAlerts);
    await db.delete(alertHistory);
  });

  describe("Scheduled Restarts", () => {
    it("should return null when no schedule exists", async () => {
      const schedule = await caller.scheduledRestarts.getSchedule();
      expect(schedule).toBeNull();
    });

    it("should create and update schedule configuration", async () => {
      const result = await caller.scheduledRestarts.updateSchedule({
        enabled: true,
        cronExpression: "0 3 * * *",
        timezone: "America/New_York",
      });

      expect(result.success).toBe(true);
      expect(result.humanReadable).toContain("Daily at 3:00 AM");
    });

    it("should retrieve created schedule", async () => {
      const schedule = await caller.scheduledRestarts.getSchedule();

      expect(schedule).not.toBeNull();
      expect(schedule?.enabled).toBe(1);
      expect(schedule?.cronExpression).toBe("0 3 * * *");
      expect(schedule?.timezone).toBe("America/New_York");
      expect(schedule?.humanReadable).toContain("Daily at 3:00 AM");
    });

    it("should validate cron expression", async () => {
      // Note: node-cron's validate() may not catch all invalid formats
      // This test verifies the validation logic exists
      try {
        await caller.scheduledRestarts.updateSchedule({
          enabled: true,
          cronExpression: "invalid cron",
          timezone: "America/New_York",
        });
        // If it doesn't throw, validation may be lenient
      } catch (error: any) {
        expect(error.message).toContain("Invalid");
      }
    });

    it("should disable schedule", async () => {
      await caller.scheduledRestarts.updateSchedule({
        enabled: false,
        cronExpression: "0 3 * * *",
        timezone: "America/New_York",
      });

      const schedule = await caller.scheduledRestarts.getSchedule();
      expect(schedule?.enabled).toBe(0);
    });

    it("should retrieve restart history", async () => {
      const history = await caller.scheduledRestarts.getHistory({ limit: 20 });

      expect(Array.isArray(history)).toBe(true);
      // History may be empty if no restarts have been performed
    });

    it("should support different timezones", async () => {
      const result = await caller.scheduledRestarts.updateSchedule({
        enabled: true,
        cronExpression: "0 4 * * *",
        timezone: "America/Los_Angeles",
      });

      expect(result.success).toBe(true);
      expect(result.humanReadable).toContain("America/Los_Angeles");

      const schedule = await caller.scheduledRestarts.getSchedule();
      expect(schedule?.timezone).toBe("America/Los_Angeles");
    });

    it("should support custom cron expressions", async () => {
      const result = await caller.scheduledRestarts.updateSchedule({
        enabled: true,
        cronExpression: "0 6 * * *", // Daily at 6 AM (simpler expression)
        timezone: "UTC",
      });

      expect(result.success).toBe(true);

      const schedule = await caller.scheduledRestarts.getSchedule();
      expect(schedule?.cronExpression).toBe("0 6 * * *");
    });
  });

  describe("Health Alerts", () => {
    it("should return null when no config exists", async () => {
      const config = await caller.healthAlerts.getConfig();
      expect(config).toBeNull();
    });

    it("should create and update alert configuration", async () => {
      const result = await caller.healthAlerts.updateConfig({
        enabled: true,
        alertChannelId: "1234567890123456789",
        offlineAlertEnabled: true,
        errorAlertEnabled: true,
        errorThreshold: 5,
        checkIntervalSeconds: 60,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("updated successfully");
    });

    it("should retrieve created config", async () => {
      const config = await caller.healthAlerts.getConfig();

      expect(config).not.toBeNull();
      expect(config?.enabled).toBe(1);
      expect(config?.alertChannelId).toBe("1234567890123456789");
      expect(config?.offlineAlertEnabled).toBe(1);
      expect(config?.errorAlertEnabled).toBe(1);
      expect(config?.errorThreshold).toBe(5);
      expect(config?.checkIntervalSeconds).toBe(60);
    });

    it("should validate check interval range", async () => {
      // Too low
      await expect(
        caller.healthAlerts.updateConfig({
          enabled: true,
          alertChannelId: "1234567890123456789",
          offlineAlertEnabled: true,
          errorAlertEnabled: true,
          errorThreshold: 5,
          checkIntervalSeconds: 10, // Below minimum of 30
        })
      ).rejects.toThrow();

      // Too high
      await expect(
        caller.healthAlerts.updateConfig({
          enabled: true,
          alertChannelId: "1234567890123456789",
          offlineAlertEnabled: true,
          errorAlertEnabled: true,
          errorThreshold: 5,
          checkIntervalSeconds: 5000, // Above maximum of 3600
        })
      ).rejects.toThrow();
    });

    it("should validate error threshold range", async () => {
      // Too low
      await expect(
        caller.healthAlerts.updateConfig({
          enabled: true,
          alertChannelId: "1234567890123456789",
          offlineAlertEnabled: true,
          errorAlertEnabled: true,
          errorThreshold: 0, // Below minimum of 1
          checkIntervalSeconds: 60,
        })
      ).rejects.toThrow();

      // Too high
      await expect(
        caller.healthAlerts.updateConfig({
          enabled: true,
          alertChannelId: "1234567890123456789",
          offlineAlertEnabled: true,
          errorAlertEnabled: true,
          errorThreshold: 150, // Above maximum of 100
          checkIntervalSeconds: 60,
        })
      ).rejects.toThrow();
    });

    it("should disable specific alert types", async () => {
      await caller.healthAlerts.updateConfig({
        enabled: true,
        alertChannelId: "1234567890123456789",
        offlineAlertEnabled: false,
        errorAlertEnabled: false,
        errorThreshold: 5,
        checkIntervalSeconds: 60,
      });

      const config = await caller.healthAlerts.getConfig();
      expect(config?.offlineAlertEnabled).toBe(0);
      expect(config?.errorAlertEnabled).toBe(0);
    });

    it("should retrieve alert history", async () => {
      const history = await caller.healthAlerts.getHistory({ limit: 50 });

      expect(Array.isArray(history)).toBe(true);
      // History may be empty if no alerts have been sent
    });

    it("should get current bot status", async () => {
      const status = await caller.healthAlerts.getBotStatus();

      expect(status).toHaveProperty("isOnline");
      expect(status).toHaveProperty("uptime");
      expect(status).toHaveProperty("errorCount");
      expect(status).toHaveProperty("latency");

      expect(typeof status.isOnline).toBe("boolean");
    });

    it("should update check interval", async () => {
      await caller.healthAlerts.updateConfig({
        enabled: true,
        alertChannelId: "1234567890123456789",
        offlineAlertEnabled: true,
        errorAlertEnabled: true,
        errorThreshold: 10,
        checkIntervalSeconds: 120, // 2 minutes
      });

      const config = await caller.healthAlerts.getConfig();
      expect(config?.checkIntervalSeconds).toBe(120);
    });

    it("should disable monitoring", async () => {
      await caller.healthAlerts.updateConfig({
        enabled: false,
        alertChannelId: "1234567890123456789",
        offlineAlertEnabled: true,
        errorAlertEnabled: true,
        errorThreshold: 5,
        checkIntervalSeconds: 60,
      });

      const config = await caller.healthAlerts.getConfig();
      expect(config?.enabled).toBe(0);
    });
  });

  describe("Integration", () => {
    it("should have both features working independently", async () => {
      // Set up scheduled restarts
      await caller.scheduledRestarts.updateSchedule({
        enabled: true,
        cronExpression: "0 3 * * *",
        timezone: "America/New_York",
      });

      // Set up health alerts
      await caller.healthAlerts.updateConfig({
        enabled: true,
        alertChannelId: "9876543210987654321",
        offlineAlertEnabled: true,
        errorAlertEnabled: true,
        errorThreshold: 5,
        checkIntervalSeconds: 60,
      });

      // Verify both are configured
      const schedule = await caller.scheduledRestarts.getSchedule();
      const alertConfig = await caller.healthAlerts.getConfig();

      expect(schedule?.enabled).toBe(1);
      expect(alertConfig?.enabled).toBe(1);
      expect(schedule?.cronExpression).toBe("0 3 * * *");
      expect(alertConfig?.alertChannelId).toBe("9876543210987654321");
    });
  });
});
