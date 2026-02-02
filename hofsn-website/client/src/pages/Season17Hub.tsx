import { Link } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Season17Hub() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gold-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="flex items-center gap-2 text-gray-300 hover:text-gold-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-gold-500 to-yellow-600">
                SZN 17 HUB
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Redirect Message */}
      <section className="container py-24">
        <Card className="bg-gradient-to-br from-gold-900/20 to-gold-600/20 border-2 border-gold-500/50 max-w-2xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center">
            <Trophy className="w-16 h-16 text-gold-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-black text-gold-400 mb-4">
              Season 17 Regular Season Complete!
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              The regular season has concluded. Check out the Season 17 Wrap-Up for final standings, 
              top 10 statistical leaders, and the playoff bracket.
            </p>
            <Link href="/season17-wrapup">
              <button className="px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold text-lg rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl">
                View Season 17 Wrap-Up →
              </button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
