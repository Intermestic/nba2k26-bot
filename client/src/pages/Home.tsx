import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Player {
  id: string;
  name: string;
  overall: number;
  photo_url?: string;
  player_page_url?: string;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Add cache-busting timestamp to force fresh data load
    const timestamp = new Date().getTime();
    fetch(`/players.json?v=${timestamp}`)
      .then((res) => res.json())
      .then((data) => {
        // Handle both old format (array) and new format (object with metadata)
        if (Array.isArray(data)) {
          setPlayers(data);
        } else {
          setPlayers(data.players || []);
          setLastUpdated(data.lastUpdated || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading players:", err);
        setLoading(false);
      });
  }, []);

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = p.overall >= parseInt(minRating);
        return matchesSearch && matchesRating;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [players, searchTerm, minRating]);

  // Autocomplete suggestions (top 10 matches)
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return players
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 10);
  }, [players, searchTerm]);

  const stats = useMemo(() => {
    const withPhotos = players.filter((p) => p.photo_url).length;
    const avgRating = players.reduce((sum, p) => sum + p.overall, 0) / players.length;
    return {
      total: players.length,
      withPhotos,
      photoPercent: ((withPhotos / players.length) * 100).toFixed(1),
      avgRating: avgRating.toFixed(1),
    };
  }, [players]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/hof-logo.png" alt="Hall of Fame Basketball Association" className="h-16 md:h-20 w-auto" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">HoF NBA 2K26 Player Database</h1>
                <p className="text-slate-400 mt-1">Complete roster with ratings and photos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <a href="/players.csv" download>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </a>
              </Button>
              <Button asChild variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <a href="/players.json" download>
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Players</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.photoPercent}%</div>
              <div className="text-sm text-slate-400">With Photos</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.avgRating}</div>
              <div className="text-sm text-slate-400">Avg Rating</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{filteredPlayers.length}</div>
              <div className="text-sm text-slate-400">Filtered</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                {suggestions.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSearchTerm(player.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors text-left"
                  >
                    {player.photo_url && player.photo_url.includes('cdn.nba.com') ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">
                        {player.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-white font-medium">{player.name}</div>
                    </div>
                    <div className="text-slate-400 font-bold">{player.overall}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="0">All Ratings</SelectItem>
                <SelectItem value="90">90+ Elite</SelectItem>
                <SelectItem value="85">85+ All-Star</SelectItem>
                <SelectItem value="80">80+ Starter</SelectItem>
                <SelectItem value="75">75+ Rotation</SelectItem>
                <SelectItem value="70">70+ Bench</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Player Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading players...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPlayers.map((player) => (
              <Card
                key={player.id}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors overflow-hidden group"
              >
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
                    {player.photo_url && player.photo_url.includes('cdn.nba.com') ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "";
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
                        {player.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-bold">
                      {player.overall}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm line-clamp-2">{player.name}</h3>
                    {player.player_page_url && (
                      <a
                        href={player.player_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredPlayers.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">No players found matching your criteria.</div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>
            HoF NBA 2K26 Player Database • {stats.total} Players • {stats.photoPercent}% Photo Coverage
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-slate-500">
              Last Updated: {new Date(lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          <p className="mt-2">
            Data from{" "}
            <a href="https://www.2kratings.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              2K Ratings
            </a>{" "}
            • Photos from{" "}
            <a href="https://www.nba.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              NBA.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
