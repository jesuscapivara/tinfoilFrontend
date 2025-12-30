import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  Play,
  Pause,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadTorrentFile,
  getActiveDownloads,
  cancelDownload,
  DuplicateGameError,
} from "@/lib/api";
import { toast } from "sonner";

export default function DownloadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [duplicateCountdowns, setDuplicateCountdowns] = useState<
    Record<string, number>
  >({});
  const queryClient = useQueryClient();

  // Mutation para upload (definida primeiro para garantir disponibilidade)
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");

      return uploadTorrentFile(file, token);
    },
    onSuccess: () => {
      toast.success("Torrent enviado com sucesso!");
      setFileInput(null);
      queryClient.invalidateQueries({ queryKey: ["active-downloads"] });
    },
    onError: (error: Error) => {
      // TRATAMENTO DIFERENCIADO: Duplicata vs Erro Genérico
      if (error instanceof DuplicateGameError) {
        toast.warning("Arquivo Duplicado", {
          description: error.message,
          duration: 5000,
        });
        // NÃO limpa o input, permite que o usuário veja que deu errado
      } else {
        // Erro genérico (Rede, 500, Auth)
        toast.error("Falha no Upload", {
          description: error.message || "Erro desconhecido",
        });
        setFileInput(null); // Limpa apenas em caso de erro genérico
      }
    },
  });

  // Mutation para cancelar download
  const cancelMutation = useMutation({
    mutationFn: async (downloadId: string) => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      return cancelDownload(downloadId, token);
    },
    onSuccess: () => {
      toast.success("Download cancelado");
      queryClient.invalidateQueries({ queryKey: ["active-downloads"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar download: ${error.message}`);
    },
  });

  // Busca downloads ativos
  const {
    data: downloads = { active: [], queue: [] },
    isLoading: downloadsLoading,
  } = useQuery({
    queryKey: ["active-downloads"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      return getActiveDownloads(token);
    },
    enabled: !!user,
    refetchInterval: 3000, // Atualiza a cada 3 segundos
  });

  // Gerencia countdowns para duplicatas
  useEffect(() => {
    if (!downloads?.active) return;

    downloads.active.forEach((download: any) => {
      const isError = download.phase === "error";
      const isDuplicate = isError && download.error?.includes("Duplicado");

      if (isDuplicate && !duplicateCountdowns[download.id]) {
        // Inicia countdown de 10 segundos
        setDuplicateCountdowns(prev => ({
          ...prev,
          [download.id]: 10,
        }));
      } else if (!isDuplicate && duplicateCountdowns[download.id]) {
        // Remove countdown se não for mais duplicata
        setDuplicateCountdowns(prev => {
          const newCountdowns = { ...prev };
          delete newCountdowns[download.id];
          return newCountdowns;
        });
      }
    });
  }, [downloads?.active, duplicateCountdowns]);

  // Atualiza countdowns a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setDuplicateCountdowns(prev => {
        const updated: Record<string, number> = {};
        const expiredIds: string[] = [];

        Object.entries(prev).forEach(([id, count]) => {
          if (count > 1) {
            updated[id] = count - 1;
          } else {
            // Countdown chegou a zero, marca para remover
            expiredIds.push(id);
          }
        });

        // Se houver countdowns expirados, força atualização da lista
        if (expiredIds.length > 0) {
          // Força atualização da query para que o backend remova o item
          queryClient.invalidateQueries({ queryKey: ["active-downloads"] });
        }

        // Retorna apenas os countdowns que ainda não expiraram
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".torrent")) {
      setFileInput(file);
    } else {
      toast.error("Por favor, selecione um arquivo .torrent válido");
    }
  };

  const handleUpload = async () => {
    if (!fileInput) return;
    uploadMutation.mutate(fileInput);
  };

  const handleCancel = (downloadId: string) => {
    if (confirm("Tem certeza que deseja cancelar este download?")) {
      cancelMutation.mutate(downloadId);
    }
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

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <div className="border-b-2 border-primary bg-card/80 backdrop-blur">
        <div className="container py-8">
          <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
            Download Manager
          </h1>
          <p className="text-secondary text-sm mt-2 font-mono">
            Manage torrent downloads and queue
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Active Downloads - MOVED TO TOP */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-3">
            <span className="text-secondary">▸</span>
            Active Downloads
            <span className="text-secondary">◂</span>
          </h2>

          {downloadsLoading ? (
            <Card className="cyber-card text-center py-12">
              <div className="text-primary text-xl font-bold animate-pulse">
                ▲ LOADING ▼
              </div>
            </Card>
          ) : downloads?.active && downloads.active.length > 0 ? (
            <div className="space-y-4">
              {downloads.active.map((download: any) => {
                // Determina se deve mostrar estatísticas ou mensagens de status
                const showStats =
                  download.phase === "downloading" ||
                  download.phase === "uploading";
                const isChecking = download.phase === "checking";
                const isConnecting = download.phase === "connecting";
                const isError = download.phase === "error";
                const isDuplicate =
                  isError && download.error?.includes("Duplicado");

                return (
                  <Card key={download.id} className="cyber-card">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground">
                            {download.name}
                          </h3>
                          <p className="text-xs text-secondary mt-2 font-mono">
                            {isChecking && "🔍 CHECANDO DUPLICIDADE..."}
                            {isConnecting && "📡 CONECTANDO AOS PARES..."}
                            {download.phase === "downloading" &&
                              "⬇ DOWNLOADING"}
                            {download.phase === "uploading" && "⬆ UPLOADING"}
                            {download.phase === "queued" && "⏳ QUEUED"}
                            {download.phase === "paused" && "⏸ PAUSED"}
                            {isError && !isDuplicate && "❌ ERRO"}
                            {isDuplicate && "⚠️ DUPLICATA DETECTADA"}
                          </p>
                        </div>
                        {showStats && (
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary">
                              {download.download?.percent?.toFixed(0) || 0}%
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status Messages (antes das estatísticas) */}
                      {isChecking && (
                        <div className="bg-primary/10 border border-primary/50 p-6 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            <p className="text-primary font-bold text-lg">
                              Verificando duplicidade...
                            </p>
                          </div>
                          <p className="text-secondary text-sm font-mono">
                            Analisando arquivos do torrent
                          </p>
                        </div>
                      )}

                      {isConnecting && (
                        <div className="bg-primary/10 border border-primary/50 p-6 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            <p className="text-primary font-bold text-lg">
                              Conectando aos pares...
                            </p>
                          </div>
                          <p className="text-secondary text-sm font-mono">
                            Aguardando conexão com outros usuários
                          </p>
                        </div>
                      )}

                      {isDuplicate && (
                        <div className="bg-destructive/10 border border-destructive/50 p-6 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <p className="text-destructive font-bold text-lg">
                              Duplicata Detectada
                            </p>
                          </div>
                          <p className="text-secondary text-sm font-mono mb-2">
                            {download.error?.replace("Duplicado! ", "") ||
                              "Este jogo já existe no sistema"}
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-4">
                            <div className="relative w-16 h-16">
                              <div className="absolute inset-0 rounded-full border-4 border-destructive/20" />
                              <div
                                className="absolute inset-0 rounded-full border-4 border-transparent border-t-destructive transition-transform duration-1000 ease-linear"
                                style={{
                                  transform: `rotate(${
                                    360 -
                                    (duplicateCountdowns[download.id] || 0) * 36
                                  }deg)`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-destructive">
                                  {duplicateCountdowns[download.id] || 0}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-secondary opacity-70">
                              Removendo em{" "}
                              {duplicateCountdowns[download.id] || 0} segundo
                              {(duplicateCountdowns[download.id] || 0) !== 1
                                ? "s"
                                : ""}
                              ...
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar - Só mostra se estiver baixando */}
                      {showStats && (
                        <div className="w-full h-2 bg-primary/20 border border-primary/50">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{
                              width: `${download.download?.percent || 0}%`,
                            }}
                          />
                        </div>
                      )}

                      {/* Details Grid - Só mostra se estiver baixando */}
                      {showStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="border border-primary/30 p-3 bg-input/50">
                            <p className="text-secondary font-bold">
                              Downloaded
                            </p>
                            <p className="text-foreground font-mono mt-1">
                              {download.download?.downloaded || "0 MB"}
                            </p>
                          </div>
                          <div className="border border-primary/30 p-3 bg-input/50">
                            <p className="text-secondary font-bold">Speed</p>
                            <p className="text-foreground font-mono mt-1">
                              {download.download?.speed || "-- MB/s"}
                            </p>
                          </div>
                          <div className="border border-primary/30 p-3 bg-input/50">
                            <p className="text-secondary font-bold">ETA</p>
                            <p className="text-foreground font-mono mt-1">
                              {download.download?.eta || "--:--"}
                            </p>
                          </div>
                          <div className="border border-primary/30 p-3 bg-input/50">
                            <p className="text-secondary font-bold">Peers</p>
                            <p className="text-foreground font-mono mt-1">
                              {download.download?.peers || 0}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Controls - Só mostra se não for duplicata */}
                      {!isDuplicate && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 text-xs border-2 border-destructive"
                            onClick={() => handleCancel(download.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-2" /> CANCEL
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
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
                      <span className="text-secondary font-bold text-lg w-8 text-center">
                        #{index + 1}
                      </span>
                      <span className="text-foreground font-mono flex-1 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs text-secondary font-bold">
                      ⏳ QUEUED
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Upload Section - MOVED TO BOTTOM */}
        <Card className="cyber-card mt-12">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider mb-6">
            Upload Torrent
          </h2>

          <div className="space-y-4">
            <div
              className={`border-2 border-dashed p-8 text-center transition-colors bg-input/30 ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-primary/60 hover:border-primary"
              }`}
              onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const file = files[0];
                  if (file.name.endsWith(".torrent")) {
                    setFileInput(file);
                    toast.success(`Arquivo "${file.name}" selecionado`);
                  } else {
                    toast.error(
                      "Por favor, selecione um arquivo .torrent válido"
                    );
                  }
                }
              }}
            >
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
                  {fileInput
                    ? `✓ ${fileInput.name}`
                    : "Click to select .torrent file"}
                </p>
                <p className="text-xs text-secondary">or drag and drop</p>
              </label>
            </div>

            <Button
              className="cyber-btn w-full"
              onClick={handleUpload}
              disabled={!fileInput || uploadMutation.isPending}
            >
              {uploadMutation.isPending
                ? "⟳ UPLOADING..."
                : "▶ QUEUE DOWNLOAD"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
