import { Link } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Playoffs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/40 border-b border-gold-500/20">
        <div className="container py-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors mb-4">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </Link>
          <div className="flex items-center gap-4">
            <Trophy className="w-12 h-12 text-gold-400" />
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gold-400">SEASON 16 PLAYOFFS</h1>
              <p className="text-gray-300 mt-2">Detroit Pistons - First Championship in League History</p>
            </div>
          </div>
        </div>
      </div>

      {/* Championship Card */}
      <div className="container py-12">
        <Card className="bg-gradient-to-br from-red-900/20 to-blue-900/20 border-2 border-gold-500/50">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-black text-center text-gold-400">
              🏆 PISTONS CAPTURE FIRST CHAMPIONSHIP 🏆
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <img 
                src="/pistons-s16-championship.png" 
                alt="Pistons Season 16 Champions" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center space-y-4">
              <p className="text-xl text-gray-200">
                The Detroit Pistons have captured their <span className="text-gold-400 font-bold">first championship</span> in Hall of Fame Basketball Association history!
              </p>
              <p className="text-lg text-gray-300">
                After a dominant playoff run, the Pistons etched their name in league history, 
                bringing home the Season 16 title and establishing themselves as champions.
              </p>
              <div className="pt-4">
                <span className="text-2xl font-black text-gold-400">SEASON 16 CHAMPIONS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
