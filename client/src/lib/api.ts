/**
 * Cliente HTTP para comunicação com o backend lojaTinfoil
 * Gerencia autenticação centralizadamente
 */

// LÓGICA CRÍTICA: Define a URL base
// Em produção na Vercel, use a variável de ambiente sem barra no final.
// Ex: https://tinfoilapp.discloud.app (SEM /api no final!)
// O código adiciona os sufixos corretos (/api, /health, etc.)
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";

export interface BackendGame {
  url: string;
  size: number;
  name: string;
  id: string;
  titleId: string;
  version: string;
  filename: string;
}

export interface BackendApiResponse {
  files: BackendGame[];
  success: string;
  stats?: {
    base: number;
    dlc: number;
    update: number;
    unknown: number;
    total: number;
  };
}

export interface BackendIndexingStatus {
  isIndexing: boolean;
  progress: string;
  totalGames: number;
  stats?: {
    base: number;
    dlc: number;
    update: number;
    unknown: number;
    total: number;
  };
  lastUpdate: string | null;
}

export interface BackendHealth {
  status: string;
  time: string;
  games: number;
  titleDb: string;
}

/**
 * Obtém credenciais Tinfoil do localStorage
 */
function getTinfoilAuth(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tinfoil_auth");
}

/**
 * Salva credenciais Tinfoil no localStorage (base64 encoded)
 */
export function setTinfoilAuth(username: string, password: string): void {
  if (typeof window === "undefined") return;
  const auth = btoa(`${username}:${password}`);
  localStorage.setItem("tinfoil_auth", auth);
}

/**
 * Remove credenciais Tinfoil do localStorage
 */
export function clearTinfoilAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("tinfoil_auth");
}

/**
 * Wrapper inteligente para Fetch
 */
async function fetchBackend(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Remove barra duplicada se existir
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}${cleanEndpoint}`;
  
  // INJEÇÃO AUTOMÁTICA DE AUTH
  // Se tiver as credenciais no localStorage, injeta aqui para não sujar os componentes
  const storedAuth = getTinfoilAuth();
  const authHeaders: HeadersInit = {};
  
  if (storedAuth && !options.headers?.['Authorization']) {
    authHeaders['Authorization'] = `Basic ${storedAuth}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    // credentials: "include" - Só use se o backend setar Cookies
    // Como é Basic Auth via Header, isso não é estritamente necessário
  });

  if (!response.ok) {
    // Tratamento de erro 401 centralizado
    if (response.status === 401) {
      console.warn("Sessão expirada ou inválida");
      clearTinfoilAuth();
      // Opcional: window.location.href = '/login';
    }
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

/**
 * Obtém a lista de jogos do backend (Rota Tinfoil API)
 * Usa credenciais do localStorage se disponíveis
 */
export async function getBackendGames(
  tinfoilUser?: string,
  tinfoilPass?: string
): Promise<BackendApiResponse> {
  // Se credenciais foram passadas, salva no localStorage
  if (tinfoilUser && tinfoilPass) {
    setTinfoilAuth(tinfoilUser, tinfoilPass);
  }

  // ATENÇÃO: A rota é /api, não a raiz
  const response = await fetchBackend("/api", {
    method: "GET",
  });

  return response.json();
}

/**
 * Obtém jogos via bridge (para dashboard) - RECOMENDADO
 * Esta rota retorna dados mais ricos e formatados para humanos
 */
export async function getBackendGamesViaBridge(
  jwtToken?: string
): Promise<{
  games: BackendGame[];
  stats: {
    base: number;
    dlc: number;
    update: number;
    unknown: number;
    total: number;
  };
}> {
  const headers: HeadersInit = {};
  
  if (jwtToken) {
    headers.Authorization = `Bearer ${jwtToken}`;
  }

  const response = await fetchBackend("/bridge/games", {
    method: "GET",
    headers,
  });

  return response.json();
}

/**
 * Obtém o status de indexação do backend
 */
export async function getBackendIndexingStatus(): Promise<BackendIndexingStatus> {
  const response = await fetchBackend("/indexing-status", {
    method: "GET",
  });

  return response.json();
}

/**
 * Obtém o status de saúde do backend
 */
export async function getBackendHealth(): Promise<BackendHealth> {
  const response = await fetchBackend("/health", {
    method: "GET",
  });

  return response.json();
}

/**
 * Força uma nova indexação no backend
 */
export async function refreshBackendIndex(
  tinfoilUser?: string,
  tinfoilPass?: string
): Promise<string> {
  // Se credenciais foram passadas, salva no localStorage
  if (tinfoilUser && tinfoilPass) {
    setTinfoilAuth(tinfoilUser, tinfoilPass);
  }

  const response = await fetchBackend("/refresh", {
    method: "GET",
  });

  return response.text();
}

/**
 * Obtém dados do usuário via bridge
 */
export async function getBackendUserData(
  jwtToken: string
): Promise<{
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  tinfoilUser: string;
  tinfoilPass: string | null;
  host: string;
  protocol: string;
}> {
  const response = await fetchBackend("/bridge/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  return response.json();
}
