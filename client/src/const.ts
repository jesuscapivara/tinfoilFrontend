// Constantes
export const COOKIE_NAME = "auth_token";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";
  // Redireciona para o backend para fazer login
  return `${backendUrl}/admin/login`;
};
