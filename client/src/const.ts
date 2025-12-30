// Constantes
export const COOKIE_NAME = "auth_token";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // O frontend agora tem sua própria página de login
  // O backend redireciona para aqui, então retornamos a URL do próprio frontend
  if (typeof window !== "undefined") {
    return `${window.location.origin}/login`;
  }
  return "/login";
};
