import axios from 'axios';
import * as cheerio from 'cheerio';

async function testBadgeScraping() {
  const testPlayers = [
    { name: 'LeBron James', url: 'https://www.2kratings.com/lebron-james' },
    { name: 'Stephen Curry', url: 'https://www.2kratings.com/stephen-curry' },
    { name: 'Giannis Antetokounmpo', url: 'https://www.2kratings.com/giannis-antetokounmpo' }
  ];

  for (const player of testPlayers) {
    try {
      console.log(`\nTesting: ${player.name}`);
      console.log(`URL: ${player.url}`);
      
      const response = await axios.get(player.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Try multiple patterns to find badge count
      const bodyText = $('body').text();
      
      // Pattern 1: "X Badges"
      const pattern1 = bodyText.match(/(\d+)\s*Badges?/i);
      if (pattern1) {
        console.log(`✓ Found via Pattern 1: ${pattern1[1]} badges`);
        continue;
      }
      
      // Pattern 2: Look for badge-related elements
      const badgeElements = $('[class*="badge"], [id*="badge"]');
      console.log(`Found ${badgeElements.length} badge-related elements`);
      
      // Pattern 3: Search for numbers near "badge" text
      const pattern3 = bodyText.match(/badge[s]?\s*[:\-]?\s*(\d+)/i);
      if (pattern3) {
        console.log(`✓ Found via Pattern 3: ${pattern3[1]} badges`);
        continue;
      }
      
      console.log('✗ Could not find badge count');
      
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
    }
  }
}

testBadgeScraping();
