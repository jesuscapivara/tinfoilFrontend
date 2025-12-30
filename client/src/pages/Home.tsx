import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Download, Lock, Zap, Server, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background grid-bg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-primary mb-4 animate-pulse">
              BEM-VINDO DE VOLTA
            </h1>
            <p className="text-secondary text-lg mb-8 font-mono">
              {user.email}
            </p>
            <Link href="/dashboard">
              <Button className="cyber-btn text-lg px-8 py-4">
                ACESSAR PAINEL
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b-2 border-primary bg-card/80 backdrop-blur">
          <div className="container py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                ▲ TINFOIL SHOP ▼
              </h1>
              <div className="flex gap-3">
                <Link href="/login">
                  <Button className="cyber-btn">LOGIN</Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary/10"
                  >
                    REGISTRAR
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="container py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl lg:text-6xl font-bold text-primary uppercase tracking-widest leading-tight">
                  CENTRO DE COMANDO TORRENT
                </h2>
                <p className="text-secondary text-xl mt-6 font-mono">
                  ▸ Sistema Avançado de Gerenciamento de Download ◂
                </p>
              </div>

              <p className="text-foreground text-lg leading-relaxed">
                Gerencie seus downloads de torrent com precisão militar.
                Acompanhamento em tempo real, integração automática com Dropbox
                e autenticação segura de usuários para a era moderna.
              </p>

              <div className="flex gap-4 pt-4">
                <Link href="/login">
                  <Button className="cyber-btn text-lg px-8 py-4">
                    INICIAR SESSÃO
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary/10 text-lg px-8 py-4 font-bold uppercase"
                  >
                    REGISTRAR
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-4">
              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Download className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">
                      Gerenciamento de Torrent
                    </h3>
                    <p className="text-sm text-foreground mt-2">
                      Faça upload e gerencie arquivos .torrent com
                      acompanhamento de progresso em tempo real
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Lock className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">
                      Autenticação Segura
                    </h3>
                    <p className="text-sm text-foreground mt-2">
                      Autenticação baseada em JWT com sistema de aprovação de
                      admin
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Zap className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">
                      Integração na Nuvem
                    </h3>
                    <p className="text-sm text-foreground mt-2">
                      Sincronização automática com Dropbox para arquivos
                      baixados
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Server className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">
                      Painel Admin
                    </h3>
                    <p className="text-sm text-foreground mt-2">
                      Painel de controle completo para gerenciamento do sistema
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t-2 border-primary bg-card/80 backdrop-blur py-20">
          <div className="container">
            <h2 className="text-3xl font-bold text-primary uppercase tracking-widest mb-12 text-center">
              ▸ Capacidades do Sistema ◂
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Suporte Multi-Usuário",
                  desc: "Gerencie múltiplas contas de usuário com acesso baseado em funções",
                },
                {
                  title: "Gerenciamento de Fila",
                  desc: "Fila de download configurável com limites de concorrência",
                },
                {
                  title: "Acompanhamento de Progresso",
                  desc: "Monitoramento em tempo real do progresso de download e upload",
                },
                {
                  title: "Validação de Arquivos",
                  desc: "Validação e pré-visualização automática de arquivos .torrent",
                },
                {
                  title: "Histórico de Downloads",
                  desc: "Histórico completo de todos os downloads concluídos",
                },
                {
                  title: "Integração Tinfoil",
                  desc: "Gere credenciais Tinfoil personalizadas",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="cyber-card group hover:shadow-neon transition-all duration-300"
                >
                  <h3 className="font-bold text-primary uppercase text-sm tracking-wider">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-foreground mt-3">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container py-20 text-center">
          <div className="cyber-card max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-primary uppercase mb-4 tracking-widest">
              PRONTO PARA CONECTAR?
            </h2>
            <p className="text-foreground mb-8 text-lg">
              Entre com sua conta ou registre-se para uma nova e comece agora.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button className="cyber-btn text-lg px-8 py-4">
                  INICIAR SESSÃO
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="border-2 border-primary text-primary hover:bg-primary/10 text-lg px-8 py-4"
                >
                  REGISTRAR
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-primary bg-card/80 backdrop-blur py-8 mt-20">
          <div className="container text-center text-sm text-secondary font-mono">
            <p>
              CAPIVARA SHOP © 2025 | Sistema Avançado de Gerenciamento de
              Torrent
            </p>
            <p className="mt-2">Powered by Manus AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
