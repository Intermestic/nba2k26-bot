import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const TEAM_MAP: Record<string, string> = {
  "Atlanta Hawks": "Hawks", "Boston Celtics": "Celtics", "Brooklyn Nets": "Nets",
  "Charlotte Hornets": "Hornets", "Chicago Bulls": "Bulls", "Cleveland Cavaliers": "Cavaliers",
  "Dallas Mavericks": "Mavericks", "Denver Nuggets": "Nuggets", "Detroit Pistons": "Pistons",
  "Golden State Warriors": "Warriors", "Houston Rockets": "Rockets", "Indiana Pacers": "Pacers",
  "LA Clippers": "Clippers", "Los Angeles Clippers": "Clippers", "Los Angeles Lakers": "Lakers",
  "LA Lakers": "Lakers", "Memphis Grizzlies": "Grizzlies", "Miami Heat": "Heat",
  "Milwaukee Bucks": "Bucks", "Minnesota Timberwolves": "Timberwolves",
  "New Orleans Pelicans": "Pelicans", "New York Knicks": "Knicks",
  "Oklahoma City Thunder": "Thunder", "Orlando Magic": "Magic",
  "Philadelphia 76ers": "Sixers", "Philadelphia Sixers": "Sixers", "Phoenix Suns": "Suns",
  "Portland Trail Blazers": "Trail Blazers", "Sacramento Kings": "Kings",
  "San Antonio Spurs": "Spurs", "Toronto Raptors": "Raptors", "Utah Jazz": "Jazz",
  "Washington Wizards": "Wizards"
};

interface ParsedTransaction {
  playerName: string;
  playerId: string | null;
  currentTeam: string;
  newTeam: string;
  error?: string;
}

export default function Transactions() {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const { data: players } = trpc.player.list.useQuery({ limit: 1000 });
  const updateTeam = trpc.player.updateTeam.useMutation();

  if (!isAuthenticated || user?.role !== "admin") {
    return <div style={{padding:"40px",color:"#fff",background:"#0f172a",minHeight:"100vh"}}>
      <h2>Admin Only</h2>
      <a href="/" style={{color:"#60a5fa"}}>Go Home</a>
    </div>;
  }

  const normalize = (name: string) => TEAM_MAP[name] || name;

  const parseTransactions = () => {
    if (!players) return;
    
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    let currentTeam = "";
    const parsed: ParsedTransaction[] = [];

    for (const line of lines) {
      // Check for simplified format: "Player to Team"
      const simpleMatch = line.match(/^(.+?)\s+to\s+(.+)$/i);
      if (simpleMatch) {
        const playerName = simpleMatch[1].trim();
        const teamName = normalize(simpleMatch[2].trim());
        const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        
        if (player) {
          parsed.push({
            playerName: player.name,
            playerId: player.id,
            currentTeam: player.team || "Unknown",
            newTeam: teamName,
          });
        } else {
          parsed.push({
            playerName,
            playerId: null,
            currentTeam: "Unknown",
            newTeam: teamName,
            error: "Player not found in database"
          });
        }
        continue;
      }

      // Check for detailed format: "Team Receive:"
      if (line.endsWith("Receive:")) {
        currentTeam = normalize(line.replace("Receive:", "").trim());
        continue;
      }
      if (line === "---") continue;

      // Check for detailed format: "Player Name (XX OVR)"
      const detailedMatch = line.match(/^(.+?)\s*\((\d+)\s*OVR\)$/i);
      if (detailedMatch && currentTeam) {
        const playerName = detailedMatch[1].trim();
        const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        
        if (player) {
          parsed.push({
            playerName: player.name,
            playerId: player.id,
            currentTeam: player.team || "Unknown",
            newTeam: currentTeam,
          });
        } else {
          parsed.push({
            playerName,
            playerId: null,
            currentTeam: "Unknown",
            newTeam: currentTeam,
            error: "Player not found in database"
          });
        }
      }
    }

    setParsedTransactions(parsed);
    setShowPreview(true);
    setStatus(parsed.length > 0 ? `Parsed ${parsed.length} transactions` : "No transactions found");
  };

  const processTransactions = async () => {
    setProcessing(true);
    setStatus("Processing...");

    let count = 0;
    const errors: string[] = [];

    for (const transaction of parsedTransactions) {
      if (!transaction.playerId || transaction.error) {
        errors.push(`Skipped: ${transaction.playerName} - ${transaction.error}`);
        continue;
      }

      try {
        await updateTeam.mutateAsync({ 
          playerId: transaction.playerId, 
          team: transaction.newTeam 
        });
        count++;
      } catch (e) {
        errors.push(`Failed to move ${transaction.playerName}: ${e}`);
      }
    }

    setStatus(`Done! Processed ${count} transactions.${errors.length > 0 ? ` ${errors.length} errors.` : ''}`);
    setProcessing(false);
    setText("");
    setShowPreview(false);
    setParsedTransactions([]);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    padding: "20px"
  };

  const maxWidthStyle: React.CSSProperties = {
    maxWidth: "1000px",
    margin: "0 auto"
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "20px",
    borderBottom: "1px solid #334155",
    paddingBottom: "20px"
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "300px",
    background: "#1e293b",
    color: "white",
    border: "1px solid #475569",
    borderRadius: "4px",
    padding: "12px",
    fontFamily: "monospace",
    fontSize: "14px",
    display: "block"
  };

  const buttonStyle: React.CSSProperties = {
    background: "#3b82f6",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "10px"
  };

  const clearButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "#475569"
  };

  const processButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "#10b981"
  };

  const validCount = parsedTransactions.filter(t => !t.error).length;
  const errorCount = parsedTransactions.filter(t => t.error).length;

  return (
    <div style={containerStyle}>
      <div style={maxWidthStyle}>
        <div style={headerStyle}>
          <h1 style={{fontSize:"24px",marginBottom:"10px"}}>Bulk Transactions</h1>
          <div style={{display:"flex",gap:"10px"}}>
            <a href="/admin" style={{color:"#60a5fa"}}>Team Mgmt</a>
            <a href="/admin/players" style={{color:"#60a5fa"}}>Players</a>
            <a href="/" style={{color:"#60a5fa"}}>Home</a>
          </div>
        </div>

        <div style={{background:"#1e293b",padding:"20px",borderRadius:"8px",marginBottom:"20px"}}>
          <label style={{display:"block",marginBottom:"10px",fontWeight:"bold"}}>
            Paste Transaction Text:
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Simplified:\nAlexander-Walker to Thunder\nKeon Ellis to Pistons\n\nOr Detailed:\nBrooklyn Nets Receive:\nNikola Jokic (98 OVR)\nAaron Gordon (83 OVR)"
            style={textareaStyle}
          />
          <div style={{marginTop:"15px"}}>
            <button 
              onClick={parseTransactions} 
              disabled={!text.trim() || processing} 
              style={buttonStyle}
            >
              Parse Transactions
            </button>
            <button 
              onClick={() => { 
                setText(""); 
                setStatus(""); 
                setShowPreview(false); 
                setParsedTransactions([]);
              }} 
              style={clearButtonStyle}
            >
              Clear
            </button>
          </div>
          {status && <div style={{marginTop:"15px",padding:"10px",background:"#0f172a",borderRadius:"4px"}}>{status}</div>}
        </div>

        {showPreview && parsedTransactions.length > 0 && (
          <div style={{background:"#1e293b",padding:"20px",borderRadius:"8px",marginBottom:"20px"}}>
            <h2 style={{fontSize:"20px",marginBottom:"15px"}}>Preview ({validCount} valid, {errorCount} errors)</h2>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #334155"}}>
                    <th style={{textAlign:"left",padding:"10px",color:"#94a3b8"}}>Player</th>
                    <th style={{textAlign:"left",padding:"10px",color:"#94a3b8"}}>Current Team</th>
                    <th style={{textAlign:"center",padding:"10px",color:"#94a3b8"}}>→</th>
                    <th style={{textAlign:"left",padding:"10px",color:"#94a3b8"}}>New Team</th>
                    <th style={{textAlign:"left",padding:"10px",color:"#94a3b8"}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.map((transaction, index) => (
                    <tr 
                      key={index} 
                      style={{
                        borderBottom:"1px solid #334155",
                        background: transaction.error ? "#7f1d1d" : "transparent"
                      }}
                    >
                      <td style={{padding:"10px"}}>{transaction.playerName}</td>
                      <td style={{padding:"10px"}}>{transaction.currentTeam}</td>
                      <td style={{padding:"10px",textAlign:"center"}}>→</td>
                      <td style={{padding:"10px"}}>{transaction.newTeam}</td>
                      <td style={{padding:"10px",color: transaction.error ? "#fca5a5" : "#86efac"}}>
                        {transaction.error || "✓ Ready"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:"20px"}}>
              <button 
                onClick={processTransactions} 
                disabled={processing || validCount === 0} 
                style={processButtonStyle}
              >
                {processing ? "Processing..." : `Process ${validCount} Transactions`}
              </button>
              <button 
                onClick={() => {
                  setShowPreview(false);
                  setParsedTransactions([]);
                  setStatus("");
                }} 
                style={clearButtonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{background:"#1e293b",padding:"15px",borderRadius:"8px",fontSize:"14px",color:"#94a3b8"}}>
          <strong>Supported Formats:</strong>
          <pre style={{marginTop:"10px",fontSize:"12px"}}>
{`Simplified Format:
Player Name to Team Name
Another Player to Another Team

Detailed Trade Format:
Team Name Receive:

Player Name (XX OVR)
Another Player (XX OVR)

---

Another Team Receive:

Player Name (XX OVR)`}
          </pre>
        </div>
      </div>
    </div>
  );
}
