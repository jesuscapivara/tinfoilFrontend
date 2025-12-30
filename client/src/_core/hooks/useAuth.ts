/**
 * Hook simplificado para autenticação
 * Agora o frontend é apenas uma SPA que se conecta ao backend via HTTP
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getLoginUrl } from "@/const";
import { getBackendUserData } from "@/lib/api";

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
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Faz chamada ao backend para obter dados do usuário
      const userData = await getBackendUserData(token);
      
      // Mapeia os dados do backend para o formato esperado
      setUser({
        id: userData.isAdmin ? "admin" : userData.email,
        email: userData.email,
        role: userData.isAdmin ? "admin" : "user",
        isAdmin: userData.isAdmin,
        isApproved: userData.isApproved,
        tinfoilUser: userData.tinfoilUser,
      });
    } catch (err) {
      console.error("[useAuth] Erro ao buscar dados do usuário:", err);
      // Se o erro for 401, remove o token inválido
      if (err instanceof Error && err.message.includes("401")) {
        localStorage.removeItem("auth_token");
      }
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    // Sempre redireciona para login após logout
    window.location.href = redirectPath;
  }, [redirectPath]);

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
