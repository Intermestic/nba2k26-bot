/**
 * Highlight Card Generator
 * 
 * Generates Discord-optimized highlight cards for playoff series
 * - Uses real player headshots from playerImages.ts database
 * - Generates clean card with simple prompt
 * - Overlays official HoFBA and HoFSN logos via Python PIL
 * - Optimizes to <1MB JPEG for Discord compatibility
 */

import { generateImage } from '../_core/imageGeneration';
import { storagePut } from '../storage';
import { getPlayerHeadshot } from '../../client/src/lib/playerImages';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface SeriesSummary {
  winningTeam: string;
  losingTeam: string;
  seriesScore: string; // e.g. "2-0"
  mvpPlayer: string; // e.g. "B. Ingram"
  mvpStats: {
    ppg: number;
    rpg: number;
    apg: number;
  };
}

export interface HighlightCardResult {
  imageUrl: string;
  localPath: string;
  fileSize: number;
  title: string;
  stat: string;
}

/**
 * Generate a highlight card for a playoff series
 */
export async function generateHighlightCard(seriesSummary: SeriesSummary): Promise<HighlightCardResult> {
  console.log('[HighlightCardGenerator] Starting card generation...');
  console.log('[HighlightCardGenerator] Series:', seriesSummary.winningTeam, 'vs', seriesSummary.losingTeam);
  console.log('[HighlightCardGenerator] MVP:', seriesSummary.mvpPlayer, `(${seriesSummary.mvpStats.ppg} PPG)`);

  // Get player headshot URL
  const playerHeadshotUrl = getPlayerHeadshot(seriesSummary.mvpPlayer);
  console.log('[HighlightCardGenerator] Using player headshot:', playerHeadshotUrl);

  // SIMPLE PROMPT - Just like the original cards
  const prompt = `Professional sports highlight card for ${seriesSummary.winningTeam} playoff series victory. 
Digital approximation of ${seriesSummary.mvpPlayer} with a photorealistic body and face in the HoFBA ${seriesSummary.winningTeam} team uniform.
Series result: ${seriesSummary.winningTeam} advance ${seriesSummary.seriesScore}.
Key stat: ${seriesSummary.mvpStats.ppg} PPG.
Dark background, bold text, professional ESPN/NBA broadcast style.
16:9 landscape format.`;

  console.log('[HighlightCardGenerator] Generating card with real player photo...');

  // Generate base image with player headshot as reference
  const { url: baseImageUrl } = await generateImage({
    prompt,
    originalImages: playerHeadshotUrl ? [{
      url: playerHeadshotUrl,
      mimeType: 'image/png'
    }] : undefined
  });

  if (!baseImageUrl) {
    throw new Error('Failed to generate base image');
  }

  console.log('[HighlightCardGenerator] Base image generated:', baseImageUrl);

  // Download the generated image
  const tempImagePath = path.join(os.tmpdir(), `card-${Date.now()}.png`);
  const imageResponse = await fetch(baseImageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  await fs.writeFile(tempImagePath, imageBuffer);

  // Overlay official logos
  const outputPath = path.join(os.tmpdir(), `card-final-${Date.now()}.jpg`);
  console.log('[HighlightCardGenerator] Overlaying official logos with Python...');
  await overlayLogos(tempImagePath, outputPath);

  // Check file size
  const stats = await fs.stat(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(1);
  console.log('[HighlightCardGenerator] File size:', fileSizeKB, 'KB');

  // Upload to S3
  const finalBuffer = await fs.readFile(outputPath);
  const fileName = `${seriesSummary.winningTeam.toLowerCase().replace(/\s+/g, '-')}-advance-${seriesSummary.seriesScore.replace('-', '-')}.jpg`;
  
  console.log('[HighlightCardGenerator] Uploading to S3:', fileName);
  const { url: s3Url } = await storagePut(
    `highlight-cards/${fileName}`,
    finalBuffer,
    'image/jpeg'
  );

  // Clean up temp files
  await fs.unlink(tempImagePath).catch(() => {});
  await fs.unlink(outputPath).catch(() => {});

  console.log('[HighlightCardGenerator] Card generation complete!');
  console.log('[HighlightCardGenerator] S3 URL:', s3Url);

  return {
    imageUrl: s3Url,
    localPath: `/highlight-cards/${fileName}`,
    fileSize: stats.size,
    title: `${seriesSummary.winningTeam} Advance ${seriesSummary.seriesScore}`,
    stat: `${seriesSummary.mvpPlayer}: ${seriesSummary.mvpStats.ppg} PPG`,
  };
}

/**
 * Overlay official HoFBA and HoFSN logos on generated card using Python PIL
 */
async function overlayLogos(inputPath: string, outputPath: string): Promise<void> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  // Get logo paths (use absolute paths)
  const hofbaLogoPath = '/home/ubuntu/hofsn/client/public/hof-logo.png';
  const hofsnLogoPath = '/home/ubuntu/hofsn/client/public/hofsn-logo.png';

  // Python script to overlay logos
  const pythonScript = `
import sys
from PIL import Image

# Load the base image
base = Image.open("${inputPath}")
base_width, base_height = base.size

# Load logos from local files
hofba_logo = Image.open("${hofbaLogoPath}").convert("RGBA")
hofsn_logo = Image.open("${hofsnLogoPath}").convert("RGBA")

# Resize logos to appropriate size (8% of image width)
logo_width = int(base_width * 0.08)
hofba_aspect = hofba_logo.height / hofba_logo.width
hofsn_aspect = hofsn_logo.height / hofsn_logo.width

hofba_logo = hofba_logo.resize((logo_width, int(logo_width * hofba_aspect)), Image.Resampling.LANCZOS)
hofsn_logo = hofsn_logo.resize((logo_width, int(logo_width * hofsn_aspect)), Image.Resampling.LANCZOS)

# Position logos in bottom corners with padding
padding = int(base_width * 0.02)

# HoFBA logo - bottom left
hofba_x = padding
hofba_y = base_height - hofba_logo.height - padding

# HoFSN logo - bottom right
hofsn_x = base_width - hofsn_logo.width - padding
hofsn_y = base_height - hofsn_logo.height - padding

# Convert base to RGBA for compositing
if base.mode != 'RGBA':
    base = base.convert('RGBA')

# Paste logos with alpha channel
base.paste(hofba_logo, (hofba_x, hofba_y), hofba_logo)
base.paste(hofsn_logo, (hofsn_x, hofsn_y), hofsn_logo)

# Convert to RGB and save as JPEG
final = base.convert('RGB')
final.save("${outputPath}", "JPEG", quality=85, optimize=True)

print("[Python] Logos overlaid successfully")
`;

  try {
    const { stdout, stderr } = await execAsync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`);
    if (stdout) console.log(stdout);
    if (stderr) console.error('[Python Error]', stderr);
  } catch (error) {
    console.error('[Python] Failed to overlay logos:', error);
    throw new Error('Failed to overlay logos on card');
  }
}
