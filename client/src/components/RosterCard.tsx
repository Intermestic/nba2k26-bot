import { useState, useRef, useEffect } from "react";
import { X, Download, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
// @ts-ignore - dom-to-image-more doesn't have types
import { toPng } from "dom-to-image-more";

interface Player {
  id: string;
  name: string;
  overall: number;
  team?: string | null;
  photoUrl?: string | null;
}

interface RosterCardProps {
  players: Player[];
  onClose: () => void;
}

// Team logos mapping
const TEAM_LOGOS: Record<string, string> = {
  "76ers": "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg",
  "Bucks": "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
  "Bulls": "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg",
  "Cavaliers": "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg",
  "Celtics": "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
  "Clippers": "https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg",
  "Grizzlies": "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg",
  "Hawks": "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg",
  "Heat": "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
  "Hornets": "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg",
  "Jazz": "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg",
  "Kings": "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg",
  "Knicks": "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg",
  "Lakers": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
  "Magic": "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg",
  "Mavericks": "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg",
  "Nets": "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg",
  "Nuggets": "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
  "Pacers": "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg",
  "Pelicans": "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg",
  "Pistons": "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg",
  "Raptors": "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg",
  "Rockets": "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg",
  "Spurs": "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg",
  "Suns": "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
  "Thunder": "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg",
  "Timberwolves": "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg",
  "Trail Blazers": "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg",
  "Warriors": "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
  "Wizards": "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg"
};

export function RosterCard({ players, onClose }: RosterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [gridColumns, setGridColumns] = useState(5);

  // Responsive grid columns based on window width
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setGridColumns(2); // mobile
      else if (width < 1024) setGridColumns(3); // tablet
      else setGridColumns(5); // desktop
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const teamName = players[0]?.team || "Mixed";
  const teamLogo = TEAM_LOGOS[teamName];
  const totalOverall = players.reduce((sum, p) => sum + p.overall, 0);
  const avgOverall = Math.round(totalOverall / players.length);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `${teamName}-roster-card.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Roster card downloaded!");
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Failed to download roster card");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast.error("Sharing not supported on this device");
      return;
    }

    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${teamName}-roster-card.png`, { type: 'image/png' });
      
      await navigator.share({
        files: [file],
        title: `${teamName} Roster Card`,
        text: `Check out the ${teamName} roster!`,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error("Failed to share roster card");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex flex-col z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-6xl mx-auto flex flex-col max-h-[calc(100vh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Roster Card Preview</h2>
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              disabled={isDownloading}
              variant="outline"
              className="border-slate-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Card Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            ref={cardRef}
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              padding: '32px',
              borderRadius: '12px',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            {/* Header Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #334155',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', border: 'none', outline: 'none', boxShadow: 'none' }}>
                {teamLogo && (
                  <img
                    src={teamLogo}
                    alt={teamName}
                    style={{ width: '64px', height: '64px', border: 'none', outline: 'none', boxShadow: 'none' }}
                  />
                )}
                <div style={{ border: 'none', outline: 'none', boxShadow: 'none' }}>
                  <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: 0, border: 'none', outline: 'none', boxShadow: 'none' }}>
                    {teamName}
                  </h3>
                  <p style={{ fontSize: '16px', color: '#94a3b8', margin: 0, border: 'none', outline: 'none', boxShadow: 'none' }}>
                    {players.length} Players • Avg {avgOverall} OVR
                  </p>
                </div>
              </div>
            </div>

            {/* Players Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gap: '16px',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
            >
              {players.map((player) => (
                <div
                  key={player.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                >
                  {/* Player Photo */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#475569', border: 'none', outline: 'none', boxShadow: 'none' }}>
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div style={{ border: 'none', outline: 'none', boxShadow: 'none' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      {player.name}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      {player.overall}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
