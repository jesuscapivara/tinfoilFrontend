import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Play, Pause, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function DownloadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [downloads, setDownloads] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".torrent")) {
      setFileInput(file);
    } else {
      alert("Please select a valid .torrent file");
    }
  };

  const handleUpload = async () => {
    if (!fileInput) return;
    
    // TODO: Implementar upload via backend
    alert("Upload functionality will be implemented via backend API");
    setFileInput(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-bold animate-pulse">
          ▲ INITIALIZING SYSTEM ▼
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona (ProtectedRoute vai cuidar disso)
  if (!user) {
    return null;
  }

  // Downloads é apenas para admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-2xl font-bold">ACCESS DENIED</div>
        <p className="text-secondary mt-4">Only administrators can access downloads</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <div className="border-b-2 border-primary bg-card/80 backdrop-blur">
        <div className="container py-8">
          <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
            Download Manager
          </h1>
          <p className="text-secondary text-sm mt-2 font-mono">Manage torrent downloads and queue</p>
        </div>
      </div>

      <div className="container py-12">
        {/* Upload Section */}
        <Card className="cyber-card mb-12">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider mb-6">
            Upload Torrent
          </h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-primary/60 p-8 text-center hover:border-primary transition-colors bg-input/30">
              <Upload className="w-16 h-16 text-secondary mx-auto mb-4 opacity-60" />
              <input
                type="file"
                accept=".torrent"
                onChange={handleFileChange}
                className="hidden"
                id="torrent-input"
              />
              <label htmlFor="torrent-input" className="cursor-pointer block">
                <p className="text-foreground font-bold mb-2">
                  {fileInput ? `✓ ${fileInput.name}` : "Click to select .torrent file"}
                </p>
                <p className="text-xs text-secondary">or drag and drop</p>
              </label>
            </div>

            <Button
              className="cyber-btn w-full"
              onClick={handleUpload}
              disabled={!fileInput || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "⟳ UPLOADING..." : "▶ QUEUE DOWNLOAD"}
            </Button>
          </div>
        </Card>

        {/* Active Downloads */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-3">
            <span className="text-secondary">▸</span>
            Active Downloads
            <span className="text-secondary">◂</span>
          </h2>

          {downloads?.active && downloads.active.length > 0 ? (
            <div className="space-y-4">
              {downloads.active.map((download: any) => (
                <Card key={download.id} className="cyber-card">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground">{download.name}</h3>
                        <p className="text-xs text-secondary mt-2 font-mono">
                          {download.phase === "downloading" && "⬇ DOWNLOADING"}
                          {download.phase === "uploading" && "⬆ UPLOADING"}
                          {download.phase === "queued" && "⏳ QUEUED"}
                          {download.phase === "paused" && "⏸ PAUSED"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {download.downloadPercent.toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="cyber-progress">
                      <div
                        className="cyber-progress-bar"
                        style={{ width: `${download.downloadPercent}%` }}
                      />
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="border border-primary/30 p-3 bg-input/50">
                        <p className="text-secondary font-bold">Downloaded</p>
                        <p className="text-foreground font-mono mt-1">{download.downloaded || "0 MB"}</p>
                      </div>
                      <div className="border border-primary/30 p-3 bg-input/50">
                        <p className="text-secondary font-bold">Speed</p>
                        <p className="text-foreground font-mono mt-1">{download.downloadSpeed || "-- MB/s"}</p>
                      </div>
                      <div className="border border-primary/30 p-3 bg-input/50">
                        <p className="text-secondary font-bold">ETA</p>
                        <p className="text-foreground font-mono mt-1">{download.downloadEta || "--:--"}</p>
                      </div>
                      <div className="border border-primary/30 p-3 bg-input/50">
                        <p className="text-secondary font-bold">Peers</p>
                        <p className="text-foreground font-mono mt-1">{download.peers || 0}</p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="cyber-btn flex-1 text-xs">
                        <Play className="w-4 h-4 mr-2" /> RESUME
                      </Button>
                      <Button size="sm" className="cyber-btn flex-1 text-xs">
                        <Pause className="w-4 h-4 mr-2" /> PAUSE
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1 text-xs border-2 border-destructive">
                        <X className="w-4 h-4 mr-2" /> CANCEL
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="cyber-card text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-secondary mx-auto mb-3 opacity-50" />
              <p className="text-secondary">No active downloads</p>
            </Card>
          )}
        </div>

        {/* Queue */}
        {downloads?.queue && downloads.queue.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-3">
              <span className="text-secondary">▸</span>
              Download Queue
              <span className="text-secondary">◂</span>
            </h2>

            <Card className="cyber-card">
              <div className="space-y-2">
                {downloads.queue.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-primary/50 bg-input hover:bg-input/80 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-secondary font-bold text-lg w-8 text-center">#{index + 1}</span>
                      <span className="text-foreground font-mono flex-1 truncate">{item.name}</span>
                    </div>
                    <span className="text-xs text-secondary font-bold">⏳ QUEUED</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
