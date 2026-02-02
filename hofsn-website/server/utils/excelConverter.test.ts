import { describe, it, expect } from 'vitest';
import { isExcelFile, excelToCSV } from './excelConverter';
import * as fs from 'fs';
import * as path from 'path';

describe('Excel Converter', () => {
  it('should detect Excel files by extension', () => {
    expect(isExcelFile('test.xlsx')).toBe(true);
    expect(isExcelFile('test.xls')).toBe(true);
    expect(isExcelFile('TEST.XLSX')).toBe(true);
    expect(isExcelFile('test.csv')).toBe(false);
    expect(isExcelFile('test.txt')).toBe(false);
  });

  it('should convert Excel file to CSV', () => {
    // Read test Excel file
    const testFile = path.join(process.cwd(), 'test-series.xlsx');
    
    if (!fs.existsSync(testFile)) {
      console.log('Test Excel file not found, skipping test');
      return;
    }
    
    const buffer = fs.readFileSync(testFile);
    const csv = excelToCSV(buffer);
    
    // Verify CSV contains expected data
    expect(csv).toContain('Type');
    expect(csv).toContain('GameNumber');
    expect(csv).toContain('Player');
    expect(csv).toContain('R.J. Barrett');
    expect(csv).toContain('Bucks');
    expect(csv.length).toBeGreaterThan(100);
  });
});
