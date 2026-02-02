import * as fs from 'fs/promises';
import * as path from 'path';

// Import types from multiSheetExcelParser since that's what we're using now
interface PlayerBoxScore {
  player: string;
  team: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
}

interface GameSummary {
  gameNumber: number;
  beatReporterContent: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  boxScores: PlayerBoxScore[];
}

interface SeriesSummary {
  winningTeam: string;
  losingTeam: string;
  seriesScore: string;
  round: string;
  mvpPlayer: string;
  mvpTeam: string;
  mvpStats: {
    ppg: number;
    rpg: number;
    apg: number;
  };
  keyMoment: string;
  narrativeSummary: string;
  lookingAhead?: string; // Optional looking ahead section
}

interface ParsedData {
  games: GameSummary[];
  seriesSummary: SeriesSummary;
}

/**
 * Summary Page Generator for HoFBA Series
 * 
 * Generates React component files for series summary pages
 * with box scores, game summaries, series narrative, and looking ahead
 */

export interface SummaryPageResult {
  componentPath: string;
  route: string;
  fileName: string;
}

/**
 * Generate series summary page component
 */
export async function generateSummaryPage(data: ParsedData): Promise<SummaryPageResult> {
  const { seriesSummary, games } = data;
  
  console.log('[SummaryPageGenerator] Generating summary page...');
  console.log('[SummaryPageGenerator] Series:', seriesSummary.winningTeam, 'vs', seriesSummary.losingTeam);

  // Generate component file name
  const fileName = `${seriesSummary.winningTeam.toLowerCase().replace(/\s+/g, '-')}-${seriesSummary.losingTeam.toLowerCase().replace(/\s+/g, '-')}-series.tsx`;
  const componentName = `${seriesSummary.winningTeam.replace(/\s+/g, '')}${seriesSummary.losingTeam.replace(/\s+/g, '')}Series`;
  
  // Generate React component code
  const componentCode = generateComponentCode(componentName, seriesSummary, games);
  
  // Write to client/src/pages directory
  const pagesDir = path.join(process.cwd(), 'client', 'src', 'pages');
  const componentPath = path.join(pagesDir, fileName);
  
  await fs.writeFile(componentPath, componentCode, 'utf-8');
  
  console.log('[SummaryPageGenerator] Component written to:', componentPath);
  
  // Generate route path
  const route = `/playoffs/${seriesSummary.winningTeam.toLowerCase().replace(/\s+/g, '-')}-${seriesSummary.losingTeam.toLowerCase().replace(/\s+/g, '-')}-series`;
  
  console.log('[SummaryPageGenerator] Route:', route);
  console.log('[SummaryPageGenerator] Summary page generation complete!');
  
  return {
    componentPath,
    route,
    fileName,
  };
}

/**
 * Generate box score table HTML for a game
 */
function generateBoxScoreTable(game: GameSummary): string {
  const homeTeamPlayers = game.boxScores.filter(p => p.team === game.homeTeam);
  const awayTeamPlayers = game.boxScores.filter(p => p.team === game.awayTeam);
  
  const generateTeamTable = (teamName: string, players: PlayerBoxScore[]) => {
    const rows = players.map(p => `
              <tr className="border-b border-border">
                <td className="py-3 px-4 font-medium">${p.player}</td>
                <td className="py-3 px-4 text-center">${p.pts}</td>
                <td className="py-3 px-4 text-center">${p.reb}</td>
                <td className="py-3 px-4 text-center">${p.ast}</td>
                <td className="py-3 px-4 text-center">${p.stl}</td>
                <td className="py-3 px-4 text-center">${p.blk}</td>
                <td className="py-3 px-4 text-center">${p.fgPct.toFixed(1)}%</td>
                <td className="py-3 px-4 text-center">${p.threePct.toFixed(1)}%</td>
                <td className="py-3 px-4 text-center">${p.ftPct.toFixed(1)}%</td>
              </tr>`).join('');
    
    return `
            <div className="mb-6">
              <h4 className="text-lg font-bold mb-3">${teamName}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-4 text-left">Player</th>
                      <th className="py-2 px-4 text-center">PTS</th>
                      <th className="py-2 px-4 text-center">REB</th>
                      <th className="py-2 px-4 text-center">AST</th>
                      <th className="py-2 px-4 text-center">STL</th>
                      <th className="py-2 px-4 text-center">BLK</th>
                      <th className="py-2 px-4 text-center">FG%</th>
                      <th className="py-2 px-4 text-center">3P%</th>
                      <th className="py-2 px-4 text-center">FT%</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
              </div>
            </div>`;
  };
  
  return `
          <div className="space-y-6">
            ${generateTeamTable(game.homeTeam, homeTeamPlayers)}
            ${generateTeamTable(game.awayTeam, awayTeamPlayers)}
          </div>`;
}

/**
 * Generate React component code for series summary page
 */
function generateComponentCode(
  componentName: string,
  seriesSummary: SeriesSummary,
  games: GameSummary[]
): string {
  // Generate game sections with box scores
  const gameSections = games.map((game) => {
    const winner = game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
    const loser = game.homeScore > game.awayScore ? game.awayTeam : game.homeTeam;
    const winnerScore = Math.max(game.homeScore, game.awayScore);
    const loserScore = Math.min(game.homeScore, game.awayScore);
    
    return `
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h3 className="text-2xl font-bold mb-4">
          Game ${game.gameNumber}: ${winner} ${winnerScore}, ${loser} ${loserScore}
        </h3>
        
        {/* Game Recap */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Game Recap</h4>
          <p className="text-muted-foreground leading-relaxed">
            ${game.beatReporterContent || 'Game summary not available.'}
          </p>
        </div>
        
        {/* Box Score */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Box Score</h4>
          ${generateBoxScoreTable(game)}
        </div>
      </div>`;
  }).join('\n');

  return `import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ${seriesSummary.round} Series Summary: ${seriesSummary.winningTeam} vs ${seriesSummary.losingTeam}
 * Generated from Excel upload
 */
export default function ${componentName}() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/playoffs">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Playoffs
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              ${seriesSummary.round} - Series Complete
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              ${seriesSummary.winningTeam} Advance ${seriesSummary.seriesScore}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              ${seriesSummary.winningTeam} defeats ${seriesSummary.losingTeam} behind ${seriesSummary.mvpPlayer}'s dominant performance
            </p>
          </div>

          {/* Series Result Box */}
          <div className="max-w-2xl mx-auto bg-card border-2 border-primary rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Series Result</h2>
            <div className="text-6xl font-black text-primary mb-2">
              ${seriesSummary.seriesScore}
            </div>
            <p className="text-xl font-semibold">${seriesSummary.winningTeam} Advance</p>
          </div>
        </div>
      </section>

      {/* Series MVP Section */}
      <section className="py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Series MVP</h2>
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-lg p-8">
            <div className="text-center mb-6">
              <h3 className="text-4xl font-black text-primary mb-2">
                ${seriesSummary.mvpPlayer}
              </h3>
              <p className="text-xl text-muted-foreground">${seriesSummary.mvpTeam}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-background rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">${seriesSummary.mvpStats.ppg}</div>
                <div className="text-sm text-muted-foreground">PPG</div>
              </div>
              <div className="bg-background rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">${seriesSummary.mvpStats.rpg}</div>
                <div className="text-sm text-muted-foreground">RPG</div>
              </div>
              <div className="bg-background rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">${seriesSummary.mvpStats.apg}</div>
                <div className="text-sm text-muted-foreground">APG</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game-by-Game Breakdown */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Game-by-Game Breakdown</h2>
          <div className="max-w-6xl mx-auto">
            ${gameSections}
          </div>
        </div>
      </section>

      {/* Series Narrative */}
      <section className="py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Series Summary</h2>
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-lg p-8">
            <p className="text-lg leading-relaxed text-muted-foreground">
              ${seriesSummary.narrativeSummary || `The ${seriesSummary.winningTeam} advanced past the ${seriesSummary.losingTeam} in a ${seriesSummary.seriesScore} series victory. ${seriesSummary.mvpPlayer} led the way with ${seriesSummary.mvpStats.ppg} points per game.`}
            </p>
          </div>
        </div>
      </section>

      ${seriesSummary.keyMoment ? `
      {/* Key Moment */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Key Moment</h2>
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary/20 to-primary/10 border-l-4 border-primary rounded-lg p-8">
            <p className="text-xl font-semibold text-center">
              ${seriesSummary.keyMoment}
            </p>
          </div>
        </div>
      </section>` : ''}

      ${seriesSummary.lookingAhead ? `
      {/* Looking Ahead */}
      <section className="py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Looking Ahead</h2>
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-lg p-8">
            <p className="text-lg leading-relaxed text-muted-foreground">
              ${seriesSummary.lookingAhead}
            </p>
          </div>
        </div>
      </section>` : ''}

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <Link href="/playoffs">
            <Button variant="default" size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Playoff Bracket
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
`;
}
