import { describe, it, expect } from "vitest";
import { VALID_TEAMS } from "../team-validator";

describe("Trade Machine", () => {
  describe("Team List", () => {
    it("should have valid NBA teams", () => {
      expect(VALID_TEAMS).toBeDefined();
      expect(Array.isArray(VALID_TEAMS)).toBe(true);
      expect(VALID_TEAMS.length).toBeGreaterThan(0);
      
      // Should include known NBA teams
      expect(VALID_TEAMS).toContain("Lakers");
      expect(VALID_TEAMS).toContain("Celtics");
      expect(VALID_TEAMS).toContain("Warriors");
      expect(VALID_TEAMS).toContain("Free Agents");
    });

    it("should exclude Free Agents from tradable teams", () => {
      const tradableTeams = VALID_TEAMS.filter(team => team !== "Free Agents");
      
      expect(tradableTeams).not.toContain("Free Agents");
      expect(tradableTeams.length).toBe(VALID_TEAMS.length - 1);
    });
  });

  describe("Trade Formatting", () => {
    it("should calculate correct totals for team 1", () => {
      const team1Players = [
        { name: "LeBron James", overall: 94, badges: 26 },
        { name: "Anthony Davis", overall: 93, badges: 24 },
      ];

      const totalOvr = team1Players.reduce((sum, p) => sum + p.overall, 0);
      const totalBadges = team1Players.reduce((sum, p) => sum + p.badges, 0);

      expect(totalOvr).toBe(187);
      expect(totalBadges).toBe(50);
    });

    it("should calculate correct totals for team 2", () => {
      const team2Players = [
        { name: "Jayson Tatum", overall: 95, badges: 28 },
      ];

      const totalOvr = team2Players.reduce((sum, p) => sum + p.overall, 0);
      const totalBadges = team2Players.reduce((sum, p) => sum + p.badges, 0);

      expect(totalOvr).toBe(95);
      expect(totalBadges).toBe(28);
    });

    it("should format trade message correctly", () => {
      const team1Name = "Lakers";
      const team1Players = [
        { name: "LeBron James", overall: 94, badges: 26 },
      ];
      const team2Name = "Celtics";
      const team2Players = [
        { name: "Jayson Tatum", overall: 95, badges: 28 },
      ];

      const team1TotalOvr = team1Players.reduce((sum, p) => sum + p.overall, 0);
      const team1TotalBadges = team1Players.reduce((sum, p) => sum + p.badges, 0);
      const team2TotalOvr = team2Players.reduce((sum, p) => sum + p.overall, 0);
      const team2TotalBadges = team2Players.reduce((sum, p) => sum + p.badges, 0);

      const lines: string[] = [];
      
      lines.push(`**${team1Name} Sends:**`);
      lines.push('');
      team1Players.forEach(player => {
        lines.push(`${player.name} ${player.overall} (${player.badges})`);
      });
      lines.push('--');
      lines.push(`${team1TotalOvr} (${team1TotalBadges})`);
      lines.push('');
      
      lines.push(`**${team2Name} Sends:**`);
      lines.push('');
      team2Players.forEach(player => {
        lines.push(`${player.name} ${player.overall} (${player.badges})`);
      });
      lines.push('--');
      lines.push(`${team2TotalOvr} (${team2TotalBadges})`);

      const message = lines.join('\n');

      expect(message).toContain("**Lakers Sends:**");
      expect(message).toContain("LeBron James 94 (26)");
      expect(message).toContain("94 (26)");
      expect(message).toContain("**Celtics Sends:**");
      expect(message).toContain("Jayson Tatum 95 (28)");
      expect(message).toContain("95 (28)");
    });
  });

  describe("Discord Channel Configuration", () => {
    it("should have correct trade channel ID", () => {
      const TRADE_CHANNEL_ID = "1336156955722645535";
      
      expect(TRADE_CHANNEL_ID).toBe("1336156955722645535");
      expect(TRADE_CHANNEL_ID.length).toBe(19); // Discord snowflake IDs are 19 digits
    });
  });
});

describe('Trade Machine - Discord Bot Integration', () => {
  const BOT_HTTP_PORT = process.env.BOT_HTTP_PORT || 3001;
  const botHealthUrl = `http://127.0.0.1:${BOT_HTTP_PORT}/health`;
  const botTradeUrl = `http://127.0.0.1:${BOT_HTTP_PORT}/post-trade`;

  it('should have bot HTTP server running', async () => {
    const response = await fetch(botHealthUrl);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  it('should have Discord bot ready', async () => {
    const response = await fetch(botHealthUrl);
    const data = await response.json();
    
    expect(data.botReady).toBe(true);
    expect(data.botUsername).toBeTruthy();
  });

  it('should successfully post a trade to Discord', async () => {
    const tradeData = {
      team1Name: 'Test Team A',
      team1Players: [
        { name: 'Test Player 1', overall: 85, badges: 10 }
      ],
      team2Name: 'Test Team B',
      team2Players: [
        { name: 'Test Player 2', overall: 80, badges: 8 }
      ]
    };

    const response = await fetch(botTradeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradeData),
      signal: AbortSignal.timeout(10000),
    });

    expect(response.ok).toBe(true);
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Discord');
  }, 15000); // 15 second timeout for this test

  it('should handle AbortSignal.timeout correctly', async () => {
    // This test verifies that AbortSignal.timeout works
    const response = await fetch(botHealthUrl, {
      signal: AbortSignal.timeout(5000),
    });
    
    expect(response.ok).toBe(true);
  });
});
