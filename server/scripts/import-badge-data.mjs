import { createConnection } from 'mysql2/promise';
import openpyxl from 'openpyxl';
import * as fs from 'fs';

const DB_URL = process.env.DATABASE_URL;

async function importBadgeData() {
  const connection = await createConnection(DB_URL);
  
  console.log('[Import] Reading spreadsheet...');
  
  // Read Excel file using Python
  const { execSync } = await import('child_process');
  const pythonScript = `
import openpyxl
import json

wb = openpyxl.load_workbook('/home/ubuntu/upload/HoF_Upgrades_Master_WithGlossary.xlsx')

# Badge Requirements
badge_reqs = []
ws = wb['Badge Caps']
for row in list(ws.iter_rows(values_only=True))[1:]:  # Skip header
    badge_reqs.append({
        'category': row[1],
        'badgeName': row[2],
        'attribute': row[3],
        'bronzeMin': row[4],
        'silverMin': row[5],
        'goldMin': row[6],
        'minHeight': row[7],
        'maxHeight': row[8]
    })

# Badge Abbreviations
badge_abbrevs = []
ws = wb['Badge Glossary']
for row in list(ws.iter_rows(values_only=True))[1:]:  # Skip header
    badge_abbrevs.append({
        'badgeName': row[0],
        'description': row[1],
        'abbreviation': row[2]
    })

print(json.dumps({'requirements': badge_reqs, 'abbreviations': badge_abbrevs}))
`;
  
  const result = execSync(`python3.11 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, {
    encoding: 'utf-8'
  });
  
  const data = JSON.parse(result);
  
  console.log(`[Import] Found ${data.requirements.length} badge requirements`);
  console.log(`[Import] Found ${data.abbreviations.length} badge abbreviations`);
  
  // Clear existing data
  await connection.query('DELETE FROM badge_requirements');
  await connection.query('DELETE FROM badge_abbreviations');
  
  // Insert badge requirements
  for (const req of data.requirements) {
    await connection.query(
      `INSERT INTO badge_requirements (category, badgeName, attribute, bronzeMin, silverMin, goldMin, minHeight, maxHeight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.category, req.badgeName, req.attribute, req.bronzeMin, req.silverMin, req.goldMin, req.minHeight, req.maxHeight]
    );
  }
  
  // Insert badge abbreviations
  for (const abbrev of data.abbreviations) {
    // Determine category from requirements
    const categoryRow = data.requirements.find(r => r.badgeName === abbrev.badgeName);
    const category = categoryRow ? categoryRow.category : null;
    
    await connection.query(
      `INSERT INTO badge_abbreviations (badgeName, abbreviation, description, category)
       VALUES (?, ?, ?, ?)`,
      [abbrev.badgeName, abbrev.abbreviation, abbrev.description, category]
    );
  }
  
  console.log('[Import] ✅ Badge data imported successfully!');
  
  await connection.end();
}

importBadgeData().catch(console.error);
