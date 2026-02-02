import { describe, it, expect } from 'vitest';
import { parseMultiSheetExcel } from './multiSheetExcelParser';
import * as fs from 'fs';
import * as path from 'path';

describe('multiSheetExcelParser', () => {
  it('should parse pistons_mavs_series_package.xlsx correctly', async () => {
    const filePath = path.join('/home/ubuntu/upload', 'pistons_mavs_series_package.xlsx');
    const buffer = fs.readFileSync(filePath);
    
    console.log('[Test] File size:', buffer.length, 'bytes');
    
    const result = await parseMultiSheetExcel(buffer);
    
    console.log('[Test] Parsed result:', JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(result.games).toBeDefined();
    expect(result.games.length).toBeGreaterThan(0);
    
    if (result.games.length > 0) {
      const firstGame = result.games[0];
      console.log('[Test] First game:', JSON.stringify(firstGame, null, 2));
      expect(firstGame.gameNumber).toBeDefined();
      expect(firstGame.team1).toBeDefined();
      expect(firstGame.team2).toBeDefined();
    }
  });
});
