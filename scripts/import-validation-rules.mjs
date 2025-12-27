import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log('🗑️  Clearing existing validation rules...');
  await connection.execute('DELETE FROM validation_rules');
  console.log('✅ Cleared all existing rules\n');

  console.log('📖 Reading rules from CSV...');
  const csvPath = path.join(__dirname, '../../upload/pasted_content.txt');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  // Skip header
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  console.log(`Found ${dataLines.length} rules to import\n`);

  const rules = [];
  let id = 1;

  for (const line of dataLines) {
    // Parse CSV line (handle commas in quoted strings)
    const match = line.match(/^([^,]+),([^,]+),"(.+)"$/);
    if (!match) {
      console.warn(`⚠️  Skipping malformed line: ${line}`);
      continue;
    }

    const [, upgradeType, category, ruleText] = match;
    
    rules.push({
      id,
      name: `${upgradeType}_${category}_${id}`.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      description: ruleText.trim(),
      ruleType: upgradeType.trim(),
      category: category.trim(),
      enabled: 1,
      config: JSON.stringify({ ruleText: ruleText.trim() })
    });

    id++;
  }

  console.log('💾 Inserting rules into database...');
  
  for (const rule of rules) {
    await connection.execute(
      'INSERT INTO validation_rules (id, name, description, ruleType, category, enabled, config) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [rule.id, rule.name, rule.description, rule.ruleType, rule.category, rule.enabled, rule.config]
    );
  }

  console.log(`✅ Imported ${rules.length} rules successfully\n`);

  // Show summary by upgrade type
  const summary = {};
  for (const rule of rules) {
    summary[rule.ruleType] = (summary[rule.ruleType] || 0) + 1;
  }

  console.log('📊 Rules by upgrade type:');
  for (const [type, count] of Object.entries(summary)) {
    console.log(`   ${type}: ${count} rules`);
  }

  await connection.end();
}

main().catch(console.error);
