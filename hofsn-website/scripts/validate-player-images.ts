#!/usr/bin/env tsx
/**
 * Player Headshot Validation Script
 * 
 * Scans all game recaps for player names and checks if they have
 * valid headshot mappings in playerImages.ts
 * 
 * Usage: pnpm tsx scripts/validate-player-images.ts
 */

import { season17GameRecaps } from '../shared/newGameRecaps';

// Import the player ID mapping from playerImages.ts
const playerIds: Record<string, string> = {
  // Season 16 Award Winners
  "Luka Dončić": "1629029",
  "Luka Doncic": "1629029",
  "Stephen Curry": "201939",
  "Steph Curry": "201939",
  "Jalen Suggs": "1630591",
  "Brandin Podziemski": "1641764",
  "Ace Bailey": "1642846",
  
  // Other Featured Players
  "Jayson Tatum": "1628369",
  "Nikola Jokic": "203999",
  "Nikola Jokić": "203999",
  "Ja Morant": "1629630",
  "Julius Randle": "203944",
  "Dejounte Murray": "1627749",
  "Khris Middleton": "203114",
  "Brandon Miller": "1641705",
  "Isaac Okoro": "1630171",
  "Aaron Gordon": "203932",
  "Mark Sears": "placeholder",
  "Bam Adebayo": "1628389",
  "Jimmy Butler": "202710",
  "Naz Reid": "1629675",
  "LeBron James": "2544",
  "De'Aaron Fox": "1628368",
  "Collin Sexton": "1629012",
  "Cason Wallace": "1641738",
  "Donovan Mitchell": "1628378",
  "Alex Caruso": "1627936",
  "Anthony Edwards": "1630162",
  "Tyrese Haliburton": "1630169",
  "Joel Embiid": "203954",
  "Kevin Durant": "201142",
  "Zach LaVine": "203897",
  "Trae Young": "1629027",
  "Giannis Antetokounmpo": "203507",
  "Devin Booker": "1626164",
  "Jalen Green": "1630224",
  "Jordan Poole": "1629673",
  "LaMelo Ball": "1630163",
  "Karl-Anthony Towns": "1626157",
  "Damian Lillard": "203081",
  "Brandon Ingram": "1627742",
  "Jalen Williams": "1631116",
  "Domantas Sabonis": "1627734",
  "Josh Giddey": "1630581",
  "OG Anunoby": "1628384",
  "Shai Gilgeous-Alexander": "1628983",
  "Paolo Banchero": "1631094",
  "Ty Jerome": "1629660",
  "Kentavious Caldwell-Pope": "203484",
  "K. Caldwell-Pope": "203484",
  "Coby White": "1629632",
  "Dylan Harper": "1642269",
  "Zaccharie Risacher": "1642268",
  "Bennedict Mathurin": "1631112",
  "Jerami Grant": "203924",
  "Saddiq Bey": "1630180",
  "Jaime Jaquez Jr.": "1641705",
  "Robert Williams III": "1629057",
  "Adem Bona": "1642270",
  "Cam Johnson": "1629661",
  "Donte DiVincenzo": "1628978",
  "Harrison Barnes": "203084",
  "Stephon Castle": "1642271",
  "Collin Murray-Boyles": "1642272",
  "Andre Drummond": "203083",
  
  // Additional Award Winners
  "Dyson Daniels": "1631096",
  "Devin Carter": "1641794",
  "Amen Thompson": "1641705",
  "Immanuel Quickley": "1630193",
  "Isaiah Collier": "1642268",
  "Miles Bridges": "1628970",
  "Matas Buzelis": "1641705",
  "Russell Westbrook": "201566",
  "Alex Sarr": "1641752",
  "Shaedon Sharpe": "1631107",
  "Cam Thomas": "1630560",
  "Ausar Thompson": "1641709",
  "Nic Claxton": "1629651",
  "Obi Toppin": "1630167",
  "Bol Bol": "1629626",
  "Victor Wembanyama": "1641705",
  "Tobias Harris": "202699",
  "DeMar DeRozan": "201942",
  "Anthony Davis": "203076",
};

interface ValidationResult {
  playerName: string;
  gameId: string;
  gameTitle: string;
  status: 'missing' | 'placeholder' | 'valid';
  playerId?: string;
}

function extractPlayerNames(recap: typeof season17GameRecaps[0]): string[] {
  const players: string[] = [];
  
  // Extract from keyPlayers array
  recap.keyPlayers.forEach(player => {
    // keyPlayers is an array of objects with name, team, stats
    players.push(player.name);
  });
  
  return players;
}

function validatePlayers(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const uniquePlayers = new Set<string>();
  
  console.log('🔍 Scanning game recaps for player headshots...\n');
  
  season17GameRecaps.forEach(recap => {
    const players = extractPlayerNames(recap);
    
    players.forEach(playerName => {
      // Skip if we've already checked this player
      if (uniquePlayers.has(playerName)) return;
      uniquePlayers.add(playerName);
      
      const playerId = playerIds[playerName];
      
      if (!playerId) {
        results.push({
          playerName,
          gameId: recap.id,
          gameTitle: recap.title,
          status: 'missing'
        });
      } else if (playerId === 'placeholder') {
        results.push({
          playerName,
          gameId: recap.id,
          gameTitle: recap.title,
          status: 'placeholder',
          playerId
        });
      } else {
        results.push({
          playerName,
          gameId: recap.id,
          gameTitle: recap.title,
          status: 'valid',
          playerId
        });
      }
    });
  });
  
  return results;
}

function generateReport(results: ValidationResult[]): void {
  const missing = results.filter(r => r.status === 'missing');
  const placeholder = results.filter(r => r.status === 'placeholder');
  const valid = results.filter(r => r.status === 'valid');
  
  console.log('📊 VALIDATION REPORT\n');
  console.log('='.repeat(60));
  console.log(`Total unique players found: ${results.length}`);
  console.log(`✅ Valid headshots: ${valid.length}`);
  console.log(`⚠️  Placeholder headshots: ${placeholder.length}`);
  console.log(`❌ Missing headshots: ${missing.length}`);
  console.log('='.repeat(60));
  console.log('');
  
  if (missing.length > 0) {
    console.log('❌ MISSING PLAYER IDs:\n');
    missing.forEach(result => {
      console.log(`  • ${result.playerName}`);
      console.log(`    Game: ${result.gameTitle}`);
      console.log('');
    });
    console.log('💡 Add these players to client/src/lib/playerImages.ts\n');
  }
  
  if (placeholder.length > 0) {
    console.log('⚠️  PLACEHOLDER PLAYER IDs:\n');
    placeholder.forEach(result => {
      console.log(`  • ${result.playerName}`);
      console.log(`    Game: ${result.gameTitle}`);
      console.log('');
    });
    console.log('💡 Replace placeholders with actual NBA player IDs\n');
  }
  
  if (missing.length === 0 && placeholder.length === 0) {
    console.log('✨ All players have valid headshot mappings!\n');
  }
}

// Run validation
const results = validatePlayers();
generateReport(results);

// Exit with error code if there are missing players
if (results.some(r => r.status === 'missing' || r.status === 'placeholder')) {
  process.exit(1);
}
