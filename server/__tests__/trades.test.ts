import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { trades } from "../../drizzle/schema";

describe("Trades Router", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }
  });

  it("should have trades table available", async () => {
    // Query the trades table to verify it exists
    const result = await db!.select().from(trades).limit(1);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow inserting a test trade", async () => {
    const testTrade = {
      messageId: "test-message-" + Date.now(),
      team1: "Lakers",
      team2: "Celtics",
      team1Players: JSON.stringify([
        { name: "LeBron James", overall: 96, salary: 48 }
      ]),
      team2Players: JSON.stringify([
        { name: "Jayson Tatum", overall: 95, salary: 34 }
      ]),
      status: "pending" as const,
      upvotes: 0,
      downvotes: 0,
    };

    const result = await db!.insert(trades).values(testTrade);
    expect(result).toBeDefined();
  });

  it("should retrieve trades from database", async () => {
    const result = await db!.select().from(trades);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const trade = result[0];
      expect(trade).toHaveProperty("id");
      expect(trade).toHaveProperty("messageId");
      expect(trade).toHaveProperty("team1");
      expect(trade).toHaveProperty("team2");
      expect(trade).toHaveProperty("status");
    }
  });
});
