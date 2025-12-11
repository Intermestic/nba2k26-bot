import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Share2, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { getTeamColors, getTeamGradient, getContrastColor } from '@/lib/teamColors';

interface Player {
  id: string;
  name: string;
  overall: number;
  team: string | null;
  photoUrl?: string | null;
  salaryCap?: number | null;
  isRookie?: number;
  draftYear?: number | null;
  height?: string | null;
}

interface RosterCardProps {
  players: Player[];
  teamName: string;
  teamLogo?: string;
  onClose: () => void;
}

type ExportFormat = 'png' | '4k' | 'instagram' | 'pdf';

export default function RosterCard({ players, teamName, teamLogo, onClose }: RosterCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Sort players by overall rating (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.overall - a.overall);
  
  // Convert team logo to base64 for html2canvas compatibility
  useEffect(() => {
    if (teamLogo) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setLogoDataUrl(canvas.toDataURL('image/png'));
        }
      };
      img.src = `/api/image-proxy?url=${encodeURIComponent(teamLogo)}`;
    }
  }, [teamLogo]);
  
  // Get team colors
  const teamColors = getTeamColors(teamName);
  const teamGradient = getTeamGradient(teamName);
  const textColor = getContrastColor(teamColors.primary);
  
  // Calculate average overall
  const avgOverall = Math.round(
    sortedPlayers.reduce((sum, p) => sum + p.overall, 0) / sortedPlayers.length
  );

  // Calculate total overall (cap)
  const totalOverall = sortedPlayers.reduce((sum, p) => sum + p.overall, 0);
  const CAP_LIMIT = 1098; // Total overall cap limit
  const overCap = totalOverall > CAP_LIMIT ? totalOverall - CAP_LIMIT : 0;
  const isFullTeam = sortedPlayers.length === 14;

  // Determine layout: if 5+ players, use special layout
  const useSpecialLayout = sortedPlayers.length >= 5;
  
  // For special layout: top 2 players, then rows of 3
  const topPlayers = useSpecialLayout ? sortedPlayers.slice(0, 2) : [];
  const bottomPlayers = useSpecialLayout ? sortedPlayers.slice(2) : sortedPlayers;
  
  // Grid columns for regular layout
  const gridColumns = sortedPlayers.length <= 4 ? 2 : sortedPlayers.length <= 9 ? 3 : 5;

  const handleDownload = async (format: ExportFormat = 'png') => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    setShowFormatMenu(false);
    try {
      // Preload all images to ensure they're ready for html2canvas
      const images = cardRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true); // Continue even if image fails
            }
          });
        })
      );
      
      // Small delay to ensure DOM is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Determine scale and dimensions based on format
      let scale = 2;
      let width = cardRef.current.offsetWidth;
      let height = cardRef.current.offsetHeight;
      
      if (format === '4k') {
        scale = 4; // 4K resolution
      } else if (format === 'instagram') {
        // Instagram story size: 1080x1920
        scale = 1080 / width;
      }
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: teamColors.secondary,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: format === 'instagram' ? 1080 : undefined,
        height: format === 'instagram' ? 1920 : undefined,
        onclone: (clonedDoc) => {
          // Override CSS variables with RGB equivalents to avoid OKLCH parsing
          const root = clonedDoc.documentElement;
          root.style.setProperty('--background', '#ffffff');
          root.style.setProperty('--foreground', '#3c3c43');
          root.style.setProperty('--card', '#ffffff');
          root.style.setProperty('--card-foreground', '#3c3c43');
          root.style.setProperty('--popover', '#ffffff');
          root.style.setProperty('--popover-foreground', '#3c3c43');
          root.style.setProperty('--secondary', '#f9fafb');
          root.style.setProperty('--secondary-foreground', '#666666');
          root.style.setProperty('--muted', '#f3f4f6');
          root.style.setProperty('--muted-foreground', '#8c8c91');
          root.style.setProperty('--accent', '#f3f4f6');
          root.style.setProperty('--accent-foreground', '#242428');
          root.style.setProperty('--destructive', '#dc2626');
          root.style.setProperty('--destructive-foreground', '#fafafa');
          root.style.setProperty('--border', '#e5e7eb');
          root.style.setProperty('--input', '#e5e7eb');
          root.style.setProperty('--ring', '#3b82f6');
        },
      });
      
      if (format === 'pdf') {
        // For PDF, we'll use the canvas as an image in a PDF
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = await import('jspdf');
        const pdfDoc = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2]
        });
        pdfDoc.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdfDoc.save(`${teamName}-roster-card.pdf`);
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const formatSuffix = format === '4k' ? '-4k' : format === 'instagram' ? '-instagram' : '';
        link.download = `${teamName}-roster-card${formatSuffix}.png`;
        link.href = dataUrl;
        link.click();
      }
      
      const formatNames = { png: 'PNG', '4k': '4K PNG', instagram: 'Instagram Story', pdf: 'PDF' };
      toast.success(`Roster card downloaded as ${formatNames[format]}!`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      // Small delay to ensure DOM is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        onclone: (clonedDoc) => {
          // Override CSS variables with RGB equivalents to avoid OKLCH parsing
          const root = clonedDoc.documentElement;
          root.style.setProperty('--background', '#0f172a');
          root.style.setProperty('--foreground', '#d9d9dc');
          root.style.setProperty('--card', '#1e293b');
          root.style.setProperty('--card-foreground', '#d9d9dc');
          root.style.setProperty('--popover', '#1e293b');
          root.style.setProperty('--popover-foreground', '#d9d9dc');
          root.style.setProperty('--secondary', '#1e293b');
          root.style.setProperty('--secondary-foreground', '#b3b3b8');
          root.style.setProperty('--muted', '#334155');
          root.style.setProperty('--muted-foreground', '#b4b4b9');
          root.style.setProperty('--accent', '#334155');
          root.style.setProperty('--accent-foreground', '#ebebec');
          root.style.setProperty('--destructive', '#ef4444');
          root.style.setProperty('--destructive-foreground', '#fafafa');
          root.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
          root.style.setProperty('--input', 'rgba(255, 255, 255, 0.15)');
          root.style.setProperty('--ring', '#60a5fa');
        },
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${teamName}-roster-card.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${teamName} Roster Card`,
          text: `${teamName} - ${sortedPlayers.length} Players • Avg ${avgOverall} OVR`,
        });
        toast.success('Shared successfully!');
      } else {
        // Fallback to download if share not supported
        handleDownload();
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error(`Share failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Roster Card Preview</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Button
                onClick={() => handleDownload('4k')}
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download 4K PNG
              </Button>
              {showFormatMenu && (
                <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-[180px]" style={{ display: 'none' }}>
                  <button
                    onClick={() => handleDownload('png')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-t-lg"
                  >
                    PNG (Standard)
                  </button>
                  <button
                    onClick={() => handleDownload('4k')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700"
                  >
                    4K PNG (High-Res)
                  </button>
                  <button
                    onClick={() => handleDownload('instagram')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700"
                  >
                    Instagram Story
                  </button>
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-b-lg"
                  >
                    PDF Document
                  </button>
                </div>
              )}
            </div>
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
              background: teamGradient,
              padding: '32px',
              borderRadius: '12px',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            {useSpecialLayout ? (
              <>
                {/* Top Row: Player 1 | Team Logo | Player 2 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '24px',
                    alignItems: 'center',
                    marginBottom: '32px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                >
                  {/* Player 1 (Highest OVR) */}
                  {topPlayers[0] && (
                    <div
                      style={{
                        background: '#1e293b',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '5/4',
                          marginBottom: '12px',
                          borderRadius: '12px',
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
                        {topPlayers[0].photoUrl ? (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(topPlayers[0].photoUrl)}`}
                            alt={topPlayers[0].name}
                            crossOrigin="anonymous"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              border: 'none',
                              outline: 'none',
                              boxShadow: 'none',
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#475569', border: 'none', outline: 'none', boxShadow: 'none' }}>
                            {topPlayers[0].name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}

                        {/* Bottom Banner with Overall and Rookie Status - Always Hidden for Export */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
                            padding: '6px',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              color: '#FFD700',
                              fontSize: '24px',
                              fontWeight: 'bold',
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            {topPlayers[0].overall}
                          </div>
                          {topPlayers[0].isRookie === 1 && (
                            <div
                              style={{
                                color: '#FFD700',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                              }}
                            >
                              R
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rating and Rookie Badge Above Name - Always Visible for Export */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <div
                          style={{
                            color: '#FFD700',
                            fontSize: '24px',
                            fontWeight: 'bold',
                          }}
                        >
                          {topPlayers[0].overall}
                        </div>
                        {topPlayers[0].isRookie === 1 && (
                          <div
                            style={{
                              color: '#FFD700',
                              fontSize: '24px',
                              fontWeight: 'bold',
                            }}
                          >
                            R
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                        fontSize: '17px',
                        fontWeight: '600',
                        color: 'white',
                        marginBottom: '4px',
                        lineHeight: '1.3',
                        minHeight: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {topPlayers[0].name}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#94a3b8',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {teamName}
                      </div>
                    </div>
                  )}

                  {/* Team Logo Center */}
                  {teamLogo && (
                  <div
                    style={{
                      width: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                    className="w-32 md:w-[200px]"
                  >
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={logoDataUrl || `/api/image-proxy?url=${encodeURIComponent(teamLogo)}`}
                        alt={`${teamName} logo`}
                        crossOrigin="anonymous"
                        style={{
                          width: '150px',
                          height: '150px',
                          objectFit: 'contain',
                          marginBottom: '12px',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                        className="!w-20 !h-20 md:!w-[150px] md:!h-[150px] !mb-2 md:!mb-3"
                      />
                      <h2
                        style={{
                          fontSize: '32px',
                          fontWeight: 'bold',
                          color: 'white',
                          margin: 0,
                          marginBottom: '8px',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                        className="!text-xl md:!text-3xl !mb-1 md:!mb-2"
                      >
                        {teamName}
                      </h2>
                      <div
                        style={{
                          fontSize: '18px',
                          color: '#94a3b8',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                        className="!text-sm md:!text-lg"
                      >
                        {sortedPlayers.length} Players
                      </div>
                      {isFullTeam && (
                        <div
                          style={{
                            fontSize: '16px',
                            color: overCap > 0 ? '#ef4444' : '#10b981',
                            fontWeight: 'bold',
                            marginTop: '8px',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                          }}
                          className="!text-xs md:!text-base !mt-1 md:!mt-2"
                        >
                          Cap: {totalOverall} OVR{overCap > 0 && ` (+${overCap})`}
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Player 2 (Second Highest OVR) */}
                  {topPlayers[1] && (
                    <div
                      style={{
                        background: '#1e293b',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '5/4',
                          marginBottom: '12px',
                          borderRadius: '12px',
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
                        {topPlayers[1].photoUrl ? (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(topPlayers[1].photoUrl)}`}
                            alt={topPlayers[1].name}
                            crossOrigin="anonymous"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              border: 'none',
                              outline: 'none',
                              boxShadow: 'none',
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#475569', border: 'none', outline: 'none', boxShadow: 'none' }}>
                            {topPlayers[1].name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}

                        {/* Bottom Banner with Overall and Rookie Status - Always Hidden for Export */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
                            padding: '6px',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              color: '#FFD700',
                              fontSize: '24px',
                              fontWeight: 'bold',
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            {topPlayers[1].overall}
                          </div>
                          {topPlayers[1].isRookie === 1 && (
                            <div
                              style={{
                                color: '#FFD700',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                              }}
                            >
                              R
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rating and Rookie Badge Above Name - Always Visible for Export */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <div
                          style={{
                            color: '#FFD700',
                            fontSize: '24px',
                            fontWeight: 'bold',
                          }}
                        >
                          {topPlayers[1].overall}
                        </div>
                        {topPlayers[1].isRookie === 1 && (
                          <div
                            style={{
                              color: '#FFD700',
                              fontSize: '24px',
                              fontWeight: 'bold',
                            }}
                          >
                            R
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '17px',
                          fontWeight: '600',
                          color: 'white',
                          marginBottom: '4px',
                          lineHeight: '1.3',
                          minHeight: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {topPlayers[1].name}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#94a3b8',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {teamName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Rows: Remaining Players in Rows of 4 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridAutoRows: '1fr',
                    gap: '16px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                >
                  {bottomPlayers.map((player) => (
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
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '5/4',
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
                            src={`/api/image-proxy?url=${encodeURIComponent(player.photoUrl)}`}
                            alt={player.name}
                            crossOrigin="anonymous"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
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

                        {/* Bottom Banner with Overall and Rookie Status - Always Hidden for Export */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
                            padding: '4px',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <div
                            style={{
                              color: '#FFD700',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            {player.overall}
                          </div>
                          {player.isRookie === 1 && (
                            <div
                              style={{
                                color: '#FFD700',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                              }}
                            >
                              R
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rating and Rookie Badge Above Name - Always Visible for Export */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <div
                          style={{
                            color: '#FFD700',
                            fontSize: '18px',
                            fontWeight: 'bold',
                          }}
                        >
                          {player.overall}
                        </div>
                        {player.isRookie === 1 && (
                          <div
                            style={{
                              color: '#FFD700',
                              fontSize: '18px',
                              fontWeight: 'bold',
                            }}
                          >
                            R
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          marginBottom: '4px',
                          lineHeight: '1.3',
                          minHeight: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {player.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {teamName}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Header Section for Regular Layout */}
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
                        {sortedPlayers.length} Players
                      </p>
                      {isFullTeam && (
                        <p style={{ fontSize: '14px', color: overCap > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold', margin: '4px 0 0 0', border: 'none', outline: 'none', boxShadow: 'none' }}>
                          Cap: {totalOverall} OVR{overCap > 0 && ` (+${overCap})`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Players Grid for Regular Layout */}
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
                  {sortedPlayers.map((player) => (
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
                            src={`/api/image-proxy?url=${encodeURIComponent(player.photoUrl)}`}
                            alt={player.name}
                            crossOrigin="anonymous"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
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
                            lineHeight: '1.2',
                            textAlign: 'center',
                            wordBreak: 'break-word',
                            hyphens: 'auto',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                          }}
                        >
                          {player.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', outline: 'none', boxShadow: 'none' }}>
                          {player.isRookie === 1 && (
                            <div
                              style={{
                                color: '#FFD700',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)',
                              }}
                            >
                              R
                            </div>
                          )}
                          <div
                            style={{
                              color: '#FFD700',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)',
                            }}
                          >
                            {player.overall}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
