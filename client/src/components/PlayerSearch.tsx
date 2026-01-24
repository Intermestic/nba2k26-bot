import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface PlayerSearchResult {
  id: number;
  name: string;
  overall: number;
  team: string | null;
  photo_url?: string;
  player_page_url?: string;
  score?: number;
}

interface PlayerSearchProps {
  onPlayerSelect: (player: PlayerSearchResult) => void;
  placeholder?: string;
  limit?: number;
  className?: string;
}

export function PlayerSearch({
  onPlayerSelect,
  placeholder = 'Search players... (e.g., "jokic", "luka d", "nikola jokik")',
  limit = 10,
  className = '',
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fuzzy search query
  const { data: results = [], isLoading } = trpc.player.fuzzySearch.useQuery(
    { query, limit },
    { enabled: query.length > 0 }
  );

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelectPlayer(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, results, selectedIndex]);

  const handleSelectPlayer = (player: PlayerSearchResult) => {
    onPlayerSelect(player);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No players found matching "{query}"
            </div>
          )}

          {results.map((player, index) => (
            <button
              key={player.id}
              onClick={() => handleSelectPlayer(player)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left border-b last:border-b-0 ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              {/* Player photo */}
              {player.photo_url && (
                <img
                  src={player.photo_url}
                  alt={player.name}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{player.name}</div>
                <div className="text-xs text-muted-foreground">
                  {player.team ? `${player.team} • ` : ''}
                  {player.overall} OVR
                </div>
              </div>

              {/* Match score (if available) */}
              {player.score !== undefined && (
                <div className="text-xs text-muted-foreground ml-2">
                  {Math.round((1 - player.score) * 100)}% match
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Export a hook for using fuzzy search directly
export function useFuzzyPlayerSearch() {
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = trpc.player.fuzzySearch.useQuery(
    { query, limit: 10 },
    { enabled: query.length > 0 }
  );

  return {
    query,
    setQuery,
    results,
    isLoading,
  };
}
