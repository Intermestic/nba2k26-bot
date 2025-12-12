import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function importUpgradeRules() {
  const connection = await createConnection(DATABASE_URL);

  try {
    // Read and parse CSV file
    const csvContent = readFileSync('/home/ubuntu/upload/pasted_content_2.txt', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} upgrade rules to import`);

    // Clear existing rules
    await connection.execute('DELETE FROM upgrade_rules');
    console.log('Cleared existing upgrade rules');

    // Insert each rule
    for (const record of records) {
      await connection.execute(
        'INSERT INTO upgrade_rules (upgradeType, category, ruleText) VALUES (?, ?, ?)',
        [record.UpgradeType, record.Category, record.RuleText]
      );
    }

    console.log(`Successfully imported ${records.length} upgrade rules`);

    // Display summary
    const [summary] = await connection.execute(`
      SELECT upgradeType, COUNT(*) as count
      FROM upgrade_rules
      GROUP BY upgradeType
      ORDER BY upgradeType
    `);

    console.log('\nRules by upgrade type:');
    console.table(summary);

  } catch (error) {
    console.error('Error importing upgrade rules:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

importUpgradeRules().catch(console.error);
