import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { getBackendPendingUsers, approveUser, rejectUser } from "@/lib/api";
import { toast } from "sonner";

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Busca usuários pendentes
  const { data: pendingUsers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return [];
      return getBackendPendingUsers(token);
    },
    enabled: user?.role === "admin" && !authLoading,
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-bold animate-pulse">
          ▲ INICIALIZANDO SISTEMA ▼
        </div>
      </div>
    );
  }

  // Se não for admin, redireciona (ProtectedRoute vai cuidar disso)
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <div className="border-b-2 border-primary bg-card/80 backdrop-blur">
        <div className="container py-8">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                Gerenciamento de Usuários
              </h1>
              <p className="text-secondary text-sm mt-2 font-mono">
                Gerencie solicitações de acesso e usuários do sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* Pending Users */}
        <Card className="cyber-card">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-secondary" />
              <h2 className="text-2xl font-bold text-primary uppercase tracking-wider">
                Aprovações Pendentes
              </h2>
              {pendingUsers && pendingUsers.length > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground px-3 py-1 text-xs font-bold rounded-none">
                  {pendingUsers.length}
                </span>
              )}
            </div>

            {pendingLoading ? (
              <div className="text-center py-8">
                <div className="text-primary text-xl font-bold animate-pulse">
                  CARREGANDO...
                </div>
              </div>
            ) : pendingUsers && pendingUsers.length > 0 ? (
              <div className="space-y-3">
                {pendingUsers.map((pendingUser: any) => (
                  <div
                    key={pendingUser.id || pendingUser._id}
                    className="flex items-center justify-between p-4 border-2 border-primary/50 bg-input hover:bg-input/80 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-foreground font-mono font-bold text-lg">
                        {pendingUser.email}
                      </p>
                      <p className="text-xs text-secondary mt-1 font-mono">
                        Registrado em:{" "}
                        {new Date(pendingUser.createdAt).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                      {pendingUser.tinfoilUser && (
                        <p className="text-xs text-secondary mt-1 font-mono">
                          Tinfoil User: {pendingUser.tinfoilUser}
                        </p>
                      )}
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
                          approveMutation.isPending || rejectMutation.isPending
                        }
                      >
                        {approveMutation.isPending ? (
                          "PROCESSANDO..."
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            APROVAR
                          </>
                        )}
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
                          approveMutation.isPending || rejectMutation.isPending
                        }
                      >
                        {rejectMutation.isPending ? (
                          "PROCESSANDO..."
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            REJEITAR
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-secondary mx-auto mb-3 opacity-50" />
                <p className="text-secondary text-sm font-mono">
                  Nenhuma solicitação pendente
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="cyber-card mt-6">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-secondary mt-1" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-primary uppercase tracking-wider">
                  Sobre Aprovação de Usuários
                </h3>
                <ul className="text-sm text-foreground space-y-1 font-mono">
                  <li>
                    • Ao aprovar, o usuário receberá um e-mail com suas
                    credenciais Tinfoil
                  </li>
                  <li>• Ao rejeitar, o usuário será removido do sistema</li>
                  <li>
                    • Usuários aprovados podem regenerar suas credenciais a
                    qualquer momento
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
