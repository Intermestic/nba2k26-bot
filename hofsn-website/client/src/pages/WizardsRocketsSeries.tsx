import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function WizardsRocketsSeries() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative">
        <div className="w-full">
          <img
            src="/wizards-rockets-series-highlight.png"
            alt="Wizards win series 3-1"
            className="w-full h-auto object-cover"
          />
        </div>
        
        <div className="absolute top-4 left-4">
          <Link href="/playoffs">
            <Button variant="outline" className="bg-black/50 border-white/30 text-white hover:bg-black/70">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Playoffs
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Wizards vs Rockets - Eastern Conference Semifinals</h2>
        <p className="text-lg leading-relaxed text-muted-foreground">
          The Washington Wizards defeated the Houston Rockets 3-1 in the Eastern Conference Semifinals.
          Jalen Suggs was named Series MVP after averaging 55.2 PPG across the four games.
        </p>
      </section>
    </div>
  );
}
