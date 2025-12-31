import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Shield,
} from "lucide-react";
import { regenerateCredentials } from "@/lib/api";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [regenerating, setRegenerating] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const handleRegenerateCredentials = async () => {
    if (!user || user.role === "admin") {
      toast.error("Admins não podem regenerar credenciais via interface");
      return;
    }

    if (!user.isApproved) {
      toast.error("Sua conta ainda não foi aprovada");
      return;
    }

    setRegenerating(true);
    setNewPassword(null);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      const result = await regenerateCredentials(token);
      console.log("[PROFILE] Resultado da regeneração:", result);

      if (result && result.newPass) {
        // Define a senha primeiro para garantir que seja exibida
        setNewPassword(result.newPass);
        console.log("[PROFILE] Nova senha definida no estado:", result.newPass);

        toast.success("Credenciais regeneradas com sucesso!", {
          description: "Copie a nova senha antes de fechar esta página",
        });

        // Não atualiza os dados do usuário imediatamente para evitar re-renderização
        // A senha não aparece no objeto user mesmo, então não é necessário atualizar
      } else {
        console.error("[PROFILE] Resposta inválida:", result);
        toast.error("Resposta inválida do servidor");
      }
    } catch (error) {
      console.error("[PROFILE] Erro ao regenerar credenciais:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao regenerar credenciais"
      );
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-bold animate-pulse">
          ▲ INICIALIZANDO SISTEMA ▼
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Usa o host retornado pelo backend (vem de process.env.DOMINIO)
  // Se não tiver, usa fallback baseado na URL do backend
  const tinfoilHost =
    user.tinfoilHost ||
    (() => {
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";
      try {
        const backendUrlObj = new URL(BACKEND_URL);
        return `${backendUrlObj.protocol}//${backendUrlObj.hostname}/api`;
      } catch {
        return "https://capivara.rossetti.eng.br/api";
      }
    })();

  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <header className="border-b-2 border-primary bg-card/80 backdrop-blur">
            <div className="container py-8">
              <div className="flex items-center gap-4">
                <User className="w-8 h-8 text-secondary" />
                <div>
                  <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                    Perfil e Configurações
                  </h1>
                  <p className="text-secondary text-sm mt-2 font-mono">
                    Gerencie suas credenciais e configurações
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Account Info */}
          <Card className="cyber-card">
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary uppercase tracking-wider flex items-center gap-3">
                <span className="text-secondary">▸</span>
                Informações da Conta
                <span className="text-secondary">◂</span>
              </h2>

              <div className="space-y-4">
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    E-mail
                  </p>
                  <p className="text-lg font-mono text-foreground font-bold">
                    {user.email}
                  </p>
                </div>

                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Função
                  </p>
                  <div className="flex items-center gap-2">
                    {user.role === "admin" ? (
                      <>
                        <Shield className="w-5 h-5 text-primary" />
                        <p className="text-lg text-primary font-bold">ADMIN</p>
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5 text-secondary" />
                        <p className="text-lg text-secondary font-bold">USER</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Status da Conta
                  </p>
                  <div className="flex items-center gap-2">
                    {user.isApproved ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                        <p className="text-lg text-secondary font-bold">
                          APROVADO
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        <p className="text-lg text-destructive font-bold">
                          AGUARDANDO APROVAÇÃO
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tinfoil Credentials */}
          <Card className="cyber-card">
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-primary uppercase tracking-wider flex items-center gap-3">
                <Key className="w-6 h-6 text-secondary" />
                <span className="text-secondary">▸</span>
                Credenciais Tinfoil
                <span className="text-secondary">◂</span>
              </h2>

              <div className="space-y-4">
                {/* Protocol */}
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Protocol
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-primary font-bold flex-1">
                      https
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("https")}
                      className="border-primary/60 hover:border-primary"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Host */}
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Host
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-primary font-bold flex-1">
                      {tinfoilHost.includes("/api")
                        ? tinfoilHost.replace("/api", "")
                        : tinfoilHost
                            .replace("https://", "")
                            .replace("http://", "")
                            .split("/")[0]}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const host = tinfoilHost.includes("/api")
                          ? tinfoilHost.replace("/api", "")
                          : tinfoilHost
                              .replace("https://", "")
                              .replace("http://", "")
                              .split("/")[0];
                        copyToClipboard(host);
                      }}
                      className="border-primary/60 hover:border-primary"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Port */}
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Port
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-secondary font-bold flex-1">
                      (em branco)
                    </p>
                  </div>
                </div>

                {/* Path */}
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Path
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-primary font-bold flex-1">
                      /api
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("/api")}
                      className="border-primary/60 hover:border-primary"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Username */}
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Username
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-primary font-bold flex-1">
                      {user.tinfoilUser || "NOT SET"}
                    </p>
                    {user.tinfoilUser && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(user.tinfoilUser || "")}
                        className="border-primary/60 hover:border-primary"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Title
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-primary font-bold flex-1">
                      Capivara Shop
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("Capivara Shop")}
                      className="border-primary/60 hover:border-primary"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Enable */}
                <div className="border-b border-primary/30 pb-4">
                  <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                    Enable
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-primary font-bold flex-1">
                      Sim
                    </p>
                  </div>
                </div>

                {newPassword && (
                  <>
                    <Alert className="border-green-500 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-500 font-bold">
                        Nova senha gerada! Copie antes de fechar.
                      </AlertDescription>
                    </Alert>
                    <div className="border-2 border-primary/50 bg-input p-4 rounded-lg">
                      <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-2">
                        Nova Tinfoil Password
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-mono text-primary font-bold flex-1">
                          {newPassword}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(newPassword)}
                          className="border-primary/60 hover:border-primary"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                      <p className="text-xs text-secondary mt-2 font-mono">
                        ⚠️ Esta senha será exibida apenas uma vez. Salve-a em um
                        local seguro.
                      </p>
                    </div>
                  </>
                )}

                {user.isApproved && user.role !== "admin" && (
                  <Button
                    onClick={handleRegenerateCredentials}
                    disabled={regenerating}
                    className="cyber-btn w-full"
                  >
                    {regenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        REGENERANDO...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        REGENERAR CREDENCIAIS
                      </>
                    )}
                  </Button>
                )}

                {user.role === "admin" && (
                  <Alert className="border-secondary bg-secondary/10">
                    <AlertCircle className="h-4 w-4 text-secondary" />
                    <AlertDescription className="text-secondary">
                      Admins devem alterar credenciais diretamente no servidor.
                    </AlertDescription>
                  </Alert>
                )}

                {!user.isApproved && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      Sua conta ainda não foi aprovada. Aguarde aprovação do
                      administrador.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
