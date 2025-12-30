import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";

export default function Register() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Se já está autenticado, redireciona para dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validações client-side
    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/bridge/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao realizar cadastro");
        return;
      }

      if (data.success) {
        setSuccess(true);
        toast.success("Cadastro realizado!", {
          description: "Aguarde aprovação do administrador",
        });

        // Limpa o formulário
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Erro ao realizar cadastro");
      }
    } catch (err) {
      console.error("[REGISTER] Erro no registro:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao conectar com o servidor"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-2 border-primary">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 uppercase tracking-widest">
            ▲ REGISTRO ▼
          </h1>
          <p className="text-secondary text-sm font-mono">
            Solicite acesso ao Command Center
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500 font-bold">
                Cadastro realizado com sucesso!
              </AlertDescription>
            </Alert>
            <div className="text-center space-y-4">
              <p className="text-foreground">
                Sua solicitação foi enviada e está aguardando aprovação do
                administrador.
              </p>
              <p className="text-secondary text-sm font-mono">
                Você receberá um e-mail quando sua conta for aprovada.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ir para Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
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
                  autoComplete="email"
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
                  minLength={6}
                  className="pl-10 cyber-input"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-secondary font-mono">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-primary font-mono"
              >
                CONFIRMAR SENHA
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 cyber-input"
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full cyber-btn text-lg py-6"
            >
              {loading ? "PROCESSANDO..." : "SOLICITAR ACESSO"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-secondary text-sm font-mono">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-bold"
            >
              ENTRAR
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
