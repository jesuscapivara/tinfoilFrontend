import { useState } from "react";
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
} from "lucide-react";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Termo de busca ativo (só atualiza ao clicar em buscar)
  const queryClient = useQueryClient();

  // Busca jogos - só executa quando searchQuery é definido (após clicar em buscar)
  const {
    data: games = [],
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["search-games", searchQuery],
    queryFn: () => searchGames(searchQuery),
    enabled: searchQuery.trim().length > 0,
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
    onSuccess: data => {
      if (data.queued) {
        toast.success(
          `"${data.name}" adicionado à fila (posição ${data.position})`
        );
      } else {
        toast.success(`Download de "${data.name}" iniciado!`);
      }
      // Atualiza a lista de downloads ativos
      queryClient.invalidateQueries({ queryKey: ["active-downloads"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao iniciar download");
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
        {/* Formulário de Busca */}
        <Card className="cyber-card p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
              <Input
                type="text"
                placeholder="🔍 Digite o nome do jogo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-card border-primary/60 focus:border-primary"
                disabled={isSearching}
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || searchTerm.trim().length === 0}
              className="cyber-btn border-2 border-primary bg-primary text-white hover:bg-primary/90 hover:text-white font-bold px-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Resultados */}
        {searchError && (
          <Card className="cyber-card text-center py-8 mb-6">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-bold text-lg">
              Erro ao buscar jogos
            </p>
            <p className="text-secondary text-sm mt-2">
              {searchError instanceof Error
                ? searchError.message
                : "Erro desconhecido"}
            </p>
          </Card>
        )}

        {isSearching && searchQuery && (
          <Card className="cyber-card text-center py-16">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-primary font-bold text-lg">Buscando jogos...</p>
            <p className="text-secondary text-sm mt-2 font-mono">
              Aguarde, isso pode levar alguns segundos
            </p>
          </Card>
        )}

        {!isSearching && !searchError && games.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-secondary font-mono text-sm">
                {games.length} jogo{games.length !== 1 ? "s" : ""} encontrado
                {games.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game, index) => (
                <Card
                  key={`${game.command}-${index}`}
                  className="cyber-card p-4 hover:shadow-neon transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Gamepad2 className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-foreground font-bold text-sm mb-2 line-clamp-2"
                        title={game.name}
                      >
                        {game.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        {game.size && game.size !== "N/A" && (
                          <Badge variant="outline" className="text-xs">
                            {game.size}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(game)}
                        disabled={downloadMutation.isPending}
                        className="w-full border-primary/60 hover:border-primary hover:bg-primary/10"
                      >
                        {downloadMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3 mr-1" />
                            Adicionar à Fila
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isSearching && !searchError && searchQuery && games.length === 0 && (
          <Card className="cyber-card text-center py-16">
            <Search className="w-16 h-16 text-secondary mx-auto mb-4 opacity-40" />
            <p className="text-secondary font-bold text-lg">
              Nenhum jogo encontrado
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Tente buscar com outros termos
            </p>
          </Card>
        )}

        {!searchQuery && (
          <Card className="cyber-card text-center py-16">
            <Search className="w-16 h-16 text-secondary mx-auto mb-4 opacity-40" />
            <p className="text-secondary font-bold text-lg">
              Digite um termo de busca
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Use a barra de busca acima e clique em "Buscar" para encontrar
              jogos
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
