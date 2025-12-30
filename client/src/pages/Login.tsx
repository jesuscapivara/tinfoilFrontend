import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, refresh } = useAuth();

  // Se já está autenticado, redireciona para dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Remove espaços em branco e normaliza o email
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      console.log("[LOGIN] Iniciando requisição de login...");
      console.log("[LOGIN] Backend URL:", BACKEND_URL);
      console.log("[LOGIN] Email:", cleanEmail);

      const response = await fetch(`${BACKEND_URL}/bridge/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      console.log("[LOGIN] Status da resposta:", response.status);
      console.log(
        "[LOGIN] Headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Verifica se a resposta é JSON
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("[LOGIN] Dados recebidos:", {
          ...data,
          token: data.token ? "***TOKEN***" : "SEM TOKEN",
        });
      } else {
        const text = await response.text();
        console.error("[LOGIN] Resposta não é JSON:", text);
        throw new Error(`Resposta inválida do servidor: ${text}`);
      }

      if (!response.ok) {
        // Se não foi sucesso, mostra o erro
        console.error("[LOGIN] Erro na resposta:", data);
        setError(
          data.error || `Erro ${response.status}: ${response.statusText}`
        );
        return;
      }

      if (data.success && data.token) {
        console.log("[LOGIN] Login bem-sucedido! Salvando token...");
        // Salva o token no localStorage
        localStorage.setItem("auth_token", data.token);
        console.log("[LOGIN] Token salvo no localStorage");

        // Dispara evento customizado para notificar o AuthContext
        window.dispatchEvent(new Event("auth-token-updated"));

        // Atualiza o estado de autenticação e AGUARDA a conclusão
        try {
          await refresh();
          console.log("[LOGIN] Estado de autenticação atualizado");
        } catch (refreshError) {
          console.error("[LOGIN] Erro ao atualizar estado:", refreshError);
          // Continua mesmo se o refresh falhar, pois o token está salvo
        }

        // 🛠️ CORREÇÃO DA RACE CONDITION:
        // Aguarda um "tick" no event loop para garantir que o React
        // propagou o estado do AuthContext para todos os componentes
        // (Navigation, Dashboard, etc.) antes de redirecionar
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redireciona para o dashboard
        if (data.redirect) {
          // Se o backend retornou uma URL completa, extrai o path
          const redirectPath = data.redirect.startsWith("http")
            ? new URL(data.redirect).pathname
            : data.redirect;
          console.log("[LOGIN] Redirecionando para:", redirectPath);
          setLocation(redirectPath);
        } else {
          console.log("[LOGIN] Redirecionando para /dashboard");
          setLocation("/dashboard");
        }
      } else {
        console.error("[LOGIN] Resposta sem sucesso ou sem token:", data);
        setError(data.error || "Credenciais inválidas");
      }
    } catch (err) {
      console.error("[LOGIN] Erro no login:", err);
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-2 border-primary">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 uppercase tracking-widest">
            ▲ LOGIN ▼
          </h1>
          <p className="text-secondary text-sm font-mono">
            Acesse o Command Center
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary font-mono">
              EMAIL
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="pl-10 cyber-input"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-primary font-mono">
              SENHA
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="pl-10 cyber-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full cyber-btn text-lg py-6"
          >
            {loading ? "PROCESSANDO..." : "ENTRAR"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-secondary text-sm font-mono">
            Não tem conta?{" "}
            <a
              href="/register"
              className="text-primary hover:underline font-bold"
            >
              REGISTRAR
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
