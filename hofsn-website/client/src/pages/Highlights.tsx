import { ArrowLeft, TrendingUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// Fallback cards if database is empty
const fallbackPlayoffCards = [
  {
    id: "raptors-pacers-series",
    image: "/tatum-series-sweep.png",
    title: "Raptors Sweep Pacers 2-0",
    stat: "SWEEP",
    category: "Tatum Dominates • 76 PTS, 16 REB, 10 AST in 2 Games",
    link: "/playoffs/raptors-pacers-series",
    linkText: "View Series Recap"
  },
  {
    id: "rockets-cavs-g1",
    image: "/highlight-rockets-cavs-g1.png",
    title: "Rockets Win Game 1 (OT)",
    stat: "96-93",
    category: "5-Seed Holds Off Cavs • Rockets Lead 1-0",
    link: "/playoffs/cavs-rockets-game1",
    linkText: "View Game Recap"
  },
  {
    id: "kings-bulls-series",
    image: "/highlight-kings-bulls-win.png",
    title: "Kings Win Series 2-0",
    stat: "DOMINANT",
    category: "4-Seed Advances • First Round Complete",
    link: "/playoffs/kings-bulls-series",
    linkText: "View Series Recap"
  },
  {
    id: "nuggets-jazz-series",
    image: "/highlight-nuggets-jazz-win.png",
    title: "Nuggets Win Series 2-0",
    stat: "ADVANCE",
    category: "7-Seed Dominates • First Round Complete",
    link: "/playoffs/jazz-nuggets-series",
    linkText: "View Series Recap"
  },
];

const fallbackAwardCards = [
  {
    id: "mvp-ingram",
    image: "/mvp-ingram-szn17-v2.png",
    title: "Brandon Ingram - Season 17 MVP",
    stat: "38.8 PPG",
    category: "Most Valuable Player | 47.4% of votes",
    link: "/player/brandon-ingram",
    linkText: "View Player Profile"
  },
  {
    id: "dpoy-suggs",
    image: "/dpoy-suggs-szn17-v2.png",
    title: "Jalen Suggs - Back-to-Back DPOY",
    stat: "88.0 DIS",
    category: "Defensive Player of the Year | 52.6% of votes",
    link: "/player/jalen-suggs",
    linkText: "View Player Profile"
  },
  {
    id: "roy-watkins",
    image: "/roy-watkins-szn17-v2.png",
    title: "Jamir Watkins - Rookie of the Year",
    stat: "13.7 PPG",
    category: "Rookie of the Year | 66.7% of votes",
    link: "/player/jamir-watkins",
    linkText: "View Player Profile"
  },
  {
    id: "6moy-kcp",
    image: "/6moy-kcp-szn17-v2.png",
    title: "Kentavious Caldwell-Pope - 6th Man",
    stat: "17.2 PPG",
    category: "Sixth Man of the Year | 47.4% of votes",
    link: "/player/kentavious-caldwell-pope",
    linkText: "View Player Profile"
  },
  {
    id: "season17-all-hof-teams",
    image: "/season17-all-hof-teams.png",
    title: "Season 17 All HoF Teams",
    stat: "All-HoF Teams",
    category: "First & Second Team Selections + All-Defense",
    link: "/season17-all-hof-teams",
    linkText: "View Full All HoF Teams"
  },
];

const fallbackStatLeaderCards = [
  {
    id: "ppg-leader",
    image: "/ppg-leader-ingram.png",
    title: "Brandon Ingram - Scoring Champion",
    stat: "38.8 PPG",
    category: "Points Per Game Leader",
    link: "/season17-wrapup#top10",
    linkText: "View Full Top 10"
  },
  {
    id: "rpg-leader",
    image: "/rpg-leader-giannis.png",
    title: "Giannis Antetokounmpo - Rebounding King",
    stat: "10.9 RPG",
    category: "Rebounds Per Game Leader",
    link: "/season17-wrapup#top10",
    linkText: "View Full Top 10"
  },
  {
    id: "apg-leader",
    image: "/apg-leader-cade.png",
    title: "Cade Cunningham - Assist Master",
    stat: "8.3 APG",
    category: "Assists Per Game Leader",
    link: "/season17-wrapup#top10",
    linkText: "View Full Top 10"
  },
  {
    id: "spg-leader",
    image: "/spg-leader-og.png",
    title: "OG Anunoby - Steal Specialist",
    stat: "2.5 SPG",
    category: "Steals Per Game Leader",
    link: "/season17-wrapup#top10",
    linkText: "View Full Top 10"
  },
  {
    id: "bpg-leader",
    image: "/bpg-leader-claxton.png",
    title: "Nicolas Claxton - Block Party",
    stat: "1.6 BPG",
    category: "Blocks Per Game Leader",
    link: "/season17-wrapup#top10",
    linkText: "View Full Top 10"
  },
  {
    id: "oppfg-leader",
    image: "/oppfg-leader-suggs.png",
    title: "Jalen Suggs - Defensive Anchor",
    stat: "44.0% Opp FG%",
    category: "Opponent FG% Leader (Lowest)",
    link: "/season17-wrapup#top10",
    linkText: "View Full Top 10"
  },
  {
    id: "dis-leader",
    image: "/dis-leader-og.png",
    title: "OG Anunoby - Disruption Dynamo",
    stat: "90.4 DIS",
    category: "Disruptions Leader (Combined Defensive Impact)",
    link: "/season17-wrapup#top10",
    linkText: "View Full Top 10"
  },
];

// Combined fallback array
const fallbackLeaderCards = [...fallbackPlayoffCards, ...fallbackAwardCards, ...fallbackStatLeaderCards];

export default function Highlights() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  // Fetch highlight cards from database
  const { data: dbCards } = trpc.highlights.getHighlightsPageCards.useQuery();
  
  // Use database cards if available, otherwise fallback to static list
  const leaderCards = useMemo(() => {
    if (dbCards && dbCards.length > 0) {
      return dbCards.map(card => ({
        id: card.id.toString(),
        image: card.image,
        title: card.title,
        stat: card.stat || "",
        category: card.category || "",
        link: card.link || "#",
        linkText: card.linkText || "Learn More"
      }));
    }
    return fallbackLeaderCards;
  }, [dbCards]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-rotate leader cards every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % leaderCards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [leaderCards.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-3xl md:text-4xl font-black text-primary">
                LEAGUE HIGHLIGHTS
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black italic mb-4 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-primary" />
            LEAGUE HIGHLIGHTS
          </h1>
          <p className="text-lg text-muted-foreground">
            Season 17's most memorable moments, award winners, and statistical leaders. Click any card to learn more.
          </p>
        </div>

        {/* Rotating Leader Card Showcase */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Highlights</h2>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <Link href={leaderCards[currentCardIndex]?.link || "#"}>
              <img
                src={leaderCards[currentCardIndex]?.image}
                alt={leaderCards[currentCardIndex]?.title}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            </Link>
            
            {/* Indicator dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {leaderCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCardIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentCardIndex ? 'bg-gold-400 w-8' : 'bg-gray-500 w-2'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Current card info */}
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold">{leaderCards[currentCardIndex]?.title}</h3>
            <p className="text-2xl font-black text-primary">{leaderCards[currentCardIndex]?.stat}</p>
            <p className="text-sm text-muted-foreground">{leaderCards[currentCardIndex]?.category}</p>
          </div>
        </div>

        {/* All Leader Cards Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">All Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaderCards.map((card) => (
              <Link key={card.id} href={card.link}>
                <div className="group cursor-pointer bg-card rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105 shadow-lg">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{card.title}</h3>
                    <p className="text-2xl font-black text-primary mb-1">{card.stat}</p>
                    <p className="text-sm text-muted-foreground">{card.category}</p>
                    <p className="text-sm text-primary font-semibold mt-2">
                      {card.linkText} →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Explore Season 17 Wrap-Up</h2>
          <p className="text-muted-foreground mb-6">
            View final standings, playoff bracket, and complete statistical breakdowns from Season 17
          </p>
          <Link href="/season17-wrapup">
            <button className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors">
              Go to Season 17 Wrap-Up
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            © 2024 Hall of Fame Basketball Association. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            HoFSN - Your source for NBA 2K26 league coverage
          </p>
        </div>
      </footer>
    </div>
  );
}
