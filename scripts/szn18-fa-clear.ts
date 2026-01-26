import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log('Completing SZN 18 FA Transition...\n');
  
  try {
    // 1. Verify FA coins are reset
    console.log('1. Verifying FA coins...');
    const coins = await db.execute(sql`SELECT team, coinsRemaining FROM team_coins ORDER BY team`);
    const teams = coins[0] as any[];
    const allReset = teams.every((t: any) => t.coinsRemaining === 100);
    console.log(`✅ All ${teams.length} teams have 100 FA coins: ${allReset ? 'YES' : 'NO'}\n`);
    
    // 2. Clear old FA transactions
    console.log('2. Clearing old FA transactions...');
    const transactionsBefore = await db.execute(sql`SELECT COUNT(*) as count FROM fa_transactions`);
    const txCount = (transactionsBefore[0] as any[])[0].count;
    console.log(`Found ${txCount} old FA transactions`);
    
    if (txCount > 0) {
      await db.execute(sql`DELETE FROM fa_transactions`);
      console.log(`✅ Cleared ${txCount} FA transactions\n`);
    } else {
      console.log(`✅ No transactions to clear\n`);
    }
    
    // 3. Clear pending FA bids
    console.log('3. Clearing pending FA bids...');
    const bidsBefore = await db.execute(sql`SELECT COUNT(*) as count FROM fa_bids`);
    const bidCount = (bidsBefore[0] as any[])[0].count;
    console.log(`Found ${bidCount} pending bids`);
    
    if (bidCount > 0) {
      await db.execute(sql`DELETE FROM fa_bids`);
      console.log(`✅ Cleared ${bidCount} pending bids\n`);
    } else {
      console.log(`✅ No bids to clear\n`);
    }
    
    // 4. Final verification
    console.log('========== SZN 18 FA SYSTEM STATUS ==========\n');
    
    const finalCoins = await db.execute(sql`SELECT team, coinsRemaining FROM team_coins ORDER BY team`);
    const finalTeams = finalCoins[0] as any[];
    
    console.log('Team FA Coins (showing first 10):');
    finalTeams.slice(0, 10).forEach((team: any) => {
      console.log(`  ${team.team.padEnd(20)} - ${team.coinsRemaining} coins`);
    });
    if (finalTeams.length > 10) {
      console.log(`  ... and ${finalTeams.length - 10} more teams`);
    }
    
    const finalTransactions = await db.execute(sql`SELECT COUNT(*) as count FROM fa_transactions`);
    const finalBids = await db.execute(sql`SELECT COUNT(*) as count FROM fa_bids`);
    
    console.log(`\n✅ FA Transactions: ${(finalTransactions[0] as any[])[0].count}`);
    console.log(`✅ Pending Bids: ${(finalBids[0] as any[])[0].count}`);
    console.log(`\n🎉 SZN 18 FA system is ready!`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error during transition:', error);
    process.exit(1);
  }
}

main();
