import { ArrowLeft, Trophy, Shield, User } from "lucide-react";
import { Link } from "wouter";
import { season17Awards } from "@shared/season17Awards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

function PlayerHeadshot({ src, name }: { src?: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (!src || imgError) {
    return (
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={name}
      onError={() => setImgError(true)}
      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover flex-shrink-0 border-2 border-primary/20"
    />
  );
}

function TeamLogo({ src, team }: { src?: string; team: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (!src || imgError) {
    return null;
  }
  
  return (
    <img 
      src={src} 
      alt={`${team} logo`}
      onError={() => setImgError(true)}
      className="w-6 h-6 md:w-8 md:h-8 object-contain flex-shrink-0"
    />
  );
}

export default function Season17Awards() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-4">
              <Link href="/highlights">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Highlights</span>
                </button>
              </Link>
              <Link href="/">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  🏠 Home
                </button>
              </Link>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl md:text-4xl font-black text-primary flex items-center justify-center gap-3">
                <Trophy className="w-10 h-10 text-gold-500" />
                SEASON 17 ALL-HOF TEAMS
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="aspect-[21/9] w-full overflow-hidden">
          <img 
            src="/season17-all-hof-teams.png" 
            alt="Season 17 All-HoF Teams" 
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-5xl mx-auto space-y-16">
          {season17Awards.map((team, teamIndex) => {
            const isDefense = team.id.includes("defense");
            const Icon = isDefense ? Shield : Trophy;
            const iconColor = isDefense ? "text-blue-500" : "text-gold-500";
            
            return (
              <section key={team.id} className="space-y-6">
                {/* Team Title */}
                <div className="flex items-center gap-4 mb-8">
                  <Icon className={`w-12 h-12 ${iconColor}`} />
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black">
                      {team.title}
                    </h2>
                    {teamIndex === 0 && (
                      <p className="text-muted-foreground mt-1">
                        The league's elite offensive performers
                      </p>
                    )}
                    {teamIndex === 1 && (
                      <p className="text-muted-foreground mt-1">
                        Outstanding two-way contributors
                      </p>
                    )}
                    {teamIndex === 2 && (
                      <p className="text-muted-foreground mt-1">
                        The league's premier defensive stoppers
                      </p>
                    )}
                    {teamIndex === 3 && (
                      <p className="text-muted-foreground mt-1">
                        Elite defensive impact players
                      </p>
                    )}
                  </div>
                </div>

                {/* Players */}
                <div className="space-y-6">
                  {team.players.map((player, playerIndex) => (
                    <Card key={`${team.id}-${playerIndex}`} className="border-2 hover:border-primary transition-colors">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          {/* Player Headshot */}
                          <PlayerHeadshot src={player.headshot} name={player.name} />
                          
                          {/* Player Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-2xl font-black">
                                  {player.name}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <TeamLogo src={player.teamLogo} team={player.team} />
                                  <p className="text-lg text-muted-foreground">
                                    {player.team} • {player.gp} GP
                                  </p>
                                </div>
                              </div>
                              <div className="text-4xl font-black text-primary">
                                #{playerIndex + 1}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stats */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="font-mono text-sm md:text-base font-semibold">
                            {player.stats}
                          </p>
                        </div>
                        
                        {/* Description */}
                        <p className="text-muted-foreground leading-relaxed">
                          {player.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-card border border-border rounded-lg p-8 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Explore More Season 17 Content</h2>
          <p className="text-muted-foreground mb-6">
            View final standings, playoff bracket, and statistical leaders from Season 17
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/season17-wrapup">
              <button className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors">
                Season 17 Wrap-Up
              </button>
            </Link>
            <Link href="/highlights">
              <button className="px-8 py-3 bg-secondary text-secondary-foreground font-bold rounded-lg hover:bg-secondary/90 transition-colors">
                View Stat Leaders
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            © 2026 Hall of Fame Basketball Association. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            HoFSN - Your source for NBA 2K26 league coverage
          </p>
        </div>
      </footer>
    </div>
  );
}
