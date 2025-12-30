import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getLoginUrl } from "@/const";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireApproved?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireApproved = false,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Se não está autenticado, redireciona para login
    if (!isAuthenticated || !user) {
      setLocation(getLoginUrl());
      return;
    }

    // Se requer admin mas não é admin
    if (requireAdmin && user.role !== "admin") {
      setLocation("/dashboard");
      return;
    }

    // Se requer aprovação mas não está aprovado
    if (requireApproved && !user.isApproved) {
      setLocation("/dashboard");
      return;
    }
  }, [
    loading,
    isAuthenticated,
    user,
    requireAdmin,
    requireApproved,
    setLocation,
  ]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-bold animate-pulse">
          ▲ INITIALIZING SYSTEM ▼
        </div>
      </div>
    );
  }

  // Se não está autenticado, não renderiza nada (já está redirecionando)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Verifica permissões
  if (requireAdmin && user.role !== "admin") {
    return null;
  }

  if (requireApproved && !user.isApproved) {
    return null;
  }

  return <>{children}</>;
}
