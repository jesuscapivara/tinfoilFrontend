import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Users,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import {
  getBackendIndexingStatus,
  getBackendPendingUsers,
  approveUser,
  rejectUser,
  refreshIndexAsAdmin,
} from "@/lib/api";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: indexingStatus } = useQuery({
    queryKey: ["indexing-status"],
    queryFn: getBackendIndexingStatus,
    refetchInterval: 5000,
  });

  // Busca usuários pendentes apenas se for admin
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return [];
      return getBackendPendingUsers(token);
    },
    enabled: user?.role === "admin",
    refetchInterval: 10000,
  });

  // Mutation para aprovar usuário
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      return approveUser(userId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      toast.success("Usuário aprovado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao aprovar usuário");
    },
  });

  // Mutation para rejeitar usuário
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      return rejectUser(userId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      toast.success("Usuário rejeitado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao rejeitar usuário");
    },
  });

  // Mutation para forçar indexação (apenas admin)
  const refreshIndexMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      return refreshIndexAsAdmin(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indexing-status"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast.success("Indexação iniciada! Os jogos serão atualizados em breve.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao iniciar indexação");
    },
  });

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
      {/* Main Content */}
      <div className="container py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-xs uppercase font-bold tracking-wider">
                  Total Games
                </p>
                <p className="text-4xl font-bold text-primary mt-3">
                  {indexingStatus?.totalGames ||
                    indexingStatus?.stats?.total ||
                    0}
                </p>
              </div>
              <Download className="w-16 h-16 text-secondary opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>
          </Card>

          <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-xs uppercase font-bold tracking-wider">
                  Base Games
                </p>
                <p className="text-4xl font-bold text-primary mt-3">
                  {indexingStatus?.stats?.base || 0}
                </p>
              </div>
              <Zap className="w-16 h-16 text-secondary opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>
          </Card>

          <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-xs uppercase font-bold tracking-wider">
                  Last Update
                </p>
                <p className="text-lg text-primary mt-3 font-mono">
                  {indexingStatus?.lastUpdate
                    ? new Date(indexingStatus.lastUpdate).toLocaleDateString(
                        "pt-BR"
                      )
                    : "N/A"}
                </p>
              </div>
              <Clock className="w-16 h-16 text-secondary opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>
          </Card>
        </div>

        {/* Admin Refresh Button - Destaque */}
        {user.role === "admin" && (
          <Card className="cyber-card mb-12 border-2 border-primary/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-primary uppercase tracking-wider mb-2">
                  Game Index Management
                </h3>
                <p className="text-secondary text-sm">
                  {indexingStatus?.isIndexing
                    ? `Indexando... ${indexingStatus.progress || ""}`
                    : indexingStatus?.totalGames
                      ? `${indexingStatus.totalGames} jogos indexados`
                      : "Nenhum jogo indexado"}
                </p>
              </div>
              <Button
                onClick={() => refreshIndexMutation.mutate()}
                disabled={
                  refreshIndexMutation.isPending || indexingStatus?.isIndexing
                }
                className="cyber-btn text-lg px-8 py-6"
                size="lg"
              >
                {refreshIndexMutation.isPending ||
                indexingStatus?.isIndexing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                    INDEXANDO...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-3" />
                    REFRESH INDEX
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Admin Section */}
        {user.role === "admin" && (
          <div className="space-y-8">
            <div className="cyber-divider" />

            <h2 className="text-2xl font-bold text-primary uppercase tracking-widest flex items-center gap-3">
              <span className="text-secondary">▸</span>
              Admin Controls
              <span className="text-secondary">◂</span>
            </h2>

            {/* Pending Users */}
            <Card className="cyber-card">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-secondary" />
                <h3 className="text-xl font-bold text-primary uppercase tracking-wider">
                  Pending Approvals
                </h3>
                {pendingUsers && pendingUsers.length > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground px-3 py-1 text-xs font-bold rounded-none">
                    {pendingUsers.length}
                  </span>
                )}
                <Link href="/users" className="ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/60 hover:border-primary text-xs"
                  >
                    Ver Todos
                  </Button>
                </Link>
              </div>

              {pendingUsers && pendingUsers.length > 0 ? (
                <div className="space-y-3">
                  {pendingUsers.map(pendingUser => (
                    <div
                      key={pendingUser.id}
                      className="flex items-center justify-between p-4 border-2 border-primary/50 bg-input hover:bg-input/80 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-foreground font-mono font-bold">
                          {pendingUser.email}
                        </p>
                        <p className="text-xs text-secondary mt-1">
                          Registered:{" "}
                          {new Date(pendingUser.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="cyber-btn text-xs"
                          onClick={() =>
                            approveMutation.mutate(
                              pendingUser.id || pendingUser._id
                            )
                          }
                          disabled={
                            approveMutation.isPending ||
                            rejectMutation.isPending
                          }
                        >
                          {approveMutation.isPending
                            ? "PROCESSANDO..."
                            : "APPROVE"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="border-2 border-destructive text-destructive hover:bg-destructive/20 text-xs font-bold"
                          onClick={() =>
                            rejectMutation.mutate(
                              pendingUser.id || pendingUser._id
                            )
                          }
                          disabled={
                            approveMutation.isPending ||
                            rejectMutation.isPending
                          }
                        >
                          {rejectMutation.isPending
                            ? "PROCESSANDO..."
                            : "REJECT"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-secondary mx-auto mb-3 opacity-50" />
                  <p className="text-secondary text-sm">No pending approvals</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* User Section */}
        <div className="space-y-8 mt-12">
          <div className="cyber-divider" />

          <h2 className="text-2xl font-bold text-primary uppercase tracking-widest flex items-center gap-3">
            <span className="text-secondary">▸</span>
            Your Credentials
            <span className="text-secondary">◂</span>
          </h2>

          <Card className="cyber-card">
            <div className="space-y-6">
              <div className="border-b border-primary/30 pb-4">
                <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                  Tinfoil Username
                </p>
                <p className="text-lg font-mono text-primary font-bold">
                  {user.tinfoilUser || "NOT SET"}
                </p>
              </div>

              <div className="border-b border-primary/30 pb-4">
                <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                  Account Status
                </p>
                <div className="flex items-center gap-2">
                  {user.isApproved ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                      <p className="text-lg text-secondary font-bold">
                        APPROVED
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <p className="text-lg text-destructive font-bold">
                        PENDING APPROVAL
                      </p>
                    </>
                  )}
                </div>
              </div>

              {user.isApproved && (
                <Link href="/profile" className="w-full">
                  <Button className="cyber-btn w-full mt-4">
                    GERENCIAR CREDENCIAIS
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
