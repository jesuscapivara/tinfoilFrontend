import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/bridge/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Salva o token no localStorage
        localStorage.setItem("auth_token", data.token);
        
        // Redireciona para o dashboard
        if (data.redirect) {
          // Se o backend retornou uma URL completa, extrai o path
          const redirectPath = data.redirect.startsWith("http")
            ? new URL(data.redirect).pathname
            : data.redirect;
          setLocation(redirectPath);
        } else {
          setLocation("/dashboard");
        }
      } else {
        setError(data.error || "Credenciais inválidas");
      }
    } catch (err) {
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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

