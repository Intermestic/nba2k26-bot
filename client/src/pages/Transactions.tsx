import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import * as fuzz from "fuzzball";

const TEAM_MAP: Record<string, string> = {
  "Atlanta Hawks": "Hawks", "Boston Celtics": "Celtics", "Brooklyn Nets": "Nets",
  "Charlotte Hornets": "Hornets", "Chicago Bulls": "Bulls", "Cleveland Cavaliers": "Cavaliers",
  "Dallas Mavericks": "Mavericks", "Denver Nuggets": "Nuggets", "Detroit Pistons": "Pistons",
  "Golden State Warriors": "Warriors", "Houston Rockets": "Rockets", "Indiana Pacers": "Pacers",
  "Los Angeles Lakers": "Lakers",
  "LA Lakers": "Lakers", "Memphis Grizzlies": "Grizzlies", "Miami Heat": "Heat",
  "Milwaukee Bucks": "Bucks", "Minnesota Timberwolves": "Timberwolves",
  "New Orleans Pelicans": "Pelicans", "New York Knicks": "Knicks",
  "Orlando Magic": "Magic",
  "Philadelphia 76ers": "Sixers", "Philadelphia Sixers": "Sixers", "Phoenix Suns": "Suns",
  "Portland Trail Blazers": "Trail Blazers", "Sacramento Kings": "Kings",
  "San Antonio Spurs": "Spurs", "Toronto Raptors": "Raptors", "Utah Jazz": "Jazz",
  "Washington Wizards": "Wizards",
  // Add short name aliases
  "Hawks": "Hawks", "Celtics": "Celtics", "Nets": "Nets", "Hornets": "Hornets",
  "Bulls": "Bulls", "Cavaliers": "Cavaliers", "Mavericks": "Mavericks", "Nuggets": "Nuggets",
  "Pistons": "Pistons", "Warriors": "Warriors", "Rockets": "Rockets", "Pacers": "Pacers",
  "Lakers": "Lakers", "Grizzlies": "Grizzlies", "Heat": "Heat", "Bucks": "Bucks", "Timberwolves": "Timberwolves", "Pelicans": "Pelicans", "Knicks": "Knicks",
  "Magic": "Magic", "Sixers": "Sixers", "Suns": "Suns",
  "Trail Blazers": "Trail Blazers", "Blazers": "Trail Blazers", "Kings": "Kings",
  "Spurs": "Spurs", "Raptors": "Raptors", "Jazz": "Jazz", "Wizards": "Wizards"
};

// Valid NBA teams (28 teams)
const VALID_TEAMS = [
  "Hawks", "Celtics", "Nets", "Hornets", "Bulls", "Cavaliers", "Mavs", "Nuggets",
  "Pistons", "Warriors", "Rockets", "Pacers", "Lakers", "Grizzlies", "Heat",
  "Bucks", "Timberwolves", "Pelicans", "Knicks", "Magic", "Sixers", "Suns",
  "Trail Blazers", "Kings", "Spurs", "Raptors", "Jazz", "Wizards"
];

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

  // Normalize team name and validate it exists
  const normalizeTeam = (name: string): { team: string; error?: string } => {
    const normalized = TEAM_MAP[name];
    if (normalized && VALID_TEAMS.includes(normalized)) {
      return { team: normalized };
    }
    
    // Try fuzzy matching against valid teams
    const matches = fuzz.extract(name, VALID_TEAMS, { scorer: fuzz.token_set_ratio, limit: 1 });
    if (matches && matches.length > 0 && matches[0][1] >= 70) {
      return { team: matches[0][0] };
    }
    
    return { team: name, error: `Invalid team: "${name}" - must be one of 28 NBA teams` };
  };
  
  // Fuzzy match player name
  const findPlayer = (name: string) => {
    if (!players) return null;
    
    // Normalize input: remove Jr/Jr./III/II, trim, lowercase
    const normalizePlayerName = (n: string) => 
      n.toLowerCase()
        .replace(/\s+(jr\.?|sr\.?|iii|ii|iv)$/i, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
    
    const normalizedInput = normalizePlayerName(name);
    
    // Try exact match first
    const exactMatch = players.find(p => normalizePlayerName(p.name) === normalizedInput);
    if (exactMatch) return exactMatch;
    
    // Try fuzzy matching
    const playerNames = players.map(p => p.name);
    const matches = fuzz.extract(name, playerNames, { 
      scorer: fuzz.token_set_ratio, 
      limit: 1,
      cutoff: 75 // 75% similarity threshold
    });
    
    if (matches && matches.length > 0) {
      const matchedName = matches[0][0];
      return players.find(p => p.name === matchedName) || null;
    }
    
    return null;
  };

  const parseTransactions = () => {
    if (!players) return;
    
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    let currentTeam = "";
    const parsed: ParsedTransaction[] = [];
    
    // Track trade format (Team send: ... Team send: ...)
    const tradeTeams: { team: string; players: string[] }[] = [];
    let currentTradeTeam: { team: string; players: string[] } | null = null;

    for (const line of lines) {
      // Check for simplified format: "Player to Team"
      const simpleMatch = line.match(/^(.+?)\s+to\s+(.+)$/i);
      if (simpleMatch) {
        const playerName = simpleMatch[1].trim();
        const teamResult = normalizeTeam(simpleMatch[2].trim());
        const player = findPlayer(playerName);
        
        if (teamResult.error) {
          parsed.push({
            playerName,
            playerId: null,
            currentTeam: "Unknown",
            newTeam: teamResult.team,
            error: teamResult.error
          });
        } else if (player) {
          parsed.push({
            playerName: player.name,
            playerId: player.id,
            currentTeam: player.team || "Unknown",
            newTeam: teamResult.team,
          });
        } else {
          parsed.push({
            playerName,
            playerId: null,
            currentTeam: "Unknown",
            newTeam: teamResult.team,
            error: `Player not found: "${playerName}"`
          });
        }
        continue;
      }

      // Check for trade format: "Team send:"
      if (line.match(/send:\s*$/i)) {
        const teamName = line.replace(/send:\s*$/i, "").trim();
        const teamResult = normalizeTeam(teamName);
        if (teamResult.error) {
          setStatus(`Error: ${teamResult.error}`);
          return;
        }
        // Save previous trade team if exists
        if (currentTradeTeam && currentTradeTeam.players.length > 0) {
          tradeTeams.push(currentTradeTeam);
        }
        currentTradeTeam = { team: teamResult.team, players: [] };
        continue;
      }
      
      // Check for detailed format: "Team Receive:"
      if (line.endsWith("Receive:")) {
        const teamResult = normalizeTeam(line.replace("Receive:", "").trim());
        if (teamResult.error) {
          setStatus(`Error: ${teamResult.error}`);
          return;
        }
        currentTeam = teamResult.team;
        continue;
      }
      if (line === "---") continue;

      // Check for trade format player: "Player Name (XX) YY badges"
      const tradeMatch = line.match(/^(.+?)\s*\((\d+)\)\s*\d+\s*badges?$/i);
      if (tradeMatch && currentTradeTeam) {
        const playerName = tradeMatch[1].trim();
        currentTradeTeam.players.push(playerName);
        continue;
      }
      
      // Check for detailed format: "Player Name (XX OVR)"
      const detailedMatch = line.match(/^(.+?)\s*\((\d+)\s*OVR\)$/i);
      if (detailedMatch && currentTeam) {
        const playerName = detailedMatch[1].trim();
        const player = findPlayer(playerName);
        
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
            error: `Player not found: "${playerName}"`
          });
        }
      }
    }
    
    // Process trade format if we have trade teams
    if (currentTradeTeam && currentTradeTeam.players.length > 0) {
      tradeTeams.push(currentTradeTeam);
    }
    
    if (tradeTeams.length === 2) {
      // Two-team trade: Team A sends to Team B, Team B sends to Team A
      const [teamA, teamB] = tradeTeams;
      
      // Team A's players go to Team B
      for (const playerName of teamA.players) {
        const player = findPlayer(playerName);
        if (player) {
          parsed.push({
            playerName: player.name,
            playerId: player.id,
            currentTeam: player.team || "Unknown",
            newTeam: teamB.team,
          });
        } else {
          parsed.push({
            playerName,
            playerId: null,
            currentTeam: "Unknown",
            newTeam: teamB.team,
            error: `Player not found: "${playerName}"`
          });
        }
      }
      
      // Team B's players go to Team A
      for (const playerName of teamB.players) {
        const player = findPlayer(playerName);
        if (player) {
          parsed.push({
            playerName: player.name,
            playerId: player.id,
            currentTeam: player.team || "Unknown",
            newTeam: teamA.team,
          });
        } else {
          parsed.push({
            playerName,
            playerId: null,
            currentTeam: "Unknown",
            newTeam: teamA.team,
            error: `Player not found: "${playerName}"`
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
