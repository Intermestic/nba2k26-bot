import * as XLSX from 'xlsx';

/**
 * Excel to CSV Converter
 * 
 * Converts Excel files (XLS/XLSX) to CSV format for processing
 */

/**
 * Convert Excel file buffer to CSV string
 * @param buffer - Excel file buffer
 * @param sheetName - Optional sheet name (defaults to first sheet)
 * @returns CSV string
 */
export function excelToCSV(buffer: Buffer, sheetName?: string): string {
  console.log('[ExcelConverter] Converting Excel file to CSV...');
  console.log('[ExcelConverter] Buffer size:', buffer.length, 'bytes');
  
  // Read Excel file from buffer
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  console.log('[ExcelConverter] Workbook loaded');
  console.log('[ExcelConverter] Available sheets:', workbook.SheetNames.join(', '));
  
  // Get target sheet (first sheet by default)
  const targetSheetName = sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];
  
  if (!worksheet) {
    throw new Error(`Sheet "${targetSheetName}" not found in Excel file`);
  }
  
  console.log('[ExcelConverter] Using sheet:', targetSheetName);
  
  // Convert worksheet to CSV
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  console.log('[ExcelConverter] Conversion complete');
  console.log('[ExcelConverter] CSV length:', csv.length, 'characters');
  console.log('[ExcelConverter] CSV preview:', csv.substring(0, 200));
  
  return csv;
}

/**
 * Detect if file is Excel format based on extension
 */
export function isExcelFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'xls' || ext === 'xlsx';
}

/**
 * Convert Excel file to CSV with error handling
 */
export async function convertExcelToCSV(
  fileBuffer: Buffer,
  filename: string,
  sheetName?: string
): Promise<string> {
  try {
    console.log('[ExcelConverter] Starting conversion for:', filename);
    
    if (!isExcelFile(filename)) {
      console.log('[ExcelConverter] Not an Excel file, returning as-is');
      return fileBuffer.toString('utf-8');
    }
    
    const csv = excelToCSV(fileBuffer, sheetName);
    
    console.log('[ExcelConverter] Conversion successful');
    return csv;
  } catch (error: any) {
    console.error('[ExcelConverter] Conversion failed:', error.message);
    throw new Error(`Failed to convert Excel file: ${error.message}`);
  }
}
