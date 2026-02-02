import { APP_LOGO } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Settings, LogIn, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Play, Flame } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
// PlayoffBracket removed - Season 18 announcement now displayed

// Fallback highlight graphics if database is empty
const fallbackHighlightGraphics = [
  "/highlight-rockets-cavs-g1.png",
  "/highlight-kings-bulls-win.png",
  "/highlight-nuggets-jazz-win.png",
  "/mvp-ingram-szn17-v2.png",
  "/dpoy-suggs-szn17-v2.png",
  "/roy-watkins-szn17-v2.png",
  "/6moy-kcp-szn17-v2.png",
  "/season17-all-hof-teams.png",
];

export default function Home() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!user;
  
  // Fetch highlight cards from database
  const { data: dbCards } = trpc.highlights.getHomepageCards.useQuery();
  
  // Use database cards if available, otherwise fallback to static list
  const highlightGraphics = useMemo(() => {
    if (dbCards && dbCards.length > 0) {
      return dbCards.map(card => card.image);
    }
    return fallbackHighlightGraphics;
  }, [dbCards]);
  
  const [currentGraphicIndex, setCurrentGraphicIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGraphicIndex((prev) => (prev + 1) % highlightGraphics.length);
    }, 3000); // Rotate every 3 seconds
    
    return () => clearInterval(interval);
  }, [highlightGraphics.length]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section 
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="container relative z-10 py-12 md:py-16">
          {/* Combined Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/hofsn-logo.png" 
              alt="HoFSN - Hall of Fame Sports Network" 
              className="w-full max-w-4xl h-auto object-contain"
            />
          </div>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto text-center">
            Your premier destination for Hall of Fame Basketball Association News and Highlights
          </p>
          
          {/* Quick Links */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8 max-w-4xl mx-auto">
            <Link href="/league-info">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                📋 League Info & Rules
              </button>
            </Link>
            <a 
              href="https://hof17roster.manus.space" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
            >
              📊 View Full Rosters
            </a>
            <Link href="/awards">
              <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span>Awards & History</span>
              </button>
            </Link>

          </div>
        </div>
      </section>

      {/* Season 16 Playoffs Banner */}
      <section className="bg-gradient-to-r from-red-900/40 via-gold-900/40 to-red-900/40 border-y border-gold-500/30">
        <div className="container py-8">
          <Link href="/playoffs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <span className="text-4xl">🏆</span>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gold-400 group-hover:text-gold-300 transition-colors">
                    Pistons Capture First Championship!
                  </h2>
                  <p className="text-gray-300 text-sm md:text-base">
                    Detroit makes history with Season 16 title victory
                  </p>
                </div>
              </div>
              <div className="bg-gold-500 text-black px-6 py-3 rounded-lg font-bold group-hover:bg-gold-600 transition-colors">
                VIEW CELEBRATION →
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Season 18 Announcement Section */}
      <section className="bg-gradient-to-b from-gray-900 to-black py-12 md:py-16">
        <div className="container">
          <Link href="/season18-hub">
            <div className="max-w-6xl mx-auto cursor-pointer transition-transform hover:scale-[1.02] duration-300">
              <img 
                src="/szn18-announcement.png" 
                alt="Season 18 - The Legacy Continues" 
                className="w-full h-auto rounded-lg shadow-2xl hover:shadow-gold-500/20"
              />
              <p className="text-center text-gold-400 mt-4 font-semibold">Click to enter Season 18 Hub →</p>
            </div>
          </Link>
        </div>
      </section>



      {/* Content Cards Section */}
      <section className="container py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          
          {/* SZN 17 Wrap-Up Card */}
          <Link href="/season17-wrapup">
            <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:border-primary bg-card text-card-foreground border-2">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-4xl">🏆</span>
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl text-center font-black italic">
                  SZN 17 WRAP-UP🏆
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Season 17 is complete! View final standings, top 10 statistical leaders, and the playoff bracket.
                </p>
                <div className="text-center pt-2">
                  <span className="text-sm text-primary font-semibold">View season wrap-up →</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Highlights Card */}
          <Link href="/highlights">
            <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:border-primary bg-card text-card-foreground border-2">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary" fill="currentColor" />
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl text-center font-black italic">
                  HIGHLIGHTS ▶️
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
                  <img 
                    src={highlightGraphics[currentGraphicIndex]} 
                    alt="Playoff Highlights" 
                    className="w-full h-full object-contain transition-opacity duration-500" 
                  />
                  {/* Indicator dots */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {highlightGraphics.map((_, index) => (
                      <div 
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentGraphicIndex ? 'bg-gold-400 w-4' : 'bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Watch video highlights and view graphic highlights from Season 17's most electrifying moments. All highlights in one place!
                </p>
                <div className="text-center pt-2">
                  <span className="text-sm text-primary font-semibold">View all highlights →</span>
                </div>
              </CardContent>
            </Card>
          </Link>



        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            © 2024 Hall of Fame Basketball Association. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            HoFSN - Your source for NBA 2K26 league coverage
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {!isLoggedIn ? (
              <a 
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                Admin Login
              </a>
            ) : (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg transition-colors text-sm font-medium">
                      <Settings className="w-4 h-4" />
                      Admin Dashboard
                    </button>
                  </Link>
                )}
                <button 
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
