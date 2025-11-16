/**
 * Add Class of 2025 rookies to the database
 */
import { getDb } from '../server/db.js';
import { players } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const rookies2025 = [
  { name: "VJ Edgecombe", height: "6'5\"", overall: 81 },
  { name: "Cooper Flagg", height: "6'9\"", overall: 80 },
  { name: "Cedric Coward", height: "6'5\"", overall: 80 },
  { name: "Kon Knueppel", height: "6'7\"", overall: 79 },
  { name: "Dylan Harper", height: "6'6\"", overall: 79 },
  { name: "Ryan Kalkbrenner", height: "7'1\"", overall: 78 },
  { name: "Jeremiah Fears", height: "6'4\"", overall: 78 },
  { name: "Collin Murray-Boyles", height: "6'7\"", overall: 77 },
  { name: "Sion James", height: "6'6\"", overall: 76 },
  { name: "Tre Johnson", height: "6'6\"", overall: 76 },
  { name: "Will Richard", height: "6'5\"", overall: 75 },
  { name: "Derik Queen", height: "6'10\"", overall: 74 },
  { name: "Khaman Maluach", height: "7'2\"", overall: 74 },
  { name: "Walter Clayton Jr.", height: "6'2\"", overall: 73 },
  { name: "Asa Newell", height: "6'11\"", overall: 73 },
  { name: "Ace Bailey", height: "6'9\"", overall: 73 },
  { name: "Noa Essengue", height: "6'9\"", overall: 72 },
  { name: "Nique Clifford", height: "6'5\"", overall: 72 },
  { name: "Carter Bryant", height: "6'8\"", overall: 72 },
  { name: "Noah Penda", height: "6'8\"", overall: 72 },
  { name: "Egor Demin", height: "6'9\"", overall: 72 },
  { name: "Danny Wolf", height: "7'0\"", overall: 71 },
  { name: "Thomas Sorber", height: "6'10\"", overall: 71 },
  { name: "Kasparas Jakucionis", height: "6'6\"", overall: 71 },
  { name: "Yang Hansen", height: "7'2\"", overall: 70 },
  { name: "Nolan Traore", height: "6'4\"", overall: 70 },
  { name: "Joan Beringer", height: "6'11\"", overall: 70 },
  { name: "Hugo Gonzalez", height: "6'6\"", overall: 70 },
  { name: "Will Riley", height: "6'8\"", overall: 70 },
  { name: "Drake Powell", height: "6'6\"", overall: 70 },
  { name: "Rasheer Fleming", height: "6'9\"", overall: 70 },
  { name: "Johni Broome", height: "6'10\"", overall: 70 },
  { name: "Jase Richardson", height: "6'3\"", overall: 70 },
  { name: "Liam McNeeley", height: "6'7\"", overall: 70 },
  { name: "Adou Thiero", height: "6'8\"", overall: 70 },
  { name: "Maxime Raynaud", height: "7'1\"", overall: 70 },
  { name: "Tyrese Proctor", height: "6'5\"", overall: 69 },
  { name: "Ben Saraf", height: "6'5\"", overall: 69 },
  { name: "Yanic Konan Niederhauser", height: "6'11\"", overall: 69 },
  { name: "John Tonje", height: "6'5\"", overall: 69 },
  { name: "Amari Williams", height: "6'10\"", overall: 69 },
  { name: "Jamir Watkins", height: "6'7\"", overall: 69 },
  { name: "Javon Small", height: "6'2\"", overall: 69 },
  { name: "Alijah Martin", height: "6'2\"", overall: 69 },
  { name: "Micah Peavy", height: "6'7\"", overall: 69 },
  { name: "Brooks Barnhizer", height: "6'6\"", overall: 69 },
  { name: "Jahmyl Telfort", height: "6'7\"", overall: 68 },
  { name: "Chris Youngblood", height: "6'4\"", overall: 68 },
  { name: "Moussa Cisse", height: "6'11\"", overall: 68 },
  { name: "Tamar Bates", height: "6'5\"", overall: 68 },
  { name: "Mark Sears", height: "6'1\"", overall: 68 },
  { name: "Hunter Sallis", height: "6'5\"", overall: 68 },
  { name: "Vladislav Goldin", height: "7'0\"", overall: 68 },
  { name: "Ryan Nembhard", height: "6'0\"", overall: 68 },
  { name: "Hunter Dickinson", height: "7'1\"", overall: 68 },
  { name: "Miles Kelly", height: "6'6\"", overall: 68 },
  { name: "Kobe Sanders", height: "6'8\"", overall: 68 },
  { name: "Rocco Zikarsky", height: "7'4\"", overall: 68 },
  { name: "Max Shulga", height: "6'4\"", overall: 68 },
];

async function addRookies() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  console.log(`Adding ${rookies2025.length} Class of 2025 rookies...`);

  let added = 0;
  let updated = 0;

  for (const rookie of rookies2025) {
    // Check if player exists by NAME (not ID)
    const existing = await db.select().from(players).where(eq(players.name, rookie.name));
    
    if (existing.length > 0) {
      // Update existing player using their actual ID
      await db.update(players)
        .set({
          height: rookie.height,
          overall: rookie.overall,
          isRookie: 1,
          draftYear: 2025,
          updatedAt: new Date(),
        })
        .where(eq(players.id, existing[0].id));
      updated++;
      console.log(`✓ Updated: ${rookie.name} (${rookie.overall} OVR)`);
    } else {
      // Insert new player
      await db.insert(players).values({
        id: playerId,
        name: rookie.name,
        height: rookie.height,
        overall: rookie.overall,
        isRookie: 1,
        draftYear: 2025,
        source: 'manual',
      });
      added++;
      console.log(`✓ Added: ${rookie.name} (${rookie.overall} OVR)`);
    }
  }

  console.log(`\n✅ Complete! Added ${added} new rookies, updated ${updated} existing players.`);
  process.exit(0);
}

addRookies().catch((error) => {
  console.error('Error adding rookies:', error);
  process.exit(1);
});
