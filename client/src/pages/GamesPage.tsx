import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Copy,
  Search,
  Download,
  ExternalLink,
  AlertCircle,
  Gamepad2,
  Package,
  RefreshCw,
} from "lucide-react";
import { getBackendGamesViaBridge, BackendGame } from "@/lib/api";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// Função para identificar tipo de jogo
function getGameType(
  titleId: string | null | undefined
): "BASE" | "UPDATE" | "DLC" | "UNKNOWN" {
  if (!titleId || titleId.length !== 16) return "UNKNOWN";
  const suffix = titleId.slice(-3).toUpperCase();
  if (suffix === "800") return "UPDATE";
  if (suffix === "000") return "BASE";
  return "DLC";
}

// Função para formatar tamanho
function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024 * 1024) {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  }
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

// Função para encontrar o ID da imagem (capa do jogo base)
function getImageId(game: BackendGame, allGames: BackendGame[]): string {
  if (!game.id) {
    return "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
  }

  const type = getGameType(game.id);
  let imageId = game.id;

  if (type === "UPDATE") {
    // Update: muda final 800 para 000
    imageId = game.id.substring(0, 13) + "000";
  } else if (type === "DLC") {
    // DLC: procura o jogo base na lista
    const appGroup = game.id.substring(0, 12);
    const parentGame = allGames.find(
      g => g.id && g.id.startsWith(appGroup) && g.id.endsWith("000")
    );

    if (parentGame) {
      imageId = parentGame.id;
    } else {
      // Fallback: tenta subtrair 1 do 13º digito hexadecimal
      try {
        const nibbleChar = game.id[12];
        const nibbleVal = parseInt(nibbleChar, 16);
        if (!isNaN(nibbleVal) && nibbleVal > 0) {
          const prevNibble = (nibbleVal - 1).toString(16).toUpperCase();
          imageId = appGroup + prevNibble + "000";
        } else {
          imageId = game.id.substring(0, 13) + "000";
        }
      } catch {
        imageId = game.id.substring(0, 13) + "000";
      }
    }
  }

  return `https://tinfoil.media/ti/${imageId}/256/256/`;
}

// Interface para jogos agrupados
interface GroupedGame {
  base: BackendGame;
  dlcs: BackendGame[];
  updates: BackendGame[];
}

export default function GamesPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "base" | "dlc" | "update">(
    "all"
  );
  const [selectedGameGroup, setSelectedGameGroup] =
    useState<GroupedGame | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Reseta o search quando muda de tab para evitar problemas de estado
  const handleTabChange = (value: string) => {
    setSearchTerm(""); // Limpa a busca ao mudar de tab
    setActiveTab(value as typeof activeTab);
  };

  const handleCardClick = (group: GroupedGame) => {
    setSelectedGameGroup(group);
    setIsDialogOpen(true);
  };

  // Encontra o grupo relacionado para um jogo individual (DLC ou Update)
  const findGameGroup = (game: BackendGame): GroupedGame | null => {
    if (!game.id || game.id.length !== 16) return null;

    const gameType = getGameType(game.id);

    // Se for um jogo base, procura no groupedGames
    if (gameType === "BASE") {
      const found = groupedGames.find(g => g.base.id === game.id);
      return found || null;
    }

    // Se for DLC ou Update, procura o jogo base relacionado
    const appGroup = game.id.substring(0, 12);
    const baseGame = allGames.find(
      g => g.id && g.id.startsWith(appGroup) && g.id.endsWith("000")
    );

    if (!baseGame) return null;

    // Constrói um grupo temporário com este jogo base e seus relacionados
    const baseGroup = groupedGames.find(g => g.base.id === baseGame.id);
    if (baseGroup) {
      return baseGroup;
    }

    // Se não encontrou no groupedGames, constrói manualmente
    const relatedDlcs = allGames.filter(
      g =>
        g.id &&
        g.id.startsWith(appGroup) &&
        !g.id.endsWith("000") &&
        !g.id.endsWith("800")
    );
    const relatedUpdates = allGames.filter(
      g => g.id && g.id.startsWith(appGroup) && g.id.endsWith("800")
    );

    return {
      base: baseGame,
      dlcs: relatedDlcs,
      updates: relatedUpdates,
    };
  };

  const handleIndividualGameClick = (game: BackendGame) => {
    const group = findGameGroup(game);
    if (group) {
      setSelectedGameGroup(group);
      setIsDialogOpen(true);
    }
  };

  // Usa /bridge/games que retorna dados mais ricos e formatados para humanos
  const {
    data: gamesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["games", "bridge"],
    queryFn: () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token não encontrado");
      }
      return getBackendGamesViaBridge(token);
    },
    enabled: !!user && !!localStorage.getItem("auth_token"),
    retry: 1,
  });

  const allGames = gamesData?.games || [];
  const stats = gamesData?.stats;

  // Agrupa jogos base com seus DLCs e Updates
  const groupedGames = useMemo(() => {
    // Filtra APENAS jogos BASE - verifica explicitamente que termina em "000"
    const baseGames = allGames.filter(g => {
      if (!g.id || g.id.length !== 16) return false;
      const suffix = g.id.slice(-3).toUpperCase();
      return suffix === "000"; // Apenas jogos que terminam em 000
    });

    // Filtra DLCs - não termina em 000 nem 800
    const dlcs = allGames.filter(g => {
      if (!g.id || g.id.length !== 16) return false;
      const suffix = g.id.slice(-3).toUpperCase();
      return suffix !== "000" && suffix !== "800";
    });

    // Filtra Updates - termina em 800
    const updates = allGames.filter(g => {
      if (!g.id || g.id.length !== 16) return false;
      const suffix = g.id.slice(-3).toUpperCase();
      return suffix === "800";
    });

    return baseGames
      .filter(base => {
        // Garante que é realmente um jogo BASE (termina em 000)
        return base.id && base.id.length === 16 && base.id.endsWith("000");
      })
      .map(base => {
        const appGroup = base.id?.substring(0, 12) || "";
        return {
          base,
          dlcs: dlcs.filter(dlc => dlc.id?.startsWith(appGroup)),
          updates: updates.filter(upd => upd.id?.startsWith(appGroup)),
        };
      });
  }, [allGames]);

  // Filtra jogos baseado no termo de busca e tab ativa
  const filteredGames = useMemo(() => {
    // Tab base retorna grupos
    if (activeTab === "base") {
      if (!searchTerm.trim()) {
        return groupedGames;
      }
      const term = searchTerm.toLowerCase().trim();
      return groupedGames.filter(group =>
        group.base.name.toLowerCase().includes(term)
      );
    }

    // Outras tabs retornam jogos individuais
    let gamesToFilter: BackendGame[] = [];

    if (activeTab === "all") {
      gamesToFilter = allGames;
    } else if (activeTab === "dlc") {
      // Filtra apenas DLCs - verifica explicitamente
      gamesToFilter = allGames.filter(g => {
        if (!g.id || g.id.length !== 16) return false;
        const suffix = g.id.slice(-3).toUpperCase();
        return suffix !== "000" && suffix !== "800";
      });
    } else if (activeTab === "update") {
      // Filtra apenas Updates - verifica explicitamente
      gamesToFilter = allGames.filter(g => {
        if (!g.id || g.id.length !== 16) return false;
        const suffix = g.id.slice(-3).toUpperCase();
        return suffix === "800";
      });
    }

    if (!searchTerm.trim()) {
      return gamesToFilter;
    }

    const term = searchTerm.toLowerCase().trim();
    return gamesToFilter.filter(game =>
      game.name?.toLowerCase().includes(term)
    );
  }, [allGames, searchTerm, activeTab, groupedGames]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-bold animate-pulse">
          ▲ INICIALIZANDO SISTEMA ▼
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Database className="w-8 h-8 text-secondary" />
              <div>
                <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                  Índice de Jogos
                </h1>
                <p className="text-secondary text-sm mt-2 font-mono">
                  {isLoading
                    ? "Carregando..."
                    : error
                      ? "Erro ao carregar jogos"
                      : stats
                        ? `${stats.base} base${stats.dlc > 0 ? ` • ${stats.dlc} DLCs` : ""}${stats.update > 0 ? ` • ${stats.update} updates` : ""} • ${stats.total} total`
                        : `${allGames.length} jogos indexados`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* Tabs e Barra de busca */}
        {!isLoading && !error && allGames.length > 0 && (
          <div className="mb-6 space-y-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start bg-card border border-primary/30">
                <TabsTrigger value="all" className="flex-1">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Todos ({stats?.total || 0})
                </TabsTrigger>
                <TabsTrigger value="base" className="flex-1">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Jogos ({stats?.base || 0})
                </TabsTrigger>
                <TabsTrigger value="dlc" className="flex-1">
                  <Package className="w-4 h-4 mr-2" />
                  DLCs ({stats?.dlc || 0})
                </TabsTrigger>
                <TabsTrigger value="update" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Updates ({stats?.update || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
              <Input
                type="text"
                placeholder="🔍 Buscar jogos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-card border-primary/60 focus:border-primary"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-secondary mt-2 font-mono">
                {filteredGames.length} resultado
                {filteredGames.length !== 1 ? "s" : ""} encontrado
                {filteredGames.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {isLoading ? (
          <Card className="cyber-card text-center py-16">
            <div className="text-primary text-2xl font-bold animate-pulse">
              ▲ CARREGANDO JOGOS ▼
            </div>
          </Card>
        ) : error ? (
          <Card className="cyber-card text-center py-16">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-bold text-lg">
              Erro ao carregar jogos
            </p>
            <p className="text-secondary text-sm mt-2">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
          </Card>
        ) : filteredGames && filteredGames.length > 0 ? (
          <>
            <h2 className="sr-only">
              {activeTab === "base"
                ? "Lista de jogos base"
                : activeTab === "dlc"
                  ? "Lista de DLCs"
                  : activeTab === "update"
                    ? "Lista de updates"
                    : "Lista de todos os jogos"}
            </h2>
            <div
              key={`games-grid-${activeTab}-${searchTerm}`}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
            >
              {activeTab === "base"
                ? (filteredGames as GroupedGame[]).map((group: GroupedGame) => {
                    // Garante que só renderiza se for realmente um jogo BASE
                    if (!group.base?.id || !group.base.id.endsWith("000")) {
                      return null;
                    }
                    const imageUrl = getImageId(group.base, allGames);
                    const tinfoilUrl = group.base.id
                      ? `https://tinfoil.io/Title/${group.base.id}`
                      : "#";
                    const hasRelated =
                      group.dlcs.length > 0 || group.updates.length > 0;

                    return (
                      <Card
                        key={group.base.id || group.base.url}
                        className="cyber-card group hover:shadow-neon transition-all duration-300 cursor-pointer"
                        onClick={() => handleCardClick(group)}
                      >
                        <div className="p-4 space-y-3">
                          {/* Imagem do jogo */}
                          <div className="relative w-full aspect-square">
                            <img
                              src={imageUrl}
                              alt={group.base.name}
                              className="w-full h-full rounded-lg object-cover bg-black"
                              onError={e => {
                                (e.target as HTMLImageElement).src =
                                  "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
                              }}
                            />
                          </div>

                          {/* Informações do jogo */}
                          <div>
                            <h2
                              className="text-foreground font-bold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2"
                              title={group.base.name}
                            >
                              {group.base.name}
                            </h2>

                            <div className="flex flex-wrap gap-2 items-center mb-3 text-xs">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {formatSize(group.base.size)}
                              </Badge>
                              {hasRelated && (
                                <Badge variant="outline" className="text-xs">
                                  {group.dlcs.length} DLC
                                  {group.dlcs.length !== 1 ? "s" : ""} •{" "}
                                  {group.updates.length} Update
                                  {group.updates.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>

                            {/* Botões de ação */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation(); // Previne que o clique abra o modal
                                  navigator.clipboard.writeText(group.base.url);
                                  toast.success("URL copiada!");
                                }}
                                className="w-full border-primary/60 hover:border-primary hover:bg-primary/10 text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                              {group.base.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation(); // Previne que o clique abra o modal
                                    window.open(tinfoilUrl, "_blank");
                                  }}
                                  className="w-full border-primary/60 hover:border-primary hover:bg-primary/10 text-xs"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Info
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                : (filteredGames as BackendGame[]).map((game: BackendGame) => {
                    // Validação extra: garante que o jogo corresponde ao filtro ativo
                    const gameType = getGameType(game.id);

                    // Validação por tipo de tab
                    if (activeTab === "dlc" && gameType !== "DLC") {
                      return null;
                    }
                    if (activeTab === "update" && gameType !== "UPDATE") {
                      return null;
                    }

                    const imageUrl = getImageId(game, allGames);
                    const tinfoilUrl = game.id
                      ? `https://tinfoil.io/Title/${game.id.substring(0, 13) + "000"}`
                      : "#";

                    return (
                      <Card
                        key={game.id || game.url}
                        className="cyber-card group hover:shadow-neon transition-all duration-300 cursor-pointer"
                        onClick={() => handleIndividualGameClick(game)}
                      >
                        <div className="p-4 space-y-3">
                          {/* Imagem do jogo */}
                          <div className="relative w-full aspect-square">
                            <img
                              src={imageUrl}
                              alt={game.name}
                              className="w-full h-full rounded-lg object-cover bg-black"
                              onError={e => {
                                (e.target as HTMLImageElement).src =
                                  "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
                              }}
                            />
                            {/* Badge de tipo */}
                            {gameType !== "BASE" && gameType !== "UNKNOWN" && (
                              <Badge
                                className={`absolute bottom-2 right-2 text-xs font-bold ${
                                  gameType === "UPDATE"
                                    ? "bg-orange-500/90 text-white"
                                    : "bg-purple-500/90 text-white"
                                }`}
                              >
                                {gameType}
                              </Badge>
                            )}
                          </div>

                          {/* Informações do jogo */}
                          <div>
                            <h2
                              className="text-foreground font-bold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2"
                              title={game.name}
                            >
                              {game.name}
                            </h2>

                            <div className="flex flex-wrap gap-2 items-center mb-3 text-xs">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {formatSize(game.size)}
                              </Badge>
                              {game.id && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono opacity-70"
                                >
                                  {game.id}
                                </Badge>
                              )}
                            </div>

                            {/* Botões de ação */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation(); // Previne que o clique abra o modal
                                  navigator.clipboard.writeText(game.url);
                                  toast.success("URL copiada!");
                                }}
                                className="w-full border-primary/60 hover:border-primary hover:bg-primary/10 text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                              {game.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation(); // Previne que o clique abra o modal
                                    window.open(tinfoilUrl, "_blank");
                                  }}
                                  className="w-full border-primary/60 hover:border-primary hover:bg-primary/10 text-xs"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Info
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
            </div>
          </>
        ) : (
          <Card className="cyber-card text-center py-16">
            <Database className="w-16 h-16 text-secondary mx-auto mb-4 opacity-40" />
            <p className="text-secondary font-bold text-lg">
              {searchTerm
                ? "Nenhum jogo encontrado"
                : "Nenhum jogo indexado ainda"}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Faça upload de arquivos torrent para indexar jogos"}
            </p>
          </Card>
        )}

        {/* Modal de Detalhes */}
        {selectedGameGroup && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedGameGroup.base.name}
                </DialogTitle>
                <DialogDescription>
                  Detalhes do jogo, incluindo DLCs e updates disponíveis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Informações do Jogo Base */}
                <div className="border-b border-primary/30 pb-4">
                  <h4 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    Jogo Base
                  </h4>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-2">
                        {selectedGameGroup.base.name}
                      </p>
                      <div className="flex gap-2 items-center text-xs">
                        <Badge variant="outline" className="text-xs">
                          {formatSize(selectedGameGroup.base.size)}
                        </Badge>
                        {selectedGameGroup.base.id && (
                          <Badge
                            variant="outline"
                            className="text-xs font-mono opacity-70"
                          >
                            {selectedGameGroup.base.id}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selectedGameGroup.base.url
                            );
                            toast.success("URL copiada!");
                          }}
                          className="h-6 text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Updates */}
                {selectedGameGroup.updates.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Updates ({selectedGameGroup.updates.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedGameGroup.updates.map(update => (
                        <Card key={update.id || update.url} className="p-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-sm mb-1">
                                {update.name}
                              </p>
                              <div className="flex gap-2 items-center text-xs">
                                <Badge variant="outline" className="text-xs">
                                  {formatSize(update.size)}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    navigator.clipboard.writeText(update.url);
                                    toast.success("URL copiada!");
                                  }}
                                  className="h-6 text-xs"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* DLCs */}
                {selectedGameGroup.dlcs.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      DLCs ({selectedGameGroup.dlcs.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedGameGroup.dlcs.map(dlc => (
                        <Card key={dlc.id || dlc.url} className="p-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-sm mb-1">
                                {dlc.name}
                              </p>
                              <div className="flex gap-2 items-center text-xs">
                                <Badge variant="outline" className="text-xs">
                                  {formatSize(dlc.size)}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    navigator.clipboard.writeText(dlc.url);
                                    toast.success("URL copiada!");
                                  }}
                                  className="h-6 text-xs"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensagem se não houver DLCs nem Updates */}
                {selectedGameGroup.dlcs.length === 0 &&
                  selectedGameGroup.updates.length === 0 && (
                    <div className="text-center py-8 text-secondary">
                      <p>Nenhum DLC ou Update disponível para este jogo.</p>
                    </div>
                  )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
