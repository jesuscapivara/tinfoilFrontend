import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBackendHealth } from "@/lib/api";

export function Navigation() {
  const { user, logout, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verifica status do backend
  const { data: healthStatus, isLoading: healthLoading } = useQuery({
    queryKey: ["backend-health"],
    queryFn: getBackendHealth,
    enabled: !!user && !authLoading,
    refetchInterval: 10000, // Verifica a cada 10 segundos
    retry: 1,
    retryDelay: 2000,
  });

  const isBackendOnline = healthStatus?.status === "Online";

  // 🛠️ CORREÇÃO DA RACE CONDITION:
  // Renderiza apenas quando o estado de autenticação estiver completamente carregado
  // e o usuário estiver disponível. Isso garante que o menu apareça imediatamente
  // após o login, sem precisar de refresh manual.
  if (authLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard", admin: false },
    { label: "Games", href: "/games", admin: false }, // Games acessível para todos
    { label: "Buscar", href: "/search", admin: false }, // Busca acessível para todos
    { label: "Downloads", href: "/downloads", admin: false }, // Downloads acessível para todos
  ];

  const filteredItems = navItems.filter(
    item => !item.admin || user?.role === "admin"
  );

  return (
    <nav className="border-b-2 border-primary bg-card/90 backdrop-blur sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-primary uppercase tracking-widest hover:text-secondary transition-colors"
          >
            ▲ TINFOIL ▼
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {filteredItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-bold text-foreground uppercase hover:text-primary transition-colors tracking-wider"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-foreground font-mono font-bold">
                {user?.email}
              </p>
              <p className="text-xs font-mono mt-1">
                <span className="text-secondary">
                  {user?.role === "admin" ? "● ADMIN" : "● USER"} | STATUS:{" "}
                </span>
                {healthLoading ? (
                  <span className="text-secondary">● CHECKING...</span>
                ) : isBackendOnline ? (
                  <span className="text-green-500">● ONLINE</span>
                ) : (
                  <span className="text-destructive">● OFFLINE</span>
                )}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => logout()}
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">LOGOUT</span>
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden border-2 border-primary p-2 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t-2 border-primary/50 space-y-3">
            {filteredItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-bold text-foreground uppercase hover:text-primary transition-colors p-3 border border-primary/50 hover:border-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
