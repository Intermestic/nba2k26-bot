import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MavsJaBrownStory() {
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
            <h1 className="text-4xl font-bold mt-2 mb-4">Mavs Bet Big on Ja–Brown Star Power</h1>
            <p className="text-xl text-muted-foreground">
              Dallas blows up old core, landing Ja Morant and Jaylen Brown in franchise-altering moves
            </p>
          </div>

          <img 
            src="/mavs-ja-brown-highlight.png" 
            alt="Mavericks new starting five with Ja Morant and Jaylen Brown"
            className="w-full rounded-lg mb-8"
          />

          <div className="space-y-6 text-foreground">
            <p>
              The Dallas Mavericks just executed one of the boldest roster overhauls in recent memory. In a series of aggressive moves, Dallas shipped out Stephen Curry and Jusuf Nurkic while landing explosive point guard Ja Morant, two-way wing Jaylen Brown, rising scorer Bennedict Mathurin, and key depth pieces. The message is clear: the Mavs are betting everything on star power and athleticism.
            </p>

            <p>
              Ja Morant brings elite rim pressure and playmaking that Dallas has lacked for years. His ability to collapse defenses off the dribble will create open looks for shooters and cutters, while his transition game could make the Mavs one of the league's most dangerous fast-break teams. Pairing him with Jaylen Brown—a proven two-way wing who can score at all three levels—gives Dallas a dynamic duo capable of matching up with any backcourt in the league.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Trade Breakdown</h2>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-blue-400">Mavs Receive:</h3>
                  <ul className="space-y-2">
                    <li>• Ja Morant (PG) - 2x All-Star, explosive scorer</li>
                    <li>• Jaylen Brown (SG/SF) - 3x All-Star, elite two-way wing</li>
                    <li>• Bennedict Mathurin (SF) - Rising young scorer</li>
                    <li>• Depth pieces & draft capital</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 text-orange-400">Mavs Send Out:</h3>
                  <ul className="space-y-2">
                    <li>• Stephen Curry (PG) - Future Hall of Famer</li>
                    <li>• Jusuf Nurkic (C) - Starting center</li>
                    <li>• Additional role players</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">What Dallas Gains</h2>

            <p>
              The Ja Morant–Jaylen Brown pairing is built for the modern NBA. Morant's relentless attacking style forces defenses to collapse, creating driving lanes and kick-out opportunities. Brown's versatility allows him to play both on and off the ball, whether spotting up for threes, attacking closeouts, or defending the opponent's best perimeter player.
            </p>

            <p>
              Bennedict Mathurin adds another scoring punch off the bench or in small-ball lineups. His ability to create his own shot and knock down contested jumpers gives Dallas a third offensive weapon who can take over games when Morant or Brown need a breather. With Zach Edey anchoring the paint and Kelly Olynyk or Marvin Bagley III providing frontcourt depth, the Mavs have constructed a roster designed to run teams off the floor.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Cost: Losing Curry's Gravity</h2>

            <p>
              Trading Stephen Curry is no small decision. Curry's shooting gravity warped defenses like few players in NBA history, and his leadership was invaluable. However, Dallas' front office clearly believes that Morant's youth and explosiveness—combined with Brown's two-way excellence—offer a higher ceiling for sustained contention.
            </p>

            <p>
              The loss of Jusuf Nurkic's rim protection is also significant. Without a traditional defensive anchor, Dallas will need to rely on team defense, switching, and length to protect the paint. Brown and Mathurin's defensive versatility will be tested nightly, and the Mavs' success may hinge on their ability to stay disciplined in rotations.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Can This Core Contend?</h2>

            <p>
              The Mavericks are now built around speed, athleticism, and shot creation. If Morant and Brown can develop chemistry quickly, this team has the potential to be a nightmare matchup in the playoffs. Their ability to push tempo, attack in transition, and create mismatches in the halfcourt makes them dangerous against any opponent.
            </p>

            <p>
              However, questions remain. Can Dallas' defense hold up without a rim-protecting big? Will Morant stay healthy through a grueling playoff run? Can Brown shoulder the defensive load on the wing? These are the challenges that will define whether this bold gamble pays off. One thing is certain: the Mavericks are all-in on star power, and the league better take notice.
            </p>

            <div className="bg-card p-6 rounded-lg border border-border mt-8">
              <h3 className="font-bold text-lg mb-3">Projected Starting Five</h3>
              <ul className="space-y-2">
                <li><strong>PG:</strong> Ja Morant</li>
                <li><strong>SG:</strong> Jaylen Brown</li>
                <li><strong>SF:</strong> Bennedict Mathurin</li>
                <li><strong>PF:</strong> Kelly Olynyk / Marvin Bagley III</li>
                <li><strong>C:</strong> Zach Edey</li>
              </ul>
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
