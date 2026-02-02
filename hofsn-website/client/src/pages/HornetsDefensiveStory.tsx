import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HornetsDefensiveStory() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="flex gap-4 mb-6">
          <Link href="/highlights">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Highlights
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              🏠 Home
            </Button>
          </Link>
        </div>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <span className="text-sm text-muted-foreground">November 16, 2025</span>
            <h1 className="text-4xl font-bold mt-2 mb-4">Hornets Lean into Defense with New-Look Core</h1>
            <p className="text-xl text-muted-foreground">
              Charlotte builds defensive fortress around Reaves, Allen, Gobert, and Bridges
            </p>
          </div>

          <img 
            src="/hornets-defense-highlight.png" 
            alt="Hornets new defensive-minded starting five"
            className="w-full rounded-lg mb-8"
          />

          <div className="space-y-6 text-foreground">
            <p>
              After a whirlwind of star trades reshaped the Eastern Conference, the Charlotte Hornets emerged with a clear identity: defense wins championships. Gone are the days of relying on a single superstar. Instead, Charlotte has assembled a deep, versatile roster built around elite defenders, switchability, and relentless effort on every possession.
            </p>

            <p>
              The Hornets' new core features Austin Reaves, Jarrett Allen, Rudy Gobert, Mikal Bridges, and a trio of disruptive guards in Alex Caruso, Jose Alvarado, and Sion James. This is not a team that will blow you away with offensive firepower, but they will make every possession a grind. For guard-heavy offenses, Charlotte is a nightmare matchup.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Defensive Blueprint</h2>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-teal-400">Key Acquisitions:</h3>
                  <ul className="space-y-2">
                    <li>• Austin Reaves (SG) - Two-way guard with high IQ</li>
                    <li>• Jarrett Allen (C) - Elite rim protector & rebounder</li>
                    <li>• Rudy Gobert (C) - 4x Defensive Player of the Year</li>
                    <li>• Mikal Bridges (SF) - Perimeter lockdown defender</li>
                    <li>• Alex Caruso (PG) - Defensive pest & playmaker</li>
                    <li>• Jose Alvarado (PG) - High-energy disruptor</li>
                    <li>• Sion James (G) - Promising rookie defender</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">Defensive Versatility at Every Position</h2>

            <p>
              Charlotte's starting lineup is a defensive coordinator's dream. Alex Caruso brings relentless on-ball pressure and an uncanny ability to jump passing lanes. Austin Reaves combines size, strength, and basketball IQ to guard multiple positions. Mikal Bridges is one of the league's premier wing defenders, capable of shadowing elite scorers for 40 minutes without breaking a sweat.
            </p>

            <p>
              In the frontcourt, Jarrett Allen and Rudy Gobert form one of the most intimidating rim-protecting duos in NBA history. Allen's mobility allows him to switch onto guards in pick-and-roll situations, while Gobert's length and timing make him a shot-blocking machine. Opposing teams will think twice before attacking the paint against this tandem.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Depth and Disruption</h2>

            <p>
              What makes Charlotte truly dangerous is their depth. Jose Alvarado and Sion James provide instant energy off the bench, harassing ball-handlers and forcing turnovers. This is a team that can deploy waves of fresh defenders, wearing down opponents over 48 minutes. Head coach Charles Lee has the luxury of mixing and matching lineups based on matchups, always keeping a defensive stopper on the floor.
            </p>

            <p>
              Offensively, the Hornets won't dazzle you with flashy plays, but they will execute. Reaves and Caruso are both capable playmakers who can run the offense efficiently. Bridges provides floor spacing with his three-point shooting, and Allen is a reliable lob threat and offensive rebounder. This team will grind out wins with defense, transition buckets, and smart halfcourt execution.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Playoff Nightmare for Guard-Heavy Teams</h2>

            <p>
              The Hornets' defensive identity makes them a particularly tough matchup in the playoffs. Teams that rely heavily on guard play—like the Knicks, 76ers, or Pacers—will struggle to generate clean looks against Charlotte's swarming perimeter defense. Gobert and Allen's rim protection eliminates easy baskets at the rim, forcing opponents into contested mid-range jumpers.
            </p>

            <p>
              Charlotte may not have a singular superstar, but they have something equally valuable: a cohesive, defensive-minded roster that plays with discipline and effort. In a league increasingly dominated by offensive firepower, the Hornets are betting that defense and depth can carry them deep into the postseason. Don't be surprised if Buzz City becomes the team no one wants to face in April.
            </p>

            <div className="bg-card p-6 rounded-lg border border-border mt-8">
              <h3 className="font-bold text-lg mb-3">Projected Starting Five</h3>
              <ul className="space-y-2">
                <li><strong>PG:</strong> Alex Caruso</li>
                <li><strong>SG:</strong> Austin Reaves</li>
                <li><strong>SF:</strong> Mikal Bridges</li>
                <li><strong>PF:</strong> Rudy Gobert</li>
                <li><strong>C:</strong> Jarrett Allen</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Key Bench:</strong> Jose Alvarado, Sion James, additional depth pieces
              </p>
            </div>

            <p className="text-sm text-muted-foreground mt-8 border-t border-border pt-6">
              <em>Story by HoFSN Staff | November 16, 2025</em>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
