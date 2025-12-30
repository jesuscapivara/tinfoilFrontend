/**
 * Hook simplificado para autenticação
 * Agora o frontend é apenas uma SPA que se conecta ao backend via HTTP
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getLoginUrl } from "@/const";

type User = {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  isApproved: boolean;
  tinfoilUser?: string;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tenta obter dados do usuário do backend
      // Por enquanto, vamos verificar se há um token no localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setUser(null);
        return;
      }

      // TODO: Fazer chamada ao backend para obter dados do usuário
      // Por enquanto, retorna null
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    // Redireciona para login se necessário
    if (redirectOnUnauthenticated) {
      window.location.href = redirectPath;
    }
  }, [redirectOnUnauthenticated, redirectPath]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    refresh: fetchUser,
    logout,
  };
}
