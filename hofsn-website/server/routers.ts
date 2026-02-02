import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { season17Trades } from "@shared/tradesData";
import { z } from "zod";
import * as playoffDb from "./playoffDb";
import * as db from "./db";
import { notifyDiscordNewArticle, deleteDiscordArticle } from "./utils/discordWebhook";
import { protectedProcedure } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Season 17 data endpoints
  trades: router({
    list: publicProcedure.query(() => {
      return season17Trades;
    }),
  }),

  // Highlight cards management
  highlights: router({
    // Public: Get cards for homepage
    getHomepageCards: publicProcedure.query(async () => {
      return await db.getHighlightCards('homepage');
    }),
    
    // Public: Get cards for highlights page
    getHighlightsPageCards: publicProcedure.query(async () => {
      return await db.getHighlightCards('highlights');
    }),
    
    // Admin: Get all cards for management
    getAllCards: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Only admins can view all highlight cards');
      }
      return await db.getAllHighlightCards();
    }),
    
    // Admin: Create new card
    create: protectedProcedure
      .input(z.object({
        image: z.string(),
        title: z.string(),
        stat: z.string().optional(),
        category: z.string().optional(),
        link: z.string().optional(),
        linkText: z.string().optional(),
        displayLocation: z.enum(['homepage', 'highlights', 'both']).default('both'),
        cardType: z.enum(['playoff', 'award', 'stat_leader', 'other']).default('other'),
        priority: z.number().default(0),
        isActive: z.number().default(1),
        postToDiscord: z.boolean().default(true)
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can create highlight cards');
        }
        
        // Extract postToDiscord before passing to db (it's not a db field)
        const { postToDiscord, ...cardData } = input;
        await db.createHighlightCard(cardData);
        
        // Track Discord post status
        let postedToDiscord = false;
        
        // Post to Discord if enabled and the card has a link
        if (postToDiscord && input.link) {
          // Get base URL from request headers (works for both dev and production)
          const protocol = ctx.req.headers['x-forwarded-proto'] || (ctx.req.connection as any).encrypted ? 'https' : 'http';
          const host = ctx.req.headers['x-forwarded-host'] || ctx.req.headers.host || 'localhost:3000';
          const baseUrl = `${protocol}://${host}`;
          
          console.log('[Discord] Base URL:', baseUrl);
          const fullImageUrl = input.image.startsWith('http') ? input.image : `${baseUrl}${input.image}`;
          const fullLinkUrl = input.link.startsWith('http') ? input.link : `${baseUrl}${input.link}`;
          
          postedToDiscord = await notifyDiscordNewArticle({
            title: input.title,
            url: fullLinkUrl,
            imageUrl: fullImageUrl,
            excerpt: input.stat || undefined,
          });
        }
        
        return { success: true, postedToDiscord };
      }),
    
    // Admin: Update card
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        image: z.string().optional(),
        title: z.string().optional(),
        stat: z.string().optional().nullable(),
        category: z.string().optional().nullable(),
        link: z.string().optional().nullable(),
        linkText: z.string().optional().nullable(),
        displayLocation: z.enum(['homepage', 'highlights', 'both']).optional(),
        cardType: z.enum(['playoff', 'award', 'stat_leader', 'other']).optional(),
        priority: z.number().optional(),
        isActive: z.number().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can update highlight cards');
        }
        const { id, ...updates } = input;
        await db.updateHighlightCard(id, updates);
        return { success: true };
      }),
    
    // Admin: Delete card
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can delete highlight cards');
        }
        await db.deleteHighlightCard(input.id);
        return { success: true };
      }),
    
    // Admin: Update priority (for reordering)
    updatePriority: protectedProcedure
      .input(z.object({
        id: z.number(),
        priority: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can reorder highlight cards');
        }
        await db.updateHighlightCardPriority(input.id, input.priority);
        return { success: true };
      }),
    
    // Admin: Bulk update priorities (for drag-and-drop reorder)
    bulkUpdatePriorities: protectedProcedure
      .input(z.array(z.object({
        id: z.number(),
        priority: z.number()
      })))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can reorder highlight cards');
        }
        for (const item of input) {
          await db.updateHighlightCardPriority(item.id, item.priority);
        }
        return { success: true };
      }),
    
    // Admin: Toggle active status
    toggleActive: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean()
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can toggle highlight card visibility');
        }
        await db.toggleHighlightCardActive(input.id, input.isActive);
        return { success: true };
      }),
    
    // Admin: Post existing card to Discord
    postToDiscord: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string(),
        image: z.string(),
        link: z.string().optional(),
        stat: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can post to Discord');
        }
        
        if (!input.link) {
          return { success: false, error: 'Card must have a link to post to Discord' };
        }
        
        // Get base URL from request headers (works for both dev and production)
        const protocol = ctx.req.headers['x-forwarded-proto'] || (ctx.req.connection as any).encrypted ? 'https' : 'http';
        const host = ctx.req.headers['x-forwarded-host'] || ctx.req.headers.host || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        console.log('[Discord] Base URL:', baseUrl);
        console.log('[Discord] Image path:', input.image);
        console.log('[Discord] Link path:', input.link);
        
        const fullImageUrl = input.image.startsWith('http') ? input.image : `${baseUrl}${input.image}`;
        const fullLinkUrl = input.link.startsWith('http') ? input.link : `${baseUrl}${input.link}`;
        
        console.log('[Discord] Full image URL:', fullImageUrl);
        console.log('[Discord] Full link URL:', fullLinkUrl);
        
        const posted = await notifyDiscordNewArticle({
          title: input.title,
          url: fullLinkUrl,
          imageUrl: fullImageUrl,
          excerpt: input.stat || undefined,
        });
        
        if (!posted) {
          console.error('[Discord] Failed to post to Discord');
          return { success: false, error: 'Failed to post to Discord webhook' };
        }
        
        return { success: posted };
      }),
    
    // Admin: Delete card from Discord
    deleteFromDiscord: protectedProcedure
      .input(z.object({
        id: z.number(),
        link: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can delete from Discord');
        }
        
        // Get base URL from request headers (works for both dev and production)
        const protocol = ctx.req.headers['x-forwarded-proto'] || (ctx.req.connection as any).encrypted ? 'https' : 'http';
        const host = ctx.req.headers['x-forwarded-host'] || ctx.req.headers.host || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        const articleUrl = input.link.startsWith('http') ? input.link : `${baseUrl}${input.link}`;
        console.log('[Discord] Deleting article URL:', articleUrl);
        
        const deleted = await deleteDiscordArticle(articleUrl);
        
        return { success: deleted };
      }),
    
    // Admin: Process CSV/Excel and generate highlight card + summary page
    processCSV: protectedProcedure
      .input(z.object({
        csvContent: z.string(),
        filename: z.string().optional(),
        playerHeadshotUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can process CSV/Excel files');
        }
        
        const { parseSeriesCSV, calculateSeriesMVP } = await import('./utils/csvParser');
        const { generateHighlightCard } = await import('./utils/highlightCardGenerator');
        const { generateSummaryPage } = await import('./utils/summaryPageGenerator');
        const { convertExcelToCSV, isExcelFile } = await import('./utils/excelConverter');
        const { parseMultiSheetExcel } = await import('./utils/multiSheetExcelParser');
        
        console.log('[CSV Upload] Starting file processing...');
        console.log('[CSV Upload] Filename:', input.filename || 'unknown');
        
        let parsedData;
        
        // Check if this is a multi-sheet Excel file (new format)
        if (input.filename && isExcelFile(input.filename)) {
          console.log('[CSV Upload] Excel file detected');
          const buffer = Buffer.from(input.csvContent, 'base64');
          
          // Try multi-sheet parser first (new format)
          try {
            console.log('[CSV Upload] Attempting multi-sheet Excel parsing...');
            parsedData = parseMultiSheetExcel(buffer);
            console.log('[CSV Upload] Multi-sheet Excel parsed successfully');
          } catch (error) {
            console.log('[CSV Upload] Multi-sheet parsing failed, falling back to CSV conversion');
            console.error(error);
            // Fall back to old CSV conversion method
            const csvContent = await convertExcelToCSV(buffer, input.filename);
            parsedData = await parseSeriesCSV(csvContent);
          }
        } else {
          // Plain CSV file (old format)
          console.log('[CSV Upload] CSV file detected, using CSV parser');
          parsedData = await parseSeriesCSV(input.csvContent);
        }
        
        console.log('[CSV Upload] Data parsed successfully');
        
        // Calculate MVP if not provided
        if (!parsedData.seriesSummary.mvpPlayer || !parsedData.seriesSummary.mvpStats) {
          const mvp = calculateSeriesMVP(parsedData.games);
          parsedData.seriesSummary.mvpPlayer = mvp.player;
          parsedData.seriesSummary.mvpTeam = mvp.team;
          parsedData.seriesSummary.mvpStats = mvp.stats;
        }
        
        // Set default round if not provided
        if (!parsedData.seriesSummary.round) {
          parsedData.seriesSummary.round = 'First Round';
        }
        
        // Generate highlight card
        console.log('[CSV Upload] Generating highlight card...');
        const card = await generateHighlightCard(parsedData.seriesSummary);
        console.log('[CSV Upload] Highlight card generated:', card.imageUrl);
        
        // Generate summary page
        console.log('[CSV Upload] Generating summary page...');
        const summaryPage = await generateSummaryPage(parsedData);
        console.log('[CSV Upload] Summary page generated:', summaryPage.route);
        
        // Get current max priority
        const allCards = await db.getAllHighlightCards();
        const maxPriority = allCards.length > 0 
          ? Math.max(...allCards.map(c => c.priority))
          : 0;
        const newPriority = maxPriority + 1;
        
        // Insert highlight card into database
        console.log('[CSV Upload] Inserting card into database with priority:', newPriority);
        await db.createHighlightCard({
          image: card.imageUrl,
          title: card.title,
          stat: card.stat,
          category: parsedData.seriesSummary.round,
          link: summaryPage.route,
          linkText: 'View Series Summary →',
          displayLocation: 'both',
          cardType: 'playoff',
          priority: newPriority,
          isActive: 1,
        });
        
        console.log('[CSV Upload] CSV processing complete!');
        
        return {
          success: true,
          card: {
            imageUrl: card.imageUrl,
            title: card.title,
            stat: card.stat,
            fileSize: card.fileSize,
          },
          summaryPage: {
            route: summaryPage.route,
            fileName: summaryPage.fileName,
          },
          priority: newPriority,
        };
      }),
  }),

  // Playoff management
  playoffs: router({
    getSeries: publicProcedure
      .input(z.object({ season: z.string() }))
      .query(async ({ input }) => {
        return await playoffDb.getPlayoffSeries(input.season);
      }),
    
    getGames: publicProcedure
      .input(z.object({ 
        season: z.string(),
        matchupId: z.string().optional()
      }))
      .query(async ({ input }) => {
        return await playoffDb.getPlayoffGames(input.season, input.matchupId);
      }),
    
    initializeFirstRound: protectedProcedure
      .input(z.object({
        season: z.string(),
        teams: z.array(z.object({
          seed: z.number(),
          name: z.string()
        }))
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admin can initialize playoffs
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can initialize playoffs');
        }
        await playoffDb.initializeFirstRoundSeries(input.season, input.teams);
        return { success: true };
      }),
    
    addGame: protectedProcedure
      .input(z.object({
        season: z.string(),
        round: z.enum(["first", "second", "conference_finals", "finals"]),
        matchupId: z.string(),
        gameNumber: z.number(),
        homeTeam: z.string(),
        awayTeam: z.string(),
        homeScore: z.number(),
        awayScore: z.number(),
        playedAt: z.date().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admin can add games
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can add playoff games');
        }
        
        const winner = input.homeScore > input.awayScore ? input.homeTeam : input.awayTeam;
        
        await playoffDb.addPlayoffGame({
          ...input,
          winner,
          playedAt: input.playedAt || new Date()
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
