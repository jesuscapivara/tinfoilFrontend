import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchGames, downloadFromSearch, SearchGame } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Download,
  Loader2,
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Server,
} from "lucide-react";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Termo de busca ativo (só atualiza ao clicar em buscar)
  const queryClient = useQueryClient();

  // ✅ Estado de Processamento (Focus Mode)
  const [processingGame, setProcessingGame] = useState<SearchGame | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Busca jogos - só executa quando searchQuery é definido (após clicar em buscar)
  const {
    data: games = [],
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["search-games", searchQuery],
    queryFn: () => searchGames(searchQuery),
    enabled: searchQuery.trim().length > 0 && !processingGame, // Pausa busca se estiver processando
    retry: 1,
  });

  // Mutation para download
  const downloadMutation = useMutation({
    mutationFn: ({
      command,
      gameName,
    }: {
      command: string;
      gameName: string;
    }) => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }
      return downloadFromSearch(command, gameName, token);
    },
    onMutate: () => {
      setStatusMessage("Contactando servidor...");
    },
    onSuccess: data => {
      setIsSuccess(true);
      if (data.queued) {
        setStatusMessage(`📦 Adicionado à fila (Posição #${data.position})`);
        toast.success(`"${data.name}" foi para a fila.`);
      } else {
        setStatusMessage("🚀 Download iniciado com sucesso!");
        toast.success(`Download de "${data.name}" iniciado!`);
      }

      // Atualiza caches
      queryClient.invalidateQueries({ queryKey: ["active-downloads"] });

      // ✅ Countdown de 5 segundos antes de redirecionar
      setStatusMessage(
        "Redirecionando para Gerenciador de Downloads em 5 segundos..."
      );
      let remaining = 5;
      setCountdown(remaining);

      const countdownInterval = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        setStatusMessage(
          `Redirecionando para Gerenciador de Downloads em ${remaining} segundo${remaining !== 1 ? "s" : ""}...`
        );

        if (remaining <= 0) {
          clearInterval(countdownInterval);
          setLocation("/downloads");
        }
      }, 1000);
    },
    onError: (error: Error) => {
      // Verifica se é erro de duplicata
      const isDuplicate =
        error.message.includes("já está na fila") ||
        error.message.includes("já está sendo baixado") ||
        error.message.includes("Duplicado") ||
        error.message.includes("já existe") ||
        error.message.includes("já cadastrado") ||
        error.message.includes("409");

      if (isDuplicate) {
        // Mensagem específica baseada no tipo de duplicata
        if (error.message.includes("já existe no sistema")) {
          setStatusMessage("⚠️ Este jogo já existe no sistema");
          toast.error(
            "Este jogo já foi indexado anteriormente. Verifique a página de Games.",
            { duration: 5000 }
          );
        } else {
          setStatusMessage("⚠️ Este jogo já está na fila ou sendo baixado");
          toast.error(
            "Este jogo já está sendo processado. Verifique a página de Downloads.",
            { duration: 5000 }
          );
        }
      } else {
        setStatusMessage(
          "❌ Erro: " + (error.message || "Falha na solicitação")
        );
        toast.error(error.message || "Erro ao iniciar download");
      }

      // Reseta após erro para permitir tentar de novo
      setTimeout(() => {
        setProcessingGame(null);
        setIsSuccess(false);
        setCountdown(null);
      }, 4000); // Aumentado para 4s para dar tempo de ler a mensagem
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length > 0) {
      // Só atualiza searchQuery quando o usuário clica em buscar
      setSearchQuery(searchTerm.trim());
    }
  };

  const handleDownload = (game: SearchGame) => {
    // ✅ Ativa o Focus Mode
    setProcessingGame(game);
    setIsSuccess(false);
    setStatusMessage("Inicializando solicitação...");

    downloadMutation.mutate({
      command: game.command,
      gameName: game.name,
    });
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <div className="border-b-2 border-primary bg-card/80 backdrop-blur">
        <div className="container py-8">
          <div className="flex items-center gap-4">
            <Search className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                Buscar Jogos
              </h1>
              <p className="text-secondary text-sm mt-2 font-mono">
                Pesquise jogos no bot do Telegram e adicione à fila de download
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* ✅ MODO DE PROCESSAMENTO (FOCUS VIEW) */}
        {processingGame ? (
          <div className="max-w-2xl mx-auto mt-10 animate-in fade-in zoom-in duration-500">
            <Card className="cyber-card p-8 border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.2)]">
              <div className="text-center space-y-6">
                {/* Ícone Animado */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  {isSuccess ? (
                    <div className="rounded-full bg-green-500/20 p-4 animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                  ) : downloadMutation.isError ? (
                    <div className="rounded-full bg-destructive/20 p-4 animate-in zoom-in duration-300">
                      <AlertCircle className="w-16 h-16 text-destructive" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <Gamepad2 className="w-10 h-10 text-primary animate-pulse" />
                    </>
                  )}
                </div>

                {/* Título do Jogo */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {processingGame.name}
                  </h2>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {processingGame.size}
                  </Badge>
                </div>

                {/* Status Message */}
                <div className="bg-background/50 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center justify-center gap-3 text-lg font-mono text-primary">
                    {!isSuccess && !downloadMutation.isError && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                    {statusMessage}
                  </div>
                </div>

                {/* Barra de Progresso Fictícia para Feedback Visual */}
                {!isSuccess && !downloadMutation.isError && (
                  <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full w-1/3 rounded-full"
                      style={{ animation: "progress 2s ease-in-out infinite" }}
                    />
                  </div>
                )}

                {/* Countdown e Dica de UX */}
                {isSuccess && countdown !== null && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div
                          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary transition-transform duration-500 ease-out"
                          style={{
                            transform: `rotate(${360 - countdown * 72}deg)`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {countdown}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm text-center">
                      Redirecionando automaticamente...
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          /* ✅ MODO DE BUSCA PADRÃO */
          <>
            {/* Formulário de Busca */}
            <Card className="cyber-card p-6 mb-8">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
                  <Input
                    type="text"
                    placeholder="🔍 Digite o nome do jogo (Ex: Mario, Zelda)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 bg-card border-primary/60 focus:border-primary h-12 text-lg"
                    disabled={isSearching}
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSearching || searchTerm.trim().length === 0}
                  className="h-12 px-8 border-2 border-primary bg-primary text-white hover:bg-primary/90 hover:text-white font-bold tracking-wider"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "BUSCAR"
                  )}
                </Button>
              </form>
            </Card>

            {/* Resultados da Busca */}
            <div className="space-y-6">
              {searchError && (
                <Card className="cyber-card text-center py-8 mb-6 border-destructive/50">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <p className="text-destructive font-bold text-lg">
                    Erro na busca
                  </p>
                  <p className="text-secondary text-sm mt-2">
                    {searchError instanceof Error
                      ? searchError.message
                      : "Erro desconhecido"}
                  </p>
                </Card>
              )}

              {isSearching && searchQuery && (
                <div className="text-center py-16 animate-pulse">
                  <Server className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
                  <p className="text-primary font-bold text-lg">
                    Varrendo base de dados...
                  </p>
                </div>
              )}

              {!isSearching && !searchError && games.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {games.length} RESULTADOS ENCONTRADOS
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map((game, index) => (
                      <Card
                        key={`${game.command}-${index}`}
                        className="cyber-card p-5 hover:shadow-neon hover:border-primary transition-all duration-300 group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                              <Gamepad2 className="w-6 h-6" />
                            </div>
                            {game.size && game.size !== "N/A" && (
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {game.size}
                              </Badge>
                            )}
                          </div>

                          <h3
                            className="text-foreground font-bold text-base mb-2 line-clamp-2 leading-tight min-h-[2.5rem]"
                            title={game.name}
                          >
                            {game.name}
                          </h3>
                        </div>

                        <Button
                          size="sm"
                          className="w-full mt-4 bg-transparent border border-primary text-primary hover:bg-primary hover:text-black group-hover:shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all"
                          onClick={() => handleDownload(game)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          BAIXAR
                        </Button>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {!isSearching &&
                !searchError &&
                searchQuery &&
                games.length === 0 && (
                  <Card className="cyber-card text-center py-16 opacity-70">
                    <Search className="w-16 h-16 text-secondary mx-auto mb-4" />
                    <p className="text-lg font-bold">Nenhum jogo encontrado</p>
                    <p className="text-sm">
                      Verifique a ortografia ou tente outro termo.
                    </p>
                  </Card>
                )}

              {!searchQuery && (
                <div className="text-center py-20 opacity-30">
                  <Gamepad2 className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-xl font-mono">AGUARDANDO COMANDO...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
