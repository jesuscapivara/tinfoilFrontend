/**
 * Context Provider para autenticação
 * Compartilha o estado de autenticação entre todos os componentes
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getLoginUrl } from "@/const";
import { getBackendUserData } from "@/lib/api";

type User = {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  isApproved: boolean;
  tinfoilUser?: string;
  tinfoilHost?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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
      const newUser = {
        id: userData.isAdmin ? "admin" : userData.email,
        email: userData.email,
        role: userData.isAdmin ? "admin" : "user",
        isAdmin: userData.isAdmin,
        isApproved: userData.isApproved,
        tinfoilUser: userData.tinfoilUser,
        tinfoilHost: userData.host || null,
      };

      // 🛠️ CORREÇÃO DA RACE CONDITION:
      // Atualiza o estado de forma síncrona e aguarda o React propagar
      setUser(newUser);

      // Força um "tick" no event loop para garantir que o React
      // processou a atualização de estado antes de continuar
      await new Promise(resolve => setTimeout(resolve, 0));

      console.log("[AuthContext] Estado do usuário atualizado:", newUser.email);
    } catch (err) {
      console.error("[AuthContext] Erro ao buscar dados do usuário:", err);
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

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setUser(null);
    // Sempre redireciona para login após logout
    window.location.href = getLoginUrl();
  }, []);

  // Busca usuário na inicialização
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listener para detectar quando o token é salvo
  useEffect(() => {
    const handleAuthUpdate = async () => {
      console.log(
        "[AuthContext] Evento de auth detectado, forçando refresh..."
      );
      // Força atualização imediata do estado
      await fetchUser();
      console.log("[AuthContext] Estado atualizado após evento");
    };

    // Escuta evento customizado disparado pelo Login
    window.addEventListener("auth-token-updated", handleAuthUpdate);

    // Também escuta mudanças no localStorage (para outras abas)
    const handleStorageChange = async () => {
      console.log(
        "[AuthContext] Storage change detectado, forçando refresh..."
      );
      await fetchUser();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("auth-token-updated", handleAuthUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: Boolean(user),
        refresh: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(options?: {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
}) {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};

  // Redireciona se necessário
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (context.loading) return;
    if (context.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, context.loading, context.user]);

  return context;
}
