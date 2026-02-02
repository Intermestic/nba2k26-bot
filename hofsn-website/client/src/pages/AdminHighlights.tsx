import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CardType = "playoff" | "award" | "stat_leader" | "other";
type DisplayLocation = "homepage" | "highlights" | "both";

interface HighlightCardForm {
  image: string;
  title: string;
  stat: string;
  category: string;
  link: string;
  linkText: string;
  displayLocation: DisplayLocation;
  cardType: CardType;
  priority: number;
  postToDiscord: boolean;
}

const defaultForm: HighlightCardForm = {
  image: "",
  title: "",
  stat: "",
  category: "",
  link: "",
  linkText: "",
  displayLocation: "both",
  cardType: "other",
  priority: 0,
  postToDiscord: true,
};

interface AdminHighlightsProps {
  embedded?: boolean;
}

interface HighlightCard {
  id: number;
  image: string;
  title: string;
  stat: string | null;
  category: string | null;
  link: string | null;
  linkText: string | null;
  displayLocation: string;
  cardType: string;
  priority: number;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
}

// Sortable Card Component
function SortableCard({ 
  card, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onPostToDiscord,
  onDeleteFromDiscord,
  isPostingToDiscord,
  isDeletingFromDiscord,
  getLocationBadgeColor,
  getTypeBadgeColor,
}: { 
  card: HighlightCard;
  onEdit: (card: HighlightCard) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, currentActive: number) => void;
  onPostToDiscord: (card: HighlightCard) => void;
  onDeleteFromDiscord: (card: HighlightCard) => void;
  isPostingToDiscord: boolean;
  isDeletingFromDiscord: boolean;
  getLocationBadgeColor: (location: string) => string;
  getTypeBadgeColor: (type: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`${card.isActive === 0 ? 'opacity-50' : ''} ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-muted">
              <img 
                src={card.image} 
                alt={card.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/128x80/1f2937/fbbf24?text=No+Image";
                }}
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg truncate">{card.title}</h3>
                  {card.stat && (
                    <p className="text-sm text-muted-foreground">{card.stat}</p>
                  )}
                  {card.category && (
                    <p className="text-xs text-muted-foreground mt-1">{card.category}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded border ${getLocationBadgeColor(card.displayLocation)}`}>
                    {card.displayLocation}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded border ${getTypeBadgeColor(card.cardType)}`}>
                    {card.cardType}
                  </span>
                </div>
              </div>
              
              {card.link && (
                <p className="text-xs text-blue-400 mt-2 truncate">
                  Links to: {card.link}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Discord Actions */}
              {card.link && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPostToDiscord(card)}
                    disabled={isPostingToDiscord}
                    title="Post to Discord"
                    className="text-[#5865F2] hover:text-[#4752C4] hover:bg-[#5865F2]/10"
                  >
                    {isPostingToDiscord ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5865F2] border-t-transparent" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteFromDiscord(card)}
                    disabled={isDeletingFromDiscord}
                    title="Delete from Discord"
                    className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                  >
                    {isDeletingFromDiscord ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="currentColor"/>
                        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleActive(card.id, card.isActive)}
                title={card.isActive ? "Hide card" : "Show card"}
              >
                {card.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(card)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(card.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// CSV Upload Dialog Component
// Required columns for CSV processing
const REQUIRED_COLUMNS = [
  'Type', 'GameNumber', 'Player', 'Team', 'PTS', 'REB', 'AST',
  'HomeTeam', 'AwayTeam', 'HomeScore', 'AwayScore', 'WinningTeam',
  'Round', 'MVPPlayer', 'MVPTeam'
];

function CSVUploadDialog() {
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvContent, setCSVContent] = useState('');
  const [playerHeadshotUrl, setPlayerHeadshotUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const utils = trpc.useUtils();
  
  const processCSVMutation = trpc.highlights.processCSV.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.highlights.getAllCards.invalidate();
      toast.success('CSV processed successfully! Card and summary page created.');
    },
    onError: (error) => {
      toast.error(`CSV processing failed: ${error.message}`);
    },
  });
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoadingPreview(true);
    setCSVFile(file);
    
    // Check if file is Excel
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    let content: string;
    if (isExcel) {
      // Read Excel as ArrayBuffer and convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      content = btoa(binary);
      console.log('[CSV Upload] Excel file read as base64, length:', content.length);
    } else {
      // Read CSV as text
      content = await file.text();
      console.log('[CSV Upload] CSV file read as text, length:', content.length);
    }
    
    setCSVContent(content);
    
    // Parse and preview data
    try {
      if (isExcel) {
        // Skip preview for Excel files - backend will handle parsing
        setPreviewData({
          headers: ['File'],
          rows: [{ 'File': file.name }],
          totalRows: 1,
        });
        setEditedData([{ 'File': file.name }]);
        setValidationIssues([]);
        console.log('[CSV Upload] Excel file loaded, skipping preview (backend will parse)');
      } else {
        // Simple CSV preview parsing (first few rows)
        const lines = content.split('\n').filter(l => l.trim());
        const headers = lines[0]?.split(',') || [];
        const rows = lines.slice(1, 6).map((line: string) => {
          const values = line.split(',');
          return headers.reduce((obj: any, header: string, i: number) => {
            obj[header] = values[i] || '';
            return obj;
          }, {});
        });
        
        // Validate columns
        const issues: string[] = [];
        const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          issues.push(`Missing required columns: ${missingColumns.join(', ')}`);
        }
        
        setValidationIssues(issues);
        setPreviewData({
          headers,
          rows,
          totalRows: lines.length - 1,
        });
        setEditedData(rows);
      }
    } catch (error) {
      console.error('[CSV Upload] Preview parsing failed:', error);
      toast.error('Failed to parse file for preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  const handleSubmit = () => {
    if (!csvContent || !csvFile) {
      toast.error('Please select a file');
      return;
    }
    
    // If data was edited, reconstruct CSV from edited data
    let finalCSVContent = csvContent;
    if (editedData && previewData) {
      // Check if any edits were made
      const hasEdits = editedData.some((row: any, i: number) => 
        previewData.headers.some((h: string) => row[h] !== previewData.rows[i][h])
      );
      
      if (hasEdits) {
        // Reconstruct CSV with edited data
        const lines = csvContent.split('\n');
        const headers = previewData.headers;
        
        // Replace edited rows (first 5 rows)
        editedData.forEach((row: any, i: number) => {
          const values = headers.map((h: string) => row[h] || '');
          lines[i + 1] = values.join(',');
        });
        
        finalCSVContent = lines.join('\n');
        console.log('[CSV Upload] Using edited data for processing');
      }
    }
    
    processCSVMutation.mutate({
      csvContent: finalCSVContent,
      filename: csvFile.name,
      playerHeadshotUrl: playerHeadshotUrl || undefined,
    });
  };
  
  const handleReset = () => {
    setCSVFile(null);
    setCSVContent('');
    setPlayerHeadshotUrl('');
    setResult(null);
    setPreviewData(null);
    setEditedData(null);
    setValidationIssues([]);
    setIsLoadingPreview(false);
  };
  
  const handleCellEdit = (rowIndex: number, header: string, value: string) => {
    if (!editedData) return;
    const newData = [...editedData];
    newData[rowIndex] = { ...newData[rowIndex], [header]: value };
    setEditedData(newData);
  };
  
  const handleResetEdits = () => {
    if (!previewData) return;
    setEditedData(previewData.rows.map((row: any) => ({ ...row })));
    toast.success('Edits reset to original data');
  };
  
  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Upload Series CSV</DialogTitle>
      </DialogHeader>
      
      {!result ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="csvFile">Series Data File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              disabled={processCSVMutation.isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload CSV or Excel file (.csv, .xls, .xlsx) with game box scores, summaries, and series data
            </p>
          </div>
          
          {csvFile && (
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">Selected: {csvFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(csvFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {isLoadingPreview && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading preview...
                  </div>
                )}
              </div>
              
              {previewData && !isLoadingPreview && (
                <div className="mt-3 border-t border-border pt-3">
                  {validationIssues.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-yellow-400 mb-1">⚠️ Validation Warnings</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {validationIssues.map((issue, i) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">
                        You can still proceed, but some features may not work correctly.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium">Data Preview ({previewData.totalRows} rows total)</p>
                    <button
                      onClick={handleResetEdits}
                      className="text-xs text-primary hover:underline"
                    >
                      Reset Edits
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Click any cell to edit. Changes will be used when generating the card.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          {previewData.headers.slice(0, 6).map((header: string, i: number) => {
                            const isMissing = REQUIRED_COLUMNS.includes(header) === false && validationIssues.length > 0;
                            return (
                              <th key={i} className={`text-left p-1 font-medium ${isMissing ? 'text-yellow-400' : ''}`}>
                                {header}
                              </th>
                            );
                          })}
                          {previewData.headers.length > 6 && (
                            <th className="text-left p-1 font-medium">...</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {editedData && editedData.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            {previewData.headers.slice(0, 6).map((header: string, j: number) => {
                              const originalValue = previewData.rows[i][header];
                              const currentValue = row[header];
                              const isEdited = originalValue !== currentValue;
                              return (
                                <td key={j} className="p-0">
                                  <input
                                    type="text"
                                    value={currentValue || ''}
                                    onChange={(e) => handleCellEdit(i, header, e.target.value)}
                                    className={`w-full p-1 bg-transparent border-none focus:outline-none focus:bg-accent/20 ${
                                      isEdited ? 'bg-yellow-500/20' : ''
                                    }`}
                                  />
                                </td>
                              );
                            })}
                            {previewData.headers.length > 6 && (
                              <td className="p-1">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Showing first 5 rows of {previewData.totalRows}
                    </p>
                    {editedData && editedData.some((row: any, i: number) => 
                      previewData.headers.some((h: string) => row[h] !== previewData.rows[i][h])
                    ) && (
                      <p className="text-xs text-yellow-400">
                        ✏️ You have unsaved edits
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div>
            <Label htmlFor="playerHeadshotUrl">Player Headshot URL (optional)</Label>
            <Input
              id="playerHeadshotUrl"
              value={playerHeadshotUrl}
              onChange={(e) => setPlayerHeadshotUrl(e.target.value)}
              placeholder="https://cdn.nba.com/headshots/nba/latest/1040x760/1234567.png"
              disabled={processCSVMutation.isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: NBA.com headshot URL for series MVP
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!csvFile || processCSVMutation.isPending}
              className="flex-1"
            >
              {processCSVMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : previewData ? (
                'Confirm & Generate Card'
              ) : (
                'Upload File'
              )}
            </Button>
          </div>
          
          {processCSVMutation.isPending && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                <p className="text-sm font-medium text-blue-400">Processing your file...</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Parsing file data</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Calculating series statistics</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  <span className="text-blue-400">Generating highlight card with official logos</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground">○</span>
                  <span>Creating summary page component</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground">○</span>
                  <span>Saving to database</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                This may take 30-60 seconds...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h3 className="text-lg font-bold text-green-400 mb-2">✓ CSV Processed Successfully!</h3>
            
            <div className="space-y-3 mt-4">
              <div>
                <p className="text-sm font-medium mb-1">Highlight Card Created:</p>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-sm font-medium">{result.card.title}</p>
                  <p className="text-xs text-muted-foreground">{result.card.stat}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    File size: {(result.card.fileSize / 1024).toFixed(1)} KB
                  </p>
                  <a 
                    href={result.card.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View Card →
                  </a>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Summary Page Created:</p>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-sm font-medium">{result.summaryPage.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Route: {result.summaryPage.route}
                  </p>
                  <Link href={result.summaryPage.route}>
                    <a className="text-xs text-primary hover:underline">
                      View Page →
                    </a>
                  </Link>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Database:</p>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    Card added with priority {result.priority} (highest)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <Button onClick={handleReset} variant="outline" className="w-full">
            Upload Another CSV
          </Button>
        </div>
      )}
    </DialogContent>
  );
}

// Card Form Component
function CardForm({ 
  form, 
  setForm, 
  onSubmit, 
  isLoading, 
  submitText 
}: { 
  form: HighlightCardForm;
  setForm: React.Dispatch<React.SetStateAction<HighlightCardForm>>;
  onSubmit: () => void;
  isLoading: boolean;
  submitText: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="image">Image Path</Label>
          <Input
            id="image"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            placeholder="/highlight-card.png"
          />
        </div>
        
        <div className="col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="MVP - Brandon Ingram"
          />
        </div>
        
        <div>
          <Label htmlFor="stat">Stat (optional)</Label>
          <Input
            id="stat"
            value={form.stat}
            onChange={(e) => setForm({ ...form, stat: e.target.value })}
            placeholder="38.8 PPG"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category (optional)</Label>
          <Input
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Season 17 Awards"
          />
        </div>
        
        <div>
          <Label htmlFor="link">Link (optional)</Label>
          <Input
            id="link"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="/awards"
          />
        </div>
        
        <div>
          <Label htmlFor="linkText">Link Text (optional)</Label>
          <Input
            id="linkText"
            value={form.linkText}
            onChange={(e) => setForm({ ...form, linkText: e.target.value })}
            placeholder="View Award Details"
          />
        </div>
        
        <div>
          <Label htmlFor="displayLocation">Display Location</Label>
          <Select
            value={form.displayLocation}
            onValueChange={(value: DisplayLocation) => setForm({ ...form, displayLocation: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="homepage">Homepage Only</SelectItem>
              <SelectItem value="highlights">Highlights Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="cardType">Card Type</Label>
          <Select
            value={form.cardType}
            onValueChange={(value: CardType) => setForm({ ...form, cardType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="playoff">Playoff</SelectItem>
              <SelectItem value="award">Award</SelectItem>
              <SelectItem value="stat_leader">Stat Leader</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Post to Discord Toggle */}
        <div className="col-span-2 flex items-center justify-between p-4 bg-[#5865F2]/10 rounded-lg border border-[#5865F2]/30">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <div>
              <Label htmlFor="postToDiscord" className="text-sm font-medium">Post to Discord</Label>
              <p className="text-xs text-muted-foreground">Share this highlight to the HoFBA Discord channel</p>
            </div>
          </div>
          <Switch
            id="postToDiscord"
            checked={form.postToDiscord}
            onCheckedChange={(checked) => setForm({ ...form, postToDiscord: checked })}
          />
        </div>
      </div>
      
      <Button onClick={onSubmit} disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : submitText}
      </Button>
    </div>
  );
}

export default function AdminHighlights({ embedded = false }: AdminHighlightsProps) {
  const { user, loading: authLoading } = useAuth();
  const [editingCard, setEditingCard] = useState<HighlightCard | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<HighlightCardForm>(defaultForm);
  
  const utils = trpc.useUtils();
  
  const { data: cards, isLoading } = trpc.highlights.getAllCards.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });
  
  const createMutation = trpc.highlights.create.useMutation({
    onSuccess: (data) => {
      utils.highlights.getAllCards.invalidate();
      setIsCreateOpen(false);
      setForm(defaultForm);
      
      // Show appropriate success message based on Discord post status
      if (data.postedToDiscord) {
        toast.success("Highlight card created and posted to Discord! 🎉");
      } else {
        toast.success("Highlight card created");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = trpc.highlights.update.useMutation({
    onSuccess: () => {
      utils.highlights.getAllCards.invalidate();
      setEditingCard(null);
      toast.success("Highlight card updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = trpc.highlights.delete.useMutation({
    onSuccess: () => {
      utils.highlights.getAllCards.invalidate();
      toast.success("Highlight card deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const toggleActiveMutation = trpc.highlights.toggleActive.useMutation({
    onSuccess: () => {
      utils.highlights.getAllCards.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Track which card is being posted/deleted from Discord
  const [postingToDiscordId, setPostingToDiscordId] = useState<number | null>(null);
  const [deletingFromDiscordId, setDeletingFromDiscordId] = useState<number | null>(null);
  
  const postToDiscordMutation = trpc.highlights.postToDiscord.useMutation({
    onSuccess: (data) => {
      setPostingToDiscordId(null);
      if (data.success) {
        toast.success("Posted to Discord! 🎉");
      } else {
        toast.error(data.error || "Failed to post to Discord");
      }
    },
    onError: (error) => {
      setPostingToDiscordId(null);
      toast.error(error.message);
    },
  });
  
  const deleteFromDiscordMutation = trpc.highlights.deleteFromDiscord.useMutation({
    onSuccess: (data) => {
      setDeletingFromDiscordId(null);
      if (data.success) {
        toast.success("Deleted from Discord");
      } else {
        toast.error("Failed to delete from Discord");
      }
    },
    onError: (error) => {
      setDeletingFromDiscordId(null);
      toast.error(error.message);
    },
  });
  
  const bulkUpdatePrioritiesMutation = trpc.highlights.bulkUpdatePriorities.useMutation({
    onSuccess: () => {
      utils.highlights.getAllCards.invalidate();
      toast.success("Order updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user && !embedded) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, user, embedded]);

  if (authLoading || isLoading) {
    return (
      <div className={embedded ? "flex items-center justify-center py-8" : "min-h-screen bg-background flex items-center justify-center"}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not logged in and not embedded, show loading while redirecting
  if (!user && !embedded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className={embedded ? "py-8" : "min-h-screen bg-background flex items-center justify-center"}>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Only the site owner can access this page.
            </p>
            <Link href="/">
              <Button className="w-full mt-4">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleCreate = () => {
    // Set priority to be highest (will appear first)
    const maxPriority = cards?.reduce((max, c) => Math.max(max, c.priority), 0) || 0;
    createMutation.mutate({
      ...form,
      priority: maxPriority + 10,
      isActive: 1,
      postToDiscord: form.postToDiscord,
    });
  };
  
  const handleUpdate = () => {
    if (!editingCard) return;
    updateMutation.mutate({
      id: editingCard.id,
      ...form,
    });
  };
  
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this highlight card?")) {
      deleteMutation.mutate({ id });
    }
  };
  
  const handleToggleActive = (id: number, currentActive: number) => {
    toggleActiveMutation.mutate({ id, isActive: currentActive === 0 });
  };
  
  const startEdit = (card: HighlightCard) => {
    setForm({
      image: card.image,
      title: card.title,
      stat: card.stat || "",
      category: card.category || "",
      link: card.link || "",
      linkText: card.linkText || "",
      displayLocation: card.displayLocation as DisplayLocation,
      cardType: card.cardType as CardType,
      priority: card.priority,
      postToDiscord: false, // Don't post to Discord when editing existing cards
    });
    setEditingCard(card);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !cards) return;
    
    // Sort cards by priority descending (highest first)
    const sortedCards = [...cards].sort((a, b) => b.priority - a.priority);
    const oldIndex = sortedCards.findIndex((c) => c.id === active.id);
    const newIndex = sortedCards.findIndex((c) => c.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Reorder the array
    const reorderedCards = arrayMove(sortedCards, oldIndex, newIndex);
    
    // Assign new priorities based on position (higher index = lower priority)
    const updates = reorderedCards.map((card, index) => ({
      id: card.id,
      priority: (reorderedCards.length - index) * 10, // Highest priority for first item
    }));
    
    bulkUpdatePrioritiesMutation.mutate(updates);
  };
  
  const getLocationBadgeColor = (location: string) => {
    switch (location) {
      case 'homepage': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'highlights': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'both': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };
  
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'playoff': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'award': return 'bg-gold-500/20 text-gold-400 border-gold-500/50';
      case 'stat_leader': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };
  
  // Sort cards by priority descending for display
  const sortedCards = cards ? [...cards].sort((a, b) => b.priority - a.priority) : [];

  const content = (
    <>
      {/* Header - only show if not embedded */}
      {!embedded && (
        <header className="border-b border-border bg-card">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold">Highlight Cards Manager</h1>
                  <p className="text-sm text-muted-foreground">
                    Drag cards to reorder. Changes save automatically.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setForm(defaultForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Highlight Card</DialogTitle>
                    </DialogHeader>
                    <CardForm 
                      form={form} 
                      setForm={setForm} 
                      onSubmit={handleCreate}
                      isLoading={createMutation.isPending}
                      submitText="Create Card"
                    />
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload CSV
                    </Button>
                  </DialogTrigger>
                  <CSVUploadDialog />
                </Dialog>
              </div>

            </div>
          </div>
        </header>
      )}
      
      {/* Embedded header */}
      {embedded && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Drag cards to reorder. Changes save automatically.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm(defaultForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Highlight Card</DialogTitle>
                </DialogHeader>
                <CardForm 
                  form={form} 
                  setForm={setForm} 
                  onSubmit={handleCreate}
                  isLoading={createMutation.isPending}
                  submitText="Create Card"
                />
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload CSV
                </Button>
              </DialogTrigger>
              <CSVUploadDialog />
            </Dialog>
          </div>
        </div>
      )}
      
      {/* Cards List with Drag and Drop */}
      <div className={embedded ? "" : "container py-8"}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedCards.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sortedCards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onPostToDiscord={(c) => {
                    setPostingToDiscordId(c.id);
                    postToDiscordMutation.mutate({
                      id: c.id,
                      title: c.title,
                      image: c.image,
                      link: c.link || undefined,
                      stat: c.stat || undefined,
                    });
                  }}
                  onDeleteFromDiscord={(c) => {
                    setDeletingFromDiscordId(c.id);
                    deleteFromDiscordMutation.mutate({
                      id: c.id,
                      link: c.link || '',
                    });
                  }}
                  isPostingToDiscord={postingToDiscordId === card.id}
                  isDeletingFromDiscord={deletingFromDiscordId === card.id}
                  getLocationBadgeColor={getLocationBadgeColor}
                  getTypeBadgeColor={getTypeBadgeColor}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {sortedCards.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No highlight cards yet. Click "Add Card" to create one.</p>
          </div>
        )}
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Highlight Card</DialogTitle>
          </DialogHeader>
          <CardForm 
            form={form} 
            setForm={setForm} 
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            submitText="Save Changes"
          />
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {content}
    </div>
  );
}
