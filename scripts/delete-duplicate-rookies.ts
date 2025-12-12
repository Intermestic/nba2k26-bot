/**
 * Delete duplicate rookie entries that were incorrectly added
 */
import { getDb } from '../server/db.js';
import { players } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const rookieNames = [
  "VJ Edgecombe", "Cooper Flagg", "Cedric Coward", "Kon Knueppel", "Dylan Harper",
  "Ryan Kalkbrenner", "Jeremiah Fears", "Collin Murray-Boyles", "Sion James", "Tre Johnson",
  "Will Richard", "Derik Queen", "Khaman Maluach", "Walter Clayton Jr.", "Asa Newell",
  "Ace Bailey", "Noa Essengue", "Nique Clifford", "Carter Bryant", "Noah Penda",
  "Egor Demin", "Danny Wolf", "Thomas Sorber", "Kasparas Jakucionis", "Yang Hansen",
  "Nolan Traore", "Joan Beringer", "Hugo Gonzalez", "Will Riley", "Drake Powell",
  "Rasheer Fleming", "Johni Broome", "Jase Richardson", "Liam McNeeley", "Adou Thiero",
  "Maxime Raynaud", "Tyrese Proctor", "Ben Saraf", "Yanic Konan Niederhauser", "John Tonje",
  "Amari Williams", "Jamir Watkins", "Javon Small", "Alijah Martin", "Micah Peavy",
  "Brooks Barnhizer", "Jahmyl Telfort", "Chris Youngblood", "Moussa Cisse", "Tamar Bates",
  "Mark Sears", "Hunter Sallis", "Vladislav Goldin", "Ryan Nembhard", "Hunter Dickinson",
  "Miles Kelly", "Kobe Sanders", "Rocco Zikarsky", "Max Shulga"
];

async function deleteDuplicates() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  console.log(`Checking for duplicates among ${rookieNames.length} rookies...`);

  let deleted = 0;

  for (const name of rookieNames) {
    // Find all players with this name
    const allPlayers = await db.select().from(players).where(eq(players.name, name));
    
    if (allPlayers.length > 1) {
      console.log(`Found ${allPlayers.length} entries for ${name}`);
      
      // Sort by ID to keep the original (usually has shorter/simpler ID)
      // Delete entries with isRookie=1 (the duplicates we added)
      const duplicates = allPlayers.filter(p => p.isRookie === 1);
      
      for (const dup of duplicates) {
        await db.delete(players).where(eq(players.id, dup.id));
        console.log(`  ✓ Deleted duplicate: ${dup.id}`);
        deleted++;
      }
    }
  }

  console.log(`\n✅ Complete! Deleted ${deleted} duplicate entries.`);
  process.exit(0);
}

deleteDuplicates().catch((error) => {
  console.error('Error deleting duplicates:', error);
  process.exit(1);
});
