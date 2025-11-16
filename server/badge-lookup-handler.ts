import { getDb } from './db';
import { badgeAbbreviations, badgeRequirements } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { EmbedBuilder } from 'discord.js';

/**
 * Look up badge information by abbreviation
 * Returns full name, description, and requirements for all tiers
 */
export async function lookupBadge(abbreviation: string): Promise<{
  success: boolean;
  embed?: EmbedBuilder;
  message?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    // Normalize abbreviation to uppercase
    const abbr = abbreviation.toUpperCase();

    // Look up badge abbreviation
    const badgeInfo = await db
      .select()
      .from(badgeAbbreviations)
      .where(eq(badgeAbbreviations.abbreviation, abbr))
      .limit(1);

    if (badgeInfo.length === 0) {
      return {
        success: false,
        message: `❌ Badge abbreviation "${abbr}" not found. Try !badge list to see all abbreviations.`
      };
    }

    const badge = badgeInfo[0];
    const fullName = badge.fullName;

    // Look up requirements for all tiers
    const requirements = await db
      .select()
      .from(badgeRequirements)
      .where(eq(badgeRequirements.badgeName, fullName));

    if (requirements.length === 0) {
      return {
        success: false,
        message: `❌ No requirements found for ${fullName} (${abbr})`
      };
    }

    // Build embed with badge information
    const embed = new EmbedBuilder()
      .setColor('#FFD700') // Gold color for badges
      .setTitle(`🏅 ${fullName} (${abbr})`)
      .setDescription(badge.category || 'Badge requirements')
      .setFooter({ text: 'Use !badge <abbreviation> to look up other badges' });

    // Add fields for each tier
    const tiers = ['bronze', 'silver', 'gold', 'hof'];
    for (const tier of tiers) {
      const tierReqs = requirements.filter(r => r.tier.toLowerCase() === tier);
      
      if (tierReqs.length > 0) {
        const req = tierReqs[0];
        const reqText = formatRequirements(req);
        
        if (reqText) {
          embed.addFields({
            name: `${getTierEmoji(tier)} ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
            value: reqText,
            inline: false
          });
        }
      }
    }

    // Add category if available
    if (badge.category) {
      embed.addFields({
        name: 'Category',
        value: badge.category,
        inline: true
      });
    }

    return { success: true, embed };
  } catch (error) {
    console.error('[Badge Lookup] Error:', error);
    return {
      success: false,
      message: '❌ Failed to look up badge. Check logs for details.'
    };
  }
}

/**
 * Format badge requirements into readable text
 */
function formatRequirements(req: any): string {
  const parts: string[] = [];

  if (req.attribute1 && req.threshold1) {
    parts.push(`${req.attribute1}: ${req.threshold1}+`);
  }
  if (req.attribute2 && req.threshold2) {
    parts.push(`${req.attribute2}: ${req.threshold2}+`);
  }
  if (req.attribute3 && req.threshold3) {
    parts.push(`${req.attribute3}: ${req.threshold3}+`);
  }

  if (parts.length === 0) {
    return 'No specific requirements';
  }

  return parts.join(', ');
}

/**
 * Get emoji for badge tier
 */
function getTierEmoji(tier: string): string {
  const emojis: Record<string, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    hof: '👑'
  };
  return emojis[tier.toLowerCase()] || '🏅';
}

/**
 * List all badge abbreviations
 */
export async function listAllBadges(): Promise<{
  success: boolean;
  embed?: EmbedBuilder;
  message?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const badges = await db
      .select()
      .from(badgeAbbreviations)
      .orderBy(badgeAbbreviations.abbreviation);

    if (badges.length === 0) {
      return {
        success: false,
        message: '❌ No badge abbreviations found in database'
      };
    }

    // Group badges by category
    const byCategory: Record<string, typeof badges> = {};
    for (const badge of badges) {
      const category = badge.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(badge);
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏅 Badge Abbreviations')
      .setDescription('Use !badge <abbreviation> to see full details')
      .setFooter({ text: `Total: ${badges.length} badges` });

    // Add fields for each category
    for (const [category, categoryBadges] of Object.entries(byCategory)) {
      const badgeList = categoryBadges
        .map(b => `**${b.abbreviation}** - ${b.fullName}`)
        .join('\n');
      
      // Split into multiple fields if too long (Discord limit: 1024 chars per field)
      if (badgeList.length > 1024) {
        const chunks = splitIntoChunks(categoryBadges, 10);
        chunks.forEach((chunk, index) => {
          const chunkText = chunk
            .map(b => `**${b.abbreviation}** - ${b.fullName}`)
            .join('\n');
          embed.addFields({
            name: index === 0 ? category : `${category} (cont.)`,
            value: chunkText,
            inline: false
          });
        });
      } else {
        embed.addFields({
          name: category,
          value: badgeList,
          inline: false
        });
      }
    }

    return { success: true, embed };
  } catch (error) {
    console.error('[Badge List] Error:', error);
    return {
      success: false,
      message: '❌ Failed to list badges. Check logs for details.'
    };
  }
}

/**
 * Split array into chunks
 */
function splitIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
