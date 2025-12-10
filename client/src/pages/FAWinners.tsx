import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, Users, Award } from "lucide-react";

// Mock data - will be replaced with tRPC query
const mockFASignings = [
  {
    id: 1,
    playerName: "Deandre Ayton",
    newTeam: "Los Angeles Lakers",
    formerTeam: "Portland Trail Blazers",
    signedDate: "2025-07-06",
    contractType: "Free Agent",
    isWaived: true,
    notes: "Waived on June 29"
  },
  {
    id: 2,
    playerName: "Myles Turner",
    newTeam: "Milwaukee Bucks",
    formerTeam: "Indiana Pacers",
    signedDate: "2025-07-06",
    contractType: "Free Agent",
    isWaived: false,
  },
  {
    id: 3,
    playerName: "Bradley Beal",
    newTeam: "Los Angeles Clippers",
    formerTeam: "Phoenix Suns",
    signedDate: "2025-07-18",
    contractType: "Free Agent",
    isWaived: true,
    notes: "Waived on July 16"
  },
  {
    id: 4,
    playerName: "Damian Lillard",
    newTeam: "Portland Trail Blazers",
    formerTeam: "Milwaukee Bucks",
    signedDate: "2025-07-19",
    contractType: "Free Agent",
    isWaived: true,
    notes: "Waived on July 7"
  },
  {
    id: 5,
    playerName: "Julius Randle",
    newTeam: "Minnesota Timberwolves",
    formerTeam: "Minnesota Timberwolves",
    signedDate: "2025-07-15",
    contractType: "Free Agent",
    isWaived: false,
  },
];

export default function FAWinners() {
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [contractFilter, setContractFilter] = useState("all");

  // Get unique teams for filter
  const teams = Array.from(new Set(mockFASignings.map(s => s.newTeam))).sort();

  // Filter signings
  const filteredSignings = mockFASignings.filter(signing => {
    const matchesSearch = signing.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signing.newTeam.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === "all" || signing.newTeam === teamFilter;
    const matchesContract = contractFilter === "all" || 
                           (contractFilter === "sign-and-trade" && signing.contractType === "Sign-and-Trade") ||
                           (contractFilter === "rfa" && signing.contractType === "RFA") ||
                           (contractFilter === "free-agent" && signing.contractType === "Free Agent");
    return matchesSearch && matchesTeam && matchesContract;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">2025 FA Window Winners</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Track the biggest free agency signings from the 2025 NBA off-season
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Signings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{mockFASignings.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Sign-and-Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {mockFASignings.filter(s => s.contractType === "Sign-and-Trade").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Waived Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {mockFASignings.filter(s => s.isWaived).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Filter Signings</CardTitle>
            <CardDescription className="text-slate-400">
              Search and filter by team or contract type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search players or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-white">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team} className="text-white">{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="All Contract Types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-white">All Types</SelectItem>
                  <SelectItem value="free-agent" className="text-white">Free Agent</SelectItem>
                  <SelectItem value="sign-and-trade" className="text-white">Sign-and-Trade</SelectItem>
                  <SelectItem value="rfa" className="text-white">RFA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Signings List */}
        <div className="space-y-4">
          {filteredSignings.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400 text-lg">No signings found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredSignings.map((signing) => (
              <Card key={signing.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{signing.playerName}</h3>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {signing.contractType}
                        </Badge>
                        {signing.isWaived && (
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            Waived
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>{signing.formerTeam || "Free Agent"}</span>
                        <span>→</span>
                        <span className="text-white font-semibold">{signing.newTeam}</span>
                      </div>
                      
                      {signing.notes && (
                        <p className="text-sm text-slate-500 mt-2">{signing.notes}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-400">Signed</div>
                      <div className="text-white font-medium">
                        {new Date(signing.signedDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
