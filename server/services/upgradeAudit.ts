import { getDb } from "../db";
import { upgradeLog, players, upgradeViolations, upgradeRules, upgradeAudits } from "../../drizzle/schema";
import { eq, and, sql, desc, like } from "drizzle-orm";

/**
 * Simplified upgrade audit system
 * Checks existing upgrades against the rules database
 */

export interface AuditViolation {
  upgradeLogId: number;
  playerName: string;
  upgradeType: string;
  violationType: string;
  ruleViolated: string;
  severity: "ERROR" | "WARNING" | "INFO";
  details: string;
}

export class UpgradeAuditor {
  /**
   * Run a full audit of all upgrades in the database
   */
  async runFullAudit(createdBy?: string): Promise<{
    auditId: number;
    totalChecked: number;
    violationsFound: number;
    violations: AuditViolation[];
  }> {
    // Create audit record
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [audit] = await db.insert(upgradeAudits).values({
      auditType: "FULL_AUDIT",
      status: "RUNNING",
      totalChecked: 0,
      violationsFound: 0,
      startedAt: new Date(),
      createdBy,
    }).$returningId();

    const auditId = audit.id;
    const violations: AuditViolation[] = [];

    try {
      // Get all upgrade logs
      const allUpgrades = await db.select().from(upgradeLog).orderBy(upgradeLog.createdAt);
      
      console.log(`Auditing ${allUpgrades.length} upgrades...`);

      // Check each upgrade
      for (const upgrade of allUpgrades) {
        const upgradeViolations = await this.auditSingleUpgrade(upgrade);
        violations.push(...upgradeViolations);
      }

      // Save violations to database
      if (violations.length > 0) {
        await db.insert(upgradeViolations).values(
          violations.map(v => ({
            upgradeLogId: v.upgradeLogId,
            playerName: v.playerName,
            upgradeType: v.upgradeType,
            violationType: v.violationType,
            ruleViolated: v.ruleViolated,
            details: v.details,
            severity: v.severity,
            resolved: false,
          }))
        );
      }

      // Update audit record
      await db.update(upgradeAudits)
        .set({
          status: "COMPLETED",
          totalChecked: allUpgrades.length,
          violationsFound: violations.length,
          completedAt: new Date(),
          results: JSON.stringify({
            violationsBySeverity: {
              ERROR: violations.filter(v => v.severity === "ERROR").length,
              WARNING: violations.filter(v => v.severity === "WARNING").length,
              INFO: violations.filter(v => v.severity === "INFO").length,
            },
            violationsByType: this.groupByType(violations),
          }),
        })
        .where(eq(upgradeAudits.id, auditId));

      return {
        auditId,
        totalChecked: allUpgrades.length,
        violationsFound: violations.length,
        violations,
      };

    } catch (error) {
      // Mark audit as failed
      await db.update(upgradeAudits)
        .set({
          status: "FAILED",
          completedAt: new Date(),
          results: JSON.stringify({ error: String(error) }),
        })
        .where(eq(upgradeAudits.id, auditId));

      throw error;
    }
  }

  /**
   * Audit a single upgrade for compliance violations
   */
  async auditSingleUpgrade(upgrade: typeof upgradeLog.$inferSelect): Promise<AuditViolation[]> {
    const violations: AuditViolation[] = [];

    // Determine upgrade type from sourceType and sourceDetail
    const upgradeType = this.determineUpgradeType(upgrade);

    // Get player data
    const player = await this.findPlayer(upgrade.playerName);
    if (!player) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType,
        violationType: "PLAYER_NOT_FOUND",
        ruleViolated: "Player must exist in database",
        severity: "WARNING",
        details: `Player "${upgrade.playerName}" not found in players table`,
      });
      return violations;
    }

    // Run specific checks based on upgrade type
    switch (upgradeType) {
      case "Welcome":
        this.checkWelcomeRules(upgrade, player, violations);
        break;
      case "5-Game Badge":
        this.check5GameBadgeRules(upgrade, player, violations);
        break;
      case "7-Game Attribute":
        this.check7GameAttributeRules(upgrade, player, violations);
        break;
      case "Rookie":
        this.checkRookieRules(upgrade, player, violations);
        break;
      case "OG":
        this.checkOGRules(upgrade, player, violations);
        break;
      case "Superstar Pack":
        this.checkSuperstarPackRules(upgrade, player, violations);
        break;
      case "Activity Bonus":
        this.checkActivityBonusRules(upgrade, player, violations);
        break;
    }

    // Check global rules
    this.checkGlobalRules(upgrade, player, violations);

    return violations;
  }

  /**
   * Determine upgrade type from sourceType and sourceDetail
   */
  private determineUpgradeType(upgrade: typeof upgradeLog.$inferSelect): string {
    const source = upgrade.sourceType.toLowerCase();
    const detail = (upgrade.sourceDetail || "").toLowerCase();

    if (source.includes("welcome")) return "Welcome";
    if (source.includes("5") || detail.includes("5")) return "5-Game Badge";
    if (source.includes("7") || detail.includes("7")) return "7-Game Attribute";
    if (source.includes("rookie")) return "Rookie";
    if (source.includes("og")) return "OG";
    if (source.includes("superstar")) return "Superstar Pack";
    if (source.includes("activity")) return "Activity Bonus";

    return "Unknown";
  }

  /**
   * Find player by name (with fuzzy matching)
   */
  private async findPlayer(playerName: string): Promise<typeof players.$inferSelect | null> {
    const db = await getDb();
    if (!db) return null;

    // Try exact match first
    const [exactMatch] = await db.select().from(players).where(eq(players.name, playerName)).limit(1);
    if (exactMatch) return exactMatch;

    // Try case-insensitive match
    const [fuzzyMatch] = await db.select().from(players).where(like(players.name, playerName)).limit(1);
    return fuzzyMatch || null;
  }

  /**
   * Check global rules
   */
  private checkGlobalRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    const upgradeType = this.determineUpgradeType(upgrade);

    if (upgrade.upgradeType === "Attribute") {
      const toValue = parseInt(upgrade.toValue);
      const fromValue = parseInt(upgrade.fromValue || "0");

      // Rule: Attributes must be at least 60 to be eligible for upgrade
      if (fromValue < 60 && fromValue > 0) {
        violations.push({
          upgradeLogId: upgrade.id,
          playerName: upgrade.playerName,
          upgradeType,
          violationType: "ATTRIBUTE_BELOW_MINIMUM",
          ruleViolated: "Attributes must be at least 60 to be eligible for upgrade.",
          severity: "ERROR",
          details: `Attribute "${upgrade.badgeOrAttribute}" was ${fromValue}, below minimum of 60`,
        });
      }

      // Rule: Gameplay upgrades can raise attributes up to 88
      const gameplayTypes = ["Welcome", "5-Game Badge", "7-Game Attribute", "Rookie", "OG", "Activity Bonus"];
      if (gameplayTypes.includes(upgradeType) && toValue > 88) {
        violations.push({
          upgradeLogId: upgrade.id,
          playerName: upgrade.playerName,
          upgradeType,
          violationType: "ATTRIBUTE_CAP_EXCEEDED",
          ruleViolated: "Gameplay upgrades (Welcome, 5GM, 7GM, Rookie, OG, Activity Bonus) can raise attributes up to 88.",
          severity: "ERROR",
          details: `Attribute "${upgrade.badgeOrAttribute}" raised to ${toValue}, exceeds cap of 88`,
        });
      }

      // Rule: Superstar upgrades can raise attributes up to 90
      if (upgradeType === "Superstar Pack" && toValue > 90) {
        violations.push({
          upgradeLogId: upgrade.id,
          playerName: upgrade.playerName,
          upgradeType,
          violationType: "ATTRIBUTE_CAP_EXCEEDED",
          ruleViolated: "Award/Challenge/Superstar upgrades can raise attributes up to a maximum of 90.",
          severity: "ERROR",
          details: `Attribute "${upgrade.badgeOrAttribute}" raised to ${toValue}, exceeds cap of 90`,
        });
      }
    }

    if (upgrade.upgradeType === "Badge") {
      // Rule: Only Bronze/Silver/Gold badges can be earned from gameplay upgrades
      const gameplayTypes = ["Welcome", "5-Game Badge", "7-Game Attribute", "Rookie", "OG", "Activity Bonus"];
      if (gameplayTypes.includes(upgradeType)) {
        if (upgrade.toValue === "Hall of Fame" || upgrade.toValue === "Legend") {
          violations.push({
            upgradeLogId: upgrade.id,
            playerName: upgrade.playerName,
            upgradeType,
            violationType: "BADGE_TIER_RESTRICTED",
            ruleViolated: "Hall of Fame & Legend tiers are excluded except via Superstar Pack Option B.",
            severity: "ERROR",
            details: `Badge "${upgrade.badgeOrAttribute}" upgraded to ${upgrade.toValue} via gameplay upgrade`,
          });
        }
      }

      // Rule: Non-rookies may NOT add or upgrade: Paint Patroller, Dimer, On-Ball Menace
      const restrictedBadges = ["Paint Patroller", "Dimer", "On-Ball Menace"];
      if (!player.isRookie && restrictedBadges.some(rb => upgrade.badgeOrAttribute.includes(rb))) {
        violations.push({
          upgradeLogId: upgrade.id,
          playerName: upgrade.playerName,
          upgradeType,
          violationType: "BADGE_RESTRICTED_NON_ROOKIE",
          ruleViolated: "Non-rookies may NOT add or upgrade: Paint Patroller, Dimer, On-Ball Menace.",
          severity: "ERROR",
          details: `Badge "${upgrade.badgeOrAttribute}" upgraded on non-rookie player`,
        });
      }

      // Rule: Strong Handle cannot be added or upgraded by any player
      if (upgrade.badgeOrAttribute.includes("Strong Handle")) {
        violations.push({
          upgradeLogId: upgrade.id,
          playerName: upgrade.playerName,
          upgradeType,
          violationType: "BADGE_RESTRICTED_ALL",
          ruleViolated: "Strong Handle cannot be added or upgraded by any player.",
          severity: "ERROR",
          details: `Badge "Strong Handle" was upgraded, which is not allowed`,
        });
      }
    }
  }

  /**
   * Check Welcome upgrade rules
   */
  private checkWelcomeRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    // Rule: Eligible players must be ≤90 OVR and ≤30 years old
    if (player.overall > 90) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "Welcome",
        violationType: "WELCOME_OVR_EXCEEDED",
        ruleViolated: "Eligible players must be ≤90 OVR and ≤30 years old.",
        severity: "ERROR",
        details: `Player overall is ${player.overall}, exceeds limit of 90`,
      });
    }
  }

  /**
   * Check 5-Game Badge upgrade rules
   */
  private check5GameBadgeRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    // Rule: Player must be ≤90 OVR and ≤32 years old
    if (player.overall > 90) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "5-Game Badge",
        violationType: "5GM_OVR_EXCEEDED",
        ruleViolated: "Player must be ≤90 OVR and ≤32 years old.",
        severity: "ERROR",
        details: `Player overall is ${player.overall}, exceeds limit of 90`,
      });
    }

    // Rule: No new badges allowed
    if (upgrade.upgradeType === "Badge" && (!upgrade.fromValue || upgrade.fromValue === "None")) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "5-Game Badge",
        violationType: "5GM_NEW_BADGE_NOT_ALLOWED",
        ruleViolated: "Every 5 games → +1 badge upgrade (no new badges).",
        severity: "ERROR",
        details: `New badge "${upgrade.badgeOrAttribute}" added, but 5GM only allows upgrades`,
      });
    }
  }

  /**
   * Check 7-Game Attribute upgrade rules
   */
  private check7GameAttributeRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    // Rule: Player must be ≤90 OVR and ≤32 years old
    if (player.overall > 90) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "7-Game Attribute",
        violationType: "7GM_OVR_EXCEEDED",
        ruleViolated: "Player must be ≤90 OVR and ≤32 years old.",
        severity: "ERROR",
        details: `Player overall is ${player.overall}, exceeds limit of 90`,
      });
    }

    if (upgrade.upgradeType === "Attribute") {
      const toValue = parseInt(upgrade.toValue);

      // Rule: Upgraded attributes must be ≥60 and ≤88
      if (toValue > 88) {
        violations.push({
          upgradeLogId: upgrade.id,
          playerName: upgrade.playerName,
          upgradeType: "7-Game Attribute",
          violationType: "7GM_ATTRIBUTE_CAP_EXCEEDED",
          ruleViolated: "Upgraded attributes must be ≥60 and ≤88.",
          severity: "ERROR",
          details: `Attribute "${upgrade.badgeOrAttribute}" raised to ${toValue}, exceeds cap of 88`,
        });
      }
    }
  }

  /**
   * Check Rookie upgrade rules
   */
  private checkRookieRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    // Rule: Applies only to designated rookie-class players
    if (!player.isRookie) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "Rookie",
        violationType: "ROOKIE_NOT_ELIGIBLE",
        ruleViolated: "Applies only to designated rookie-class players.",
        severity: "ERROR",
        details: `Player is not marked as a rookie (isRookie = ${player.isRookie})`,
      });
    }
  }

  /**
   * Check OG upgrade rules
   */
  private checkOGRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    // Rule: Applies to players aged 33+ and ≤90 OVR
    if (player.overall > 90) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "OG",
        violationType: "OG_OVR_EXCEEDED",
        ruleViolated: "Applies to players aged 33+ and ≤90 OVR.",
        severity: "ERROR",
        details: `Player overall is ${player.overall}, exceeds limit of 90`,
      });
    }

    // Rule: OG UGs cannot add new badges
    if (upgrade.upgradeType === "Badge" && (!upgrade.fromValue || upgrade.fromValue === "None")) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "OG",
        violationType: "OG_NEW_BADGE_NOT_ALLOWED",
        ruleViolated: "OG UGs cannot add new badges.",
        severity: "ERROR",
        details: `New badge "${upgrade.badgeOrAttribute}" added, but OG only allows upgrades`,
      });
    }

    if (upgrade.upgradeType === "Attribute") {
      const toValue = parseInt(upgrade.toValue);

      // Rule: Attributes upgraded via OG UGs must be between 60 and 85
      if (toValue > 85) {
        violations.push({
          upgradeLogId: upgrade.id,
          playerName: upgrade.playerName,
          upgradeType: "OG",
          violationType: "OG_ATTRIBUTE_CAP_EXCEEDED",
          ruleViolated: "Attributes upgraded via OG UGs must be between 60 and 85.",
          severity: "ERROR",
          details: `Attribute "${upgrade.badgeOrAttribute}" raised to ${toValue}, exceeds cap of 85`,
        });
      }
    }
  }

  /**
   * Check Superstar Pack upgrade rules
   */
  private checkSuperstarPackRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    // Rule: Player must be ≤88 OVR
    if (player.overall > 88) {
      violations.push({
        upgradeLogId: upgrade.id,
        playerName: upgrade.playerName,
        upgradeType: "Superstar Pack",
        violationType: "SUPERSTAR_OVR_EXCEEDED",
        ruleViolated: "Player must be ≤28 years old IRL, ≤88 OVR, and have ≥40 games with the team.",
        severity: "ERROR",
        details: `Player overall is ${player.overall}, exceeds limit of 88`,
      });
    }
  }

  /**
   * Check Activity Bonus upgrade rules
   */
  private checkActivityBonusRules(
    upgrade: typeof upgradeLog.$inferSelect,
    player: typeof players.$inferSelect,
    violations: AuditViolation[]
  ): void {
    // Activity Bonus follows same rules as 5GM/7GM depending on type
    if (upgrade.upgradeType === "Badge") {
      this.check5GameBadgeRules(upgrade, player, violations);
    } else if (upgrade.upgradeType === "Attribute") {
      this.check7GameAttributeRules(upgrade, player, violations);
    }
  }

  /**
   * Helper: Group violations by type
   */
  private groupByType(violations: AuditViolation[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const v of violations) {
      grouped[v.violationType] = (grouped[v.violationType] || 0) + 1;
    }
    return grouped;
  }
}

export const upgradeAuditor = new UpgradeAuditor();
