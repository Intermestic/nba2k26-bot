import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAPlayerSelectionProps {
  onPlayerSelect: (player: {
    id: string;
    name: string;
    overall: number;
    team: string | null;
  }) => void;
  selectedPlayerId?: string;
  title?: string;
  description?: string;
}

export function FAPlayerSelection({
  onPlayerSelect,
  selectedPlayerId,
  title = "Select Player",
  description = "Search for a player to bid on",
}: FAPlayerSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Fuzzy search query
  const { data: searchResults, isLoading } = trpc.player.fuzzySearch.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 0 && isOpen }
  );

  const handleSelectPlayer = useCallback(
    (player: any) => {
      onPlayerSelect({
        id: String(player.id),
        name: player.name,
        overall: player.overall,
        team: player.team,
      });
      setSearchQuery("");
      setIsOpen(false);
    },
    [onPlayerSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by player name (e.g., 'jokic', 'luka d', 'anthony')"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="pl-10"
            />
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isOpen && searchQuery.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map((player: any) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-muted transition-colors flex items-center justify-between",
                      selectedPlayerId === String(player.id) && "bg-muted"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.team || "Free Agent"} • OVR: {player.overall}
                      </div>
                    </div>
                    {selectedPlayerId === String(player.id) && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No players found. Try a different search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Player Display */}
      {selectedPlayerId && searchResults && (
        <div>
          {(() => {
            const selected = searchResults.find(
              (p: any) => String(p.id) === selectedPlayerId
            );
            if (!selected) return null;

            return (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{selected.name}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selected.team || "FA"}</Badge>
                        <Badge variant="secondary">OVR: {selected.overall}</Badge>
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Search Tips */}
      {!isOpen && searchQuery.length === 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Search Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Search by first or last name</li>
                  <li>Typos are okay (e.g., "jokik" finds "Jokic")</li>
                  <li>Partial names work (e.g., "luka d" finds "Luka Doncic")</li>
                  <li>Case-insensitive search</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
