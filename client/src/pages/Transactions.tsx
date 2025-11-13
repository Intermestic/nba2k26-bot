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

export default function Transactions() {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: players } = trpc.player.list.useQuery({ limit: 1000 });
  const updateTeam = trpc.player.updateTeam.useMutation();

  if (!isAuthenticated || user?.role !== "admin") {
    return <div style={{padding:"40px",color:"#fff",background:"#0f172a",minHeight:"100vh"}}>
      <h2>Admin Only</h2>
      <a href="/" style={{color:"#60a5fa"}}>Go Home</a>
    </div>;
  }

  const normalize = (name: string) => TEAM_MAP[name] || name;

  const process = async () => {
    if (!players) return;
    setProcessing(true);
    setStatus("Processing...");

    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    let currentTeam = "";
    let count = 0;

    for (const line of lines) {
      if (line.endsWith("Receive:")) {
        currentTeam = normalize(line.replace("Receive:", "").trim());
        continue;
      }
      if (line === "---") continue;

      const match = line.match(/^(.+?)\s*\((\d+)\s*OVR\)$/i);
      if (match && currentTeam) {
        const playerName = match[1].trim();
        const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        
        if (player) {
          try {
            await updateTeam.mutateAsync({ playerId: player.id, team: currentTeam });
            count++;
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    setStatus(`Done! Processed ${count} transactions.`);
    setProcessing(false);
    setText("");
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    padding: "20px"
  };

  const maxWidthStyle: React.CSSProperties = {
    maxWidth: "800px",
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
            placeholder="Brooklyn Nets Receive:\n\nNikola Jokic (98 OVR)\nAaron Gordon (83 OVR)\n\n---\n\nMilwaukee Bucks Receive:\n\nBam Adebayo (89 OVR)"
            style={textareaStyle}
          />
          <div style={{marginTop:"15px"}}>
            <button onClick={process} disabled={!text.trim() || processing} style={buttonStyle}>
              {processing ? "Processing..." : "Process Transactions"}
            </button>
            <button onClick={() => { setText(""); setStatus(""); }} style={clearButtonStyle}>
              Clear
            </button>
          </div>
          {status && <div style={{marginTop:"15px",padding:"10px",background:"#0f172a",borderRadius:"4px"}}>{status}</div>}
        </div>

        <div style={{background:"#1e293b",padding:"15px",borderRadius:"8px",fontSize:"14px",color:"#94a3b8"}}>
          <strong>Format:</strong>
          <pre style={{marginTop:"10px",fontSize:"12px"}}>
{`Team Name Receive:

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
