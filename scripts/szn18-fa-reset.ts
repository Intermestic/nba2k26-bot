import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log('Starting SZN 18 FA Transition...\n');
  
  try {
    // 1. Check current FA coins
    console.log('1. Checking current FA coins...');
    const currentCoins = await db.execute(sql`SELECT team, coinsRemaining FROM team_coins ORDER BY team`);
    console.log(`Found ${(currentCoins[0] as any[]).length} teams with FA coins\n`);
    
    // 2. Reset all teams to 100 FA coins
    console.log('2. Resetting all teams to 100 FA coins...');
    const resetResult = await db.execute(sql`UPDATE team_coins SET coinsRemaining = 100`);
    console.log(`✅ Reset ${(resetResult[0] as any).affectedRows} teams to 100 coins\n`);
    
    // 3. Archive old FA transactions
    console.log('3. Checking FA transactions to archive...');
    const oldTransactions = await db.execute(sql`SELECT COUNT(*) as count FROM fa_transactions`);
    const transactionCount = (oldTransactions[0] as any[])[0].count;
    console.log(`Found ${transactionCount} old FA transactions`);
    
    if (transactionCount > 0) {
      // Create archive table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fa_transactions_szn17_archive (
          id INT PRIMARY KEY,
          player_name VARCHAR(255),
          from_team VARCHAR(100),
          to_team VARCHAR(100),
          bid_amount INT,
          transaction_type VARCHAR(50),
          timestamp TIMESTAMP,
          season VARCHAR(20)
        )
      `);
      
      // Copy to archive
      await db.execute(sql`
        INSERT INTO fa_transactions_szn17_archive 
        SELECT *, 'SZN 17' as season FROM fa_transactions
      `);
      
      // Clear current table
      await db.execute(sql`DELETE FROM fa_transactions`);
      console.log(`✅ Archived ${transactionCount} transactions to fa_transactions_szn17_archive\n`);
    }
    
    // 4. Clear pending FA bids
    console.log('4. Checking pending FA bids...');
    const pendingBids = await db.execute(sql`SELECT COUNT(*) as count FROM fa_bids`);
    const bidCount = (pendingBids[0] as any[])[0].count;
    console.log(`Found ${bidCount} pending bids`);
    
    if (bidCount > 0) {
      // Archive bids before clearing
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fa_bids_szn17_archive (
          id INT PRIMARY KEY,
          player_name VARCHAR(255),
          team VARCHAR(100),
          bid_amount INT,
          bid_time TIMESTAMP,
          status VARCHAR(50),
          season VARCHAR(20)
        )
      `);
      
      await db.execute(sql`
        INSERT INTO fa_bids_szn17_archive 
        SELECT *, 'SZN 17' as season FROM fa_bids
      `);
      
      await db.execute(sql`DELETE FROM fa_bids`);
      console.log(`✅ Archived and cleared ${bidCount} pending bids\n`);
    }
    
    // 5. Verify final state
    console.log('5. Verifying final state...');
    const finalCoins = await db.execute(sql`SELECT team, coinsRemaining FROM team_coins ORDER BY team`);
    const finalTeams = finalCoins[0] as any[];
    
    console.log('\n========== FINAL FA COINS ==========');
    finalTeams.forEach((team: any) => {
      console.log(`${team.team.padEnd(20)} - ${team.coinsRemaining} coins`);
    });
    
    const finalTransactions = await db.execute(sql`SELECT COUNT(*) as count FROM fa_transactions`);
    const finalBids = await db.execute(sql`SELECT COUNT(*) as count FROM fa_bids`);
    
    console.log('\n========== SUMMARY ==========');
    console.log(`✅ All teams reset to 100 FA coins`);
    console.log(`✅ FA transactions cleared: ${(finalTransactions[0] as any[])[0].count} remaining`);
    console.log(`✅ Pending bids cleared: ${(finalBids[0] as any[])[0].count} remaining`);
    console.log(`\n🎉 SZN 18 FA system ready!`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error during transition:', error);
    process.exit(1);
  }
}

main();
