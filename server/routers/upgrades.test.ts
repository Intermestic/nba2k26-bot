import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { playerUpgrades, upgradeAuditTrail, upgradeRequests, badgeAdditions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Upgrade Rollback and Correction", () => {
  let testUpgradeId: number;
  let testRequestId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test upgrade request
    const [request] = await db.insert(upgradeRequests).values({
      playerId: "test-player-1",
      playerName: "Test Player",
      badgeName: "QFS",
      fromLevel: "bronze",
      toLevel: "silver",
      requestedBy: "test-user",
      requestedByName: "Test User",
      team: "Test Team",
      channelId: "123456789",
      messageId: "987654321",
      status: "approved",
      upgradeType: "Global",
    });

    testRequestId = request.insertId;

    // Create a test completed upgrade
    const [upgrade] = await db.insert(playerUpgrades).values({
      playerId: "test-player-1",
      playerName: "Test Player",
      badgeName: "QFS",
      fromLevel: "bronze",
      toLevel: "silver",
      upgradeType: "badge_level",
      requestId: testRequestId,
    });

    testUpgradeId = upgrade.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(upgradeAuditTrail).where(eq(upgradeAuditTrail.upgradeId, testUpgradeId));
    await db.delete(playerUpgrades).where(eq(playerUpgrades.id, testUpgradeId));
    await db.delete(upgradeRequests).where(eq(upgradeRequests.id, testRequestId));
  });

  it("should rollback an upgrade successfully", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the upgrade before rollback
    const upgradeBefore = await db
      .select()
      .from(playerUpgrades)
      .where(eq(playerUpgrades.id, testUpgradeId));

    expect(upgradeBefore).toHaveLength(1);

    // Create audit trail entry (simulating rollback procedure)
    await db.insert(upgradeAuditTrail).values({
      upgradeId: testUpgradeId,
      actionType: "rollback",
      performedBy: 1,
      performedByName: "Test Admin",
      reason: "Test rollback",
      originalBadgeName: upgradeBefore[0].badgeName,
      originalFromLevel: upgradeBefore[0].fromLevel,
      originalToLevel: upgradeBefore[0].toLevel,
      originalStatName: upgradeBefore[0].statName,
      originalStatIncrease: upgradeBefore[0].statIncrease,
      originalNewStatValue: upgradeBefore[0].newStatValue,
      originalMetadata: upgradeBefore[0].metadata,
    });

    // Delete the upgrade (rollback)
    await db.delete(playerUpgrades).where(eq(playerUpgrades.id, testUpgradeId));

    // Verify upgrade is deleted
    const upgradeAfter = await db
      .select()
      .from(playerUpgrades)
      .where(eq(playerUpgrades.id, testUpgradeId));

    expect(upgradeAfter).toHaveLength(0);

    // Verify audit trail entry exists
    const auditEntries = await db
      .select()
      .from(upgradeAuditTrail)
      .where(eq(upgradeAuditTrail.upgradeId, testUpgradeId));

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].actionType).toBe("rollback");
    expect(auditEntries[0].performedByName).toBe("Test Admin");
    expect(auditEntries[0].reason).toBe("Test rollback");

    // Restore the upgrade for other tests
    const [restored] = await db.insert(playerUpgrades).values({
      playerId: "test-player-1",
      playerName: "Test Player",
      badgeName: "QFS",
      fromLevel: "bronze",
      toLevel: "silver",
      upgradeType: "badge_level",
      requestId: testRequestId,
    });

    testUpgradeId = restored.insertId;
  });

  it("should correct an upgrade successfully", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the upgrade before correction
    const upgradeBefore = await db
      .select()
      .from(playerUpgrades)
      .where(eq(playerUpgrades.id, testUpgradeId));

    expect(upgradeBefore).toHaveLength(1);
    expect(upgradeBefore[0].badgeName).toBe("QFS");

    // Create audit trail entry (simulating correction procedure)
    await db.insert(upgradeAuditTrail).values({
      upgradeId: testUpgradeId,
      actionType: "correction",
      performedBy: 1,
      performedByName: "Test Admin",
      reason: "Badge name was incorrect",
      originalBadgeName: upgradeBefore[0].badgeName,
      originalFromLevel: upgradeBefore[0].fromLevel,
      originalToLevel: upgradeBefore[0].toLevel,
      correctedBadgeName: "Limitless Range",
      correctedFromLevel: upgradeBefore[0].fromLevel,
      correctedToLevel: upgradeBefore[0].toLevel,
    });

    // Update the upgrade (correction)
    await db
      .update(playerUpgrades)
      .set({ badgeName: "Limitless Range" })
      .where(eq(playerUpgrades.id, testUpgradeId));

    // Verify upgrade is corrected
    const upgradeAfter = await db
      .select()
      .from(playerUpgrades)
      .where(eq(playerUpgrades.id, testUpgradeId));

    expect(upgradeAfter).toHaveLength(1);
    expect(upgradeAfter[0].badgeName).toBe("Limitless Range");

    // Verify audit trail entry exists
    const auditEntries = await db
      .select()
      .from(upgradeAuditTrail)
      .where(eq(upgradeAuditTrail.upgradeId, testUpgradeId));

    expect(auditEntries.length).toBeGreaterThanOrEqual(1);
    
    const correctionEntry = auditEntries.find(e => e.actionType === "correction");
    expect(correctionEntry).toBeDefined();
    expect(correctionEntry?.performedByName).toBe("Test Admin");
    expect(correctionEntry?.originalBadgeName).toBe("QFS");
    expect(correctionEntry?.correctedBadgeName).toBe("Limitless Range");
  });

  it("should track multiple corrections in audit trail", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get current state
    const currentUpgrade = await db
      .select()
      .from(playerUpgrades)
      .where(eq(playerUpgrades.id, testUpgradeId));

    // Make another correction
    await db.insert(upgradeAuditTrail).values({
      upgradeId: testUpgradeId,
      actionType: "correction",
      performedBy: 1,
      performedByName: "Another Admin",
      reason: "Level was also incorrect",
      originalBadgeName: currentUpgrade[0].badgeName,
      originalFromLevel: currentUpgrade[0].fromLevel,
      originalToLevel: currentUpgrade[0].toLevel,
      correctedBadgeName: currentUpgrade[0].badgeName,
      correctedFromLevel: "silver",
      correctedToLevel: "gold",
    });

    await db
      .update(playerUpgrades)
      .set({ fromLevel: "silver", toLevel: "gold" })
      .where(eq(playerUpgrades.id, testUpgradeId));

    // Verify multiple audit entries exist
    const auditEntries = await db
      .select()
      .from(upgradeAuditTrail)
      .where(eq(upgradeAuditTrail.upgradeId, testUpgradeId));

    expect(auditEntries.length).toBeGreaterThanOrEqual(2);
    
    const correctionEntries = auditEntries.filter(e => e.actionType === "correction");
    expect(correctionEntries.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle badge addition rollback", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new badge addition upgrade
    const [badgeUpgrade] = await db.insert(playerUpgrades).values({
      playerId: "test-player-2",
      playerName: "Test Player 2",
      badgeName: "Ankle Breaker",
      fromLevel: "none",
      toLevel: "bronze",
      upgradeType: "new_badge",
    });

    const badgeUpgradeId = badgeUpgrade.insertId;

    // Create corresponding badge addition entry
    await db.insert(badgeAdditions).values({
      playerId: "test-player-2",
      playerName: "Test Player 2",
      badgeName: "Ankle Breaker",
      upgradeId: badgeUpgradeId,
    });

    // Verify badge addition exists
    const badgeAdditionsBefore = await db
      .select()
      .from(badgeAdditions)
      .where(eq(badgeAdditions.upgradeId, badgeUpgradeId));

    expect(badgeAdditionsBefore).toHaveLength(1);

    // Rollback the upgrade
    await db.insert(upgradeAuditTrail).values({
      upgradeId: badgeUpgradeId,
      actionType: "rollback",
      performedBy: 1,
      performedByName: "Test Admin",
      reason: "Badge was added incorrectly",
      originalBadgeName: "Ankle Breaker",
      originalFromLevel: "none",
      originalToLevel: "bronze",
    });

    await db.delete(badgeAdditions).where(eq(badgeAdditions.upgradeId, badgeUpgradeId));
    await db.delete(playerUpgrades).where(eq(playerUpgrades.id, badgeUpgradeId));

    // Verify both are deleted
    const badgeAdditionsAfter = await db
      .select()
      .from(badgeAdditions)
      .where(eq(badgeAdditions.upgradeId, badgeUpgradeId));

    const upgradeAfter = await db
      .select()
      .from(playerUpgrades)
      .where(eq(playerUpgrades.id, badgeUpgradeId));

    expect(badgeAdditionsAfter).toHaveLength(0);
    expect(upgradeAfter).toHaveLength(0);

    // Clean up audit trail
    await db.delete(upgradeAuditTrail).where(eq(upgradeAuditTrail.upgradeId, badgeUpgradeId));
  });
});
