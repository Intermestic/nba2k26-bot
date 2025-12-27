import { describe, it, expect } from 'vitest';
import { normalizeName, namesMatch, findByNormalizedName } from '../name-normalizer';

describe('Name Normalization', () => {
  describe('normalizeName', () => {
    it('should handle diacritics (accent marks)', () => {
      expect(normalizeName('Nikola Jokić')).toBe('nikola jokic');
      expect(normalizeName('Luka Dončić')).toBe('luka doncic');
      expect(normalizeName('José Alvarado')).toBe('jose alvarado');
      expect(normalizeName('Dāvis Bertāns')).toBe('davis bertans');
      expect(normalizeName('Bogdan Bogdanović')).toBe('bogdan bogdanovic');
    });

    it('should handle apostrophes', () => {
      expect(normalizeName("D'Angelo Russell")).toBe('dangelo russell');
      expect(normalizeName("De'Aaron Fox")).toBe('deaaron fox');
      expect(normalizeName("Shai Gilgeous-Alexander")).toBe('shai gilgeousalexander');
    });

    it('should handle hyphens in names', () => {
      expect(normalizeName('Karl-Anthony Towns')).toBe('karlanthony towns');
      expect(normalizeName('Shai Gilgeous-Alexander')).toBe('shai gilgeousalexander');
      expect(normalizeName('Nickeil Alexander-Walker')).toBe('nickeil alexanderwalker');
    });

    it('should normalize Jr/Jr. variations', () => {
      expect(normalizeName('Gary Trent Jr.')).toBe('gary trent jr');
      expect(normalizeName('Gary Trent Jr')).toBe('gary trent jr');
      expect(normalizeName('Derrick Jones Jr.')).toBe('derrick jones jr');
      expect(normalizeName('Kelly Oubre Jr')).toBe('kelly oubre jr');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeName('LeBron  James')).toBe('lebron james');
      expect(normalizeName('  Anthony Davis  ')).toBe('anthony davis');
    });

    it('should handle mixed cases', () => {
      expect(normalizeName('NIKOLA JOKIC')).toBe('nikola jokic');
      expect(normalizeName('luka doncic')).toBe('luka doncic');
      expect(normalizeName('LeBrOn JaMeS')).toBe('lebron james');
    });

    it('should handle empty strings', () => {
      expect(normalizeName('')).toBe('');
      expect(normalizeName('   ')).toBe('');
    });
  });

  describe('namesMatch', () => {
    it('should match names with different diacritics', () => {
      expect(namesMatch('Nikola Jokić', 'Nikola Jokic')).toBe(true);
      expect(namesMatch('Luka Dončić', 'Luka Doncic')).toBe(true);
      expect(namesMatch('José Alvarado', 'Jose Alvarado')).toBe(true);
    });

    it('should match names with different apostrophes', () => {
      expect(namesMatch("D'Angelo Russell", 'Dangelo Russell')).toBe(true);
      expect(namesMatch("De'Aaron Fox", 'Deaaron Fox')).toBe(true);
    });

    it('should match names with hyphens removed', () => {
      // When hyphen is removed, "Karl-Anthony" becomes "karlanthony" (no space)
      expect(namesMatch('Karl-Anthony Towns', 'KarlAnthony Towns')).toBe(true);
      expect(namesMatch('Shai Gilgeous-Alexander', 'Shai GilgeousAlexander')).toBe(true);
    });

    it('should match names with different Jr variations', () => {
      expect(namesMatch('Gary Trent Jr.', 'Gary Trent Jr')).toBe(true);
      expect(namesMatch('Derrick Jones Jr', 'Derrick Jones Jr.')).toBe(true);
    });

    it('should not match different names', () => {
      expect(namesMatch('LeBron James', 'Anthony Davis')).toBe(false);
      expect(namesMatch('Nikola Jokić', 'Luka Dončić')).toBe(false);
    });
  });

  describe('findByNormalizedName', () => {
    const players = [
      { name: 'Nikola Jokić', team: 'Nuggets', overall: 97 },
      { name: 'Luka Dončić', team: 'Mavs', overall: 95 },
      { name: "D'Angelo Russell", team: 'Lakers', overall: 82 },
      { name: 'José Alvarado', team: 'Pelicans', overall: 77 },
      { name: 'Karl-Anthony Towns', team: 'Knicks', overall: 89 },
      { name: 'Gary Trent Jr.', team: 'Bucks', overall: 78 }
    ];

    it('should find player with diacritics removed', () => {
      const player = findByNormalizedName('Nikola Jokic', players);
      expect(player).toBeTruthy();
      expect(player?.name).toBe('Nikola Jokić');
    });

    it('should find player with apostrophe removed', () => {
      const player = findByNormalizedName('Dangelo Russell', players);
      expect(player).toBeTruthy();
      expect(player?.name).toBe("D'Angelo Russell");
    });

    it('should find player with hyphen removed', () => {
      // When searching, hyphen is removed so "Karl-Anthony" becomes "karlanthony"
      const player = findByNormalizedName('KarlAnthony Towns', players);
      expect(player).toBeTruthy();
      expect(player?.name).toBe('Karl-Anthony Towns');
    });

    it('should find player with Jr variation', () => {
      const player = findByNormalizedName('Gary Trent Jr', players);
      expect(player).toBeTruthy();
      expect(player?.name).toBe('Gary Trent Jr.');
    });

    it('should return null for non-existent player', () => {
      const player = findByNormalizedName('LeBron James', players);
      expect(player).toBeNull();
    });
  });
});
