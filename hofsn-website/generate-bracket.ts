import { generateImage } from "./server/_core/imageGeneration";
import * as fs from "fs";

async function generateBracket() {
  console.log("Generating second round playoff bracket...");
  
  const prompt = `Professional sports playoff bracket graphic for Season 17 Playoffs with dark navy/black background and gold/amber accents. Hall of Fame Basketball Association branding at top center with gold shield logo. HOFSN logo at bottom center.

Bracket structure showing 16 teams with SECOND ROUND matchups filled in:

LEFT SIDE (top to bottom):
- First Round: #1 Toronto Raptors (red claw logo) vs #16 Indiana Pacers - Raptors WIN 2-0
- First Round: #8 San Antonio Spurs vs #9 Milwaukee Bucks (green deer logo) - Bucks WIN 2-1
- SECOND ROUND: #1 RAPTORS vs #9 BUCKS (0-0) - teams highlighted/advanced
- First Round: #4 Washington Wizards (red/blue logo) vs #13 Portland Trail Blazers - Wizards WIN 2-0
- First Round: #5 Houston Rockets (red R logo) vs #12 Cleveland Cavaliers - Rockets WIN 2-0
- SECOND ROUND: #4 WIZARDS vs #5 ROCKETS (0-0) - teams highlighted/advanced

RIGHT SIDE (top to bottom):
- First Round: #2 Atlanta Hawks (red hawk logo) vs #15 Charlotte Hornets - Hawks WIN 2-0
- First Round: #7 Denver Nuggets (gold pickaxe logo) vs #10 Utah Jazz - Nuggets WIN 2-0
- SECOND ROUND: #2 HAWKS vs #7 NUGGETS (0-0) - teams highlighted/advanced
- First Round: #3 Sacramento Kings (purple crown logo) vs #14 Chicago Bulls - Kings WIN 2-0
- First Round: #6 Detroit Pistons (red/blue logo) vs #11 Dallas Mavericks - Pistons WIN 2-0
- SECOND ROUND: #3 KINGS vs #6 PISTONS (0-0) - teams highlighted/advanced

CENTER: Championship trophy placeholder with golden glow, 'SEASON 17 PLAYOFFS' text in gold.

Style: Premium ESPN/NBA broadcast quality, gold bracket lines connecting matchups, team logos clearly visible, seed numbers in gold circles, winning teams highlighted with glow effect, eliminated teams slightly faded. Dark wood floor texture at bottom.`;

  const result = await generateImage({
    prompt,
    aspectRatio: "landscape"
  });
  
  console.log("Generated bracket URL:", result.url);
  
  // Download the image
  const response = await fetch(result.url);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync("/home/ubuntu/szn17-playoff-bracket-r2-new.png", buffer);
  console.log("Saved to /home/ubuntu/szn17-playoff-bracket-r2-new.png");
}

generateBracket().catch(console.error);
