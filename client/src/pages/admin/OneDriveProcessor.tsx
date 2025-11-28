import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle, XCircle, FileText, Download } from "lucide-react";
import { toast } from "sonner";

interface ProcessLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
}

interface ProcessStatus {
  isProcessing: boolean;
  currentBatch: number;
  totalPhotos: number;
  processedPhotos: number;
  status: string;
}

export default function OneDriveProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessStatus | null>(null);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [csvUrl, setCsvUrl] = useState<string | null>(null);

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    const log: ProcessLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setLogs((prev) => [log, ...prev]);
  };

  const startProcessing = async () => {
    try {
      setIsProcessing(true);
      setCsvUrl(null);
      addLog("Starting OneDrive photo processing...", "info");

      const response = await fetch("/api/onedrive/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start processing");
      }

      const result = await response.json();
      
      if (result.success) {
        addLog(`Processing completed! Processed ${result.totalPhotos} photos in ${result.batches} batches`, "success");
        
        if (result.csvUrl) {
          setCsvUrl(result.csvUrl);
          addLog("CSV file generated and sent to Discord", "success");
        }
        
        toast.success("Processing completed successfully!");
      } else {
        throw new Error(result.message || "Processing failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      addLog(`Error: ${errorMessage}`, "error");
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessStatus(null);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/onedrive/status");
      if (response.ok) {
        const status = await response.json();
        setProcessStatus(status);
      }
    } catch (error) {
      console.error("Failed to check status:", error);
    }
  };

  // Poll for status updates while processing
  useState(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(checkStatus, 2000);
    }
    return () => clearInterval(interval);
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">OneDrive Photo Processor</h1>
        <p className="text-muted-foreground mt-2">
          Automatically process photos from OneDrive, upload to ChatGPT, and extract player data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Configuration</CardTitle>
          <CardDescription>
            Photos will be downloaded from OneDrive, uploaded to ChatGPT in batches of 10,
            and deleted after successful processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">OneDrive Folder:</span>
              <p className="text-muted-foreground">Captures</p>
            </div>
            <div>
              <span className="font-medium">Batch Size:</span>
              <p className="text-muted-foreground">10 photos per upload</p>
            </div>
            <div>
              <span className="font-medium">ChatGPT Chat:</span>
              <p className="text-muted-foreground">Shared chat (auto-login)</p>
            </div>
            <div>
              <span className="font-medium">Discord Channel:</span>
              <p className="text-muted-foreground">1443741234106470493</p>
            </div>
          </div>

          {processStatus && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status: {processStatus.status}</span>
                    <span className="text-sm text-muted-foreground">
                      Batch {processStatus.currentBatch}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(processStatus.processedPhotos / processStatus.totalPhotos) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {processStatus.processedPhotos} / {processStatus.totalPhotos} photos processed
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              onClick={startProcessing}
              disabled={isProcessing}
              size="lg"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Processing
                </>
              )}
            </Button>

            {csvUrl && (
              <Button
                variant="outline"
                size="lg"
                asChild
              >
                <a href={csvUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Processing Logs
          </CardTitle>
          <CardDescription>Real-time updates from the automation process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No logs yet. Start processing to see activity.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm"
                >
                  {log.type === "success" && (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  {log.type === "error" && (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  {log.type === "info" && (
                    <Loader2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="text-muted-foreground text-xs">{log.timestamp}</span>
                    <p className="mt-1">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
