import { APP_LOGO } from "@/const";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Flame, Calendar } from "lucide-react";

export default function Matchups() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/">
            <img src={APP_LOGO} alt="HoFSN" className="h-12 w-12 object-contain" />
          </Link>
        </div>
      </header>

      {/* Page Header */}
      <section className="bg-card border-b border-border">
        <div className="container py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-12 h-12 text-primary" fill="currentColor" />
            <h1 className="text-4xl md:text-5xl font-black text-primary">HOT MATCHUPS</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Don't miss these upcoming games
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="container py-12 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Featured Matchup - TONIGHT */}
          <Card className="border-2 border-primary bg-card text-card-foreground relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-black animate-pulse">
                TONIGHT!
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-primary" fill="currentColor" />
                <span className="text-primary font-bold text-sm">FEATURED MATCHUP</span>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-black">
                Lions vs Bears
              </CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Tonight • 8:00 PM EST</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Matchup Display */}
              <div className="grid grid-cols-3 gap-4 items-center py-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">🦁</span>
                  </div>
                  <h3 className="font-black text-xl text-foreground">LIONS</h3>
                  <p className="text-sm text-muted-foreground">6-2</p>
                </div>
                <div className="text-center">
                  <span className="text-4xl font-black text-primary">VS</span>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">🐻</span>
                  </div>
                  <h3 className="font-black text-xl text-foreground">BEARS</h3>
                  <p className="text-sm text-muted-foreground">5-3</p>
                </div>
              </div>

              <div className="bg-secondary p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-primary">Game Preview</h4>
                <p className="text-sm text-foreground leading-relaxed">
                  Two division rivals clash in what promises to be an intense battle. The Lions are coming off 
                  a tough loss and will look to bounce back at home, while the Bears are riding a two-game winning streak. 
                  Expect a physical, defensive-minded game with playoff implications on the line.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Key Player - Lions</p>
                  <p className="font-bold text-foreground">J. Smith (PG)</p>
                  <p className="text-xs text-muted-foreground">24.5 PPG, 8.2 APG</p>
                </div>
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Key Player - Bears</p>
                  <p className="font-bold text-foreground">M. Johnson (SF)</p>
                  <p className="text-xs text-muted-foreground">21.8 PPG, 7.5 RPG</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Matchup 1 */}
          <Card className="border-2 border-border bg-card text-card-foreground">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-black">
                Kings vs Pirates
              </CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Friday • 7:30 PM EST</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 items-center py-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">👑</span>
                  </div>
                  <h3 className="font-bold text-foreground">KINGS</h3>
                  <p className="text-xs text-muted-foreground">7-1</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-primary">VS</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🏴‍☠️</span>
                  </div>
                  <h3 className="font-bold text-foreground">PIRATES</h3>
                  <p className="text-xs text-muted-foreground">4-4</p>
                </div>
              </div>
              <p className="text-sm text-foreground">
                The league-leading Kings face a scrappy Pirates team looking to play spoiler. 
                Can the Pirates pull off the upset?
              </p>
            </CardContent>
          </Card>

          {/* Upcoming Matchup 2 */}
          <Card className="border-2 border-border bg-card text-card-foreground">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-black">
                Eagles vs Knights
              </CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Saturday • 9:00 PM EST</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 items-center py-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🦅</span>
                  </div>
                  <h3 className="font-bold text-foreground">EAGLES</h3>
                  <p className="text-xs text-muted-foreground">8-0</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-primary">VS</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">⚔️</span>
                  </div>
                  <h3 className="font-bold text-foreground">KNIGHTS</h3>
                  <p className="text-xs text-muted-foreground">6-2</p>
                </div>
              </div>
              <p className="text-sm text-foreground">
                Battle of the titans! The undefeated Eagles take on the red-hot Knights in what could be 
                the game of the year. This is must-watch basketball!
              </p>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            © 2024 Hall of Fame Basketball Association. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
