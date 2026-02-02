import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function WizardsTrueEraStory() {
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
            <h1 className="text-4xl font-bold mt-2 mb-4">Wizards Push Their Chips In on Trae Time</h1>
            <p className="text-xl text-muted-foreground">
              Washington doubles down on contention, landing Trae Young to form elite backcourt with Josh Giddey
            </p>
          </div>

          <img 
            src="/wizards-trae-era-highlight.png" 
            alt="Wizards new starting five with Trae Young"
            className="w-full rounded-lg mb-8"
          />

          <div className="space-y-6 text-foreground">
            <p>
              The Washington Wizards, already sitting pretty at 12-3 and atop the Atlantic Division, made a seismic move that signals they are all-in on winning now. In a blockbuster trade with the Charlotte Hornets, Washington sent Mikal Bridges and promising rookie Sion James to Charlotte in exchange for three-time All-Star Trae Young and defensive big Paul Reed.
            </p>

            <p>
              The acquisition of Young transforms the Wizards' offensive identity overnight. Pairing him with Josh Giddey creates one of the league's most dynamic backcourts, combining elite playmaking, pull-up shooting, and basketball IQ. Young's ability to collapse defenses with his deep range and pinpoint passing will unlock even more opportunities for Karl-Anthony Towns in the post and stretch the floor for cutting wings.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Trade Breakdown</h2>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-blue-400">Wizards Receive:</h3>
                  <ul className="space-y-2">
                    <li>• Trae Young (PG) - 3x All-Star, elite scorer & playmaker</li>
                    <li>• Paul Reed (C) - High-energy defensive big</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 text-teal-400">Hornets Receive:</h3>
                  <ul className="space-y-2">
                    <li>• Mikal Bridges (SF) - Elite 3&D wing</li>
                    <li>• Sion James (G) - Promising rookie guard</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">What This Means for Washington</h2>

            <p>
              General Manager Tommy Sheppard made it clear: this team believes its window is now. With Young running the offense alongside Giddey, the Wizards boast one of the most creative passing duos in the league. Young's gravity as a shooter will create cleaner looks for Towns in the mid-range and paint, while Giddey's size and vision make him a nightmare in transition.
            </p>

            <p>
              Paul Reed adds another layer of versatility to the frontcourt rotation. His switchability on defense and ability to guard multiple positions will be crucial in playoff matchups against teams with dynamic wing scorers. Reed's energy and hustle complement the Wizards' more methodical offensive approach, giving head coach Wes Unseld Jr. more lineup flexibility.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Cost: Losing Mikal Bridges</h2>

            <p>
              Make no mistake—giving up Mikal Bridges hurts. Bridges was the Wizards' best perimeter defender and a model of consistency on both ends. His ability to guard the opponent's best wing while knocking down threes at a high clip made him invaluable. However, Washington's front office clearly believes that Young's offensive firepower outweighs the defensive drop-off.
            </p>

            <p>
              The Wizards will need to find answers on the wing, likely leaning more heavily on their remaining depth pieces to fill the defensive void. But with Young's ability to control tempo and create high-quality shots, the offensive upgrade may be worth the trade-off.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Championship Aspirations</h2>

            <p>
              This move vaults Washington into legitimate title contention. The Wizards now have a starting five that can match up with anyone: Trae Young orchestrating the offense, Josh Giddey facilitating in transition, a versatile wing, Karl-Anthony Towns dominating in the paint, and Paul Reed providing defensive intensity.
            </p>

            <p>
              The Eastern Conference just got a lot more interesting. With Toronto Raptors running away with the Atlantic at 19-1 and Detroit Pistons dominating the Central at 12-1, the Wizards are positioning themselves as the team to beat when the playoffs arrive. If Young and Giddey can develop chemistry quickly, this could be the move that defines Washington's season—and potentially brings a championship to the nation's capital.
            </p>

            <div className="bg-card p-6 rounded-lg border border-border mt-8">
              <h3 className="font-bold text-lg mb-3">Projected Starting Five</h3>
              <ul className="space-y-2">
                <li><strong>PG:</strong> Trae Young</li>
                <li><strong>SG:</strong> Josh Giddey</li>
                <li><strong>SF:</strong> TBD (Wing rotation)</li>
                <li><strong>PF:</strong> Karl-Anthony Towns</li>
                <li><strong>C:</strong> Paul Reed</li>
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
