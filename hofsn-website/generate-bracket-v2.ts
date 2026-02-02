import { generateImage } from "./server/_core/imageGeneration";
import * as fs from "fs";

async function generateBracket() {
  console.log("Generating second round playoff bracket...");
  
  const prompt = `Professional NBA-style playoff bracket graphic. Dark navy blue background with gold accents and glowing effects.

LAYOUT: 16-team single elimination bracket with teams on left and right sides converging to championship trophy in center.

LEFT SIDE (4 first-round matchups, 2 second-round matchups):
First Round (completed - show with checkmarks or "FINAL"):
- #1 RAPTORS beat #16 PACERS (2-0) ✓
- #8 SPURS lost to #9 BUCKS (1-2) ✓
- #4 WIZARDS beat #13 BLAZERS (2-0) ✓
- #5 ROCKETS beat #12 CAVALIERS (2-0) ✓

Second Round (active - highlight these):
- #1 RAPTORS vs #9 BUCKS (0-0) - ACTIVE
- #4 WIZARDS vs #5 ROCKETS (0-0) - ACTIVE

RIGHT SIDE (4 first-round matchups, 2 second-round matchups):
First Round (completed):
- #2 HAWKS beat #15 HORNETS (2-0) ✓
- #7 NUGGETS beat #10 JAZZ (2-0) ✓
- #3 KINGS beat #14 BULLS (2-0) ✓
- #6 PISTONS beat #11 MAVERICKS (2-0) ✓

Second Round (active - highlight these):
- #2 HAWKS vs #7 NUGGETS (0-0) - ACTIVE
- #3 KINGS vs #6 PISTONS (0-0) - ACTIVE

CENTER: Golden championship trophy with "SEASON 17 PLAYOFFS" text. "Hall of Fame Basketball Association" logo at top. "HOFSN" logo at bottom.

Style: ESPN/TNT broadcast quality, team names in gold text, bracket lines in gold, active matchups highlighted with glow effect, completed matchups slightly faded. Professional sports broadcast aesthetic.`;

  const result = await generateImage({
    prompt,
    aspectRatio: "landscape"
  });
  
  console.log("Generated bracket URL:", result.url);
  
  // Download the image
  const response = await fetch(result.url);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync("/home/ubuntu/szn17-playoff-bracket-r2-ai.png", buffer);
  console.log("Saved to /home/ubuntu/szn17-playoff-bracket-r2-ai.png");
}

generateBracket().catch(console.error);
