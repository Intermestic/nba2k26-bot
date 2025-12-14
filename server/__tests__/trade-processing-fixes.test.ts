import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { players, trades } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { findPlayerByFuzzyName } from '../trade-parser';

describe('Trade Processing Fixes', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup is handled by the database connection pool
  });

  describe('Fuzzy Player Name Matching', () => {
    it('should find Alex Sarr when searching for "Alexander Sarr"', async () => {
      const player = await findPlayerByFuzzyName('Alexander Sarr', 'Wizards', 'test');
      expect(player).toBeTruthy();
      expect(player?.name).toBe('Alex Sarr');
      expect(player?.team).toBe('Wizards');
    });

    it('should find Joan Beringer when searching for "Joan Berringer"', async () => {
      const player = await findPlayerByFuzzyName('Joan Berringer', 'Wizards', 'test');
      expect(player).toBeTruthy();
      expect(player?.name).toBe('Joan Beringer');
      expect(player?.team).toBe('Wizards');
    });

    it('should find Jase Richardson when searching for "Jase Richards"', async () => {
      const player = await findPlayerByFuzzyName('Jase Richards', 'Pacers', 'test');
      expect(player).toBeTruthy();
      expect(player?.name).toBe('Jase Richardson');
      expect(player?.team).toBe('Pacers');
    });

    it('should not find placeholder entries', async () => {
      const player = await findPlayerByFuzzyName('--', undefined, 'test');
      expect(player).toBeNull();
    });

    it('should not find empty strings', async () => {
      const player = await findPlayerByFuzzyName('', undefined, 'test');
      expect(player).toBeNull();
    });
  });

  describe('Trade Player Parsing', () => {
    it('should skip placeholder entries in player list', () => {
      const playerList = [
        { name: 'Anthony Davis', overall: 93, salary: 50 },
        { name: '--', overall: 233, salary: 0 },
        { name: 'Josh Giddey', overall: 85, salary: 14 }
      ];

      const validPlayers = playerList.filter(p => 
        p.name && p.name !== '--' && p.name.trim() !== ''
      );

      expect(validPlayers.length).toBe(2);
      expect(validPlayers[0].name).toBe('Anthony Davis');
      expect(validPlayers[1].name).toBe('Josh Giddey');
    });

    it('should handle trade with multiple placeholder entries', () => {
      const team1Players = [
        { name: 'Anthony Davis', overall: 93, salary: 50 },
        { name: 'Rasheer Fleming', overall: 70, salary: 2 },
        { name: 'Jase Richards', overall: 70, salary: 2 },
        { name: '--', overall: 233, salary: 0 }
      ];

      const team2Players = [
        { name: 'Josh Giddey', overall: 85, salary: 14 },
        { name: 'Alexander Sarr', overall: 83, salary: 10 },
        { name: 'Joan Berringer', overall: 70, salary: 2 },
        { name: '--', overall: 238, salary: 0 }
      ];

      const validTeam1 = team1Players.filter(p => 
        p.name && p.name !== '--' && p.name.trim() !== ''
      );
      const validTeam2 = team2Players.filter(p => 
        p.name && p.name !== '--' && p.name.trim() !== ''
      );

      expect(validTeam1.length).toBe(3);
      expect(validTeam2.length).toBe(3);
    });
  });

  describe('Real Trade Scenario', () => {
    it('should process Wizards-Pacers trade correctly', async () => {
      // Simulate the actual trade from the user's report
      // Note: Players should be searched on their CURRENT team (before trade)
      const tradeData = {
        team1: 'Wizards', // Wizards SEND these players (so they're currently ON Wizards)
        team1Players: [
          { name: 'Anthony Davis', overall: 93, salary: 50, currentTeam: 'Wizards' },
          { name: 'Rasheer Fleming', overall: 70, salary: 2, currentTeam: 'Wizards' },
          { name: 'Jase Richards', overall: 70, salary: 2, currentTeam: 'Pacers' }, // Typo: should be Richardson
          { name: '--', overall: 233, salary: 0, currentTeam: '' }
        ],
        team2: 'Pacers', // Pacers SEND these players (so they're currently ON Pacers)
        team2Players: [
          { name: 'Josh Giddey', overall: 85, salary: 14, currentTeam: 'Pacers' },
          { name: 'Alexander Sarr', overall: 83, salary: 10, currentTeam: 'Wizards' }, // Typo: should be Alex
          { name: 'Joan Berringer', overall: 70, salary: 2, currentTeam: 'Wizards' }, // Typo: should be Beringer
          { name: '--', overall: 238, salary: 0, currentTeam: '' }
        ]
      };

      // Filter out placeholders
      const validTeam1Players = tradeData.team1Players.filter(p => 
        p.name && p.name !== '--' && p.name.trim() !== ''
      );
      const validTeam2Players = tradeData.team2Players.filter(p => 
        p.name && p.name !== '--' && p.name.trim() !== ''
      );

      // Try to find each player with fuzzy matching on their CURRENT team
      const team1Results = await Promise.all(
        validTeam1Players.map(p => findPlayerByFuzzyName(p.name, p.currentTeam, 'test'))
      );
      const team2Results = await Promise.all(
        validTeam2Players.map(p => findPlayerByFuzzyName(p.name, p.currentTeam, 'test'))
      );

      // Debug: Check which players were not found
      console.log('Team1 results:', team1Results.map((r, i) => ({ name: validTeam1Players[i].name, found: r?.name || 'NOT FOUND' })));
      console.log('Team2 results:', team2Results.map((r, i) => ({ name: validTeam2Players[i].name, found: r?.name || 'NOT FOUND' })));
      
      // All players should be found
      expect(team1Results.every(r => r !== null)).toBe(true);
      expect(team2Results.every(r => r !== null)).toBe(true);

      // Verify correct player names were matched
      expect(team1Results[0]?.name).toBe('Anthony Davis');
      expect(team1Results[1]?.name).toBe('Rasheer Fleming');
      expect(team1Results[2]?.name).toBe('Jase Richardson'); // Corrected from "Richards"

      expect(team2Results[0]?.name).toBe('Josh Giddey');
      expect(team2Results[1]?.name).toBe('Alex Sarr'); // Corrected from "Alexander"
      expect(team2Results[2]?.name).toBe('Joan Beringer'); // Corrected from "Berringer"
    });
  });
});
