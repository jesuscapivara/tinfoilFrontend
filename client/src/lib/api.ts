/**
 * Cliente HTTP para comunicação com o backend lojaTinfoil
 * Gerencia autenticação centralizadamente
 */

// LÓGICA CRÍTICA: Define a URL base
// Em produção na Vercel, use a variável de ambiente sem barra no final.
// Ex: https://tinfoilapp.discloud.app (SEM /api no final!)
// O código adiciona os sufixos corretos (/api, /health, etc.)
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";

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
 * Erro específico para jogos duplicados
 * Permite que a UI trate duplicatas de forma diferente de outros erros
 */
export class DuplicateGameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateGameError";
    Object.setPrototypeOf(this, DuplicateGameError.prototype);
  }
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
  // Garante que o endpoint comece com /
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Remove barra final da URL base se houver, para evitar //
  const cleanBase = BACKEND_URL.endsWith("/")
    ? BACKEND_URL.slice(0, -1)
    : BACKEND_URL;

  const url = `${cleanBase}${cleanEndpoint}`;

  // INJEÇÃO AUTOMÁTICA DE AUTH
  // Se tiver as credenciais no localStorage, injeta aqui para não sujar os componentes
  const storedAuth = getTinfoilAuth();
  const authHeaders: Record<string, string> = {};

  if (
    storedAuth &&
    !(options.headers as Record<string, string>)?.["Authorization"]
  ) {
    authHeaders["Authorization"] = `Basic ${storedAuth}`;
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

    // 🔥 CORREÇÃO: Tenta ler a mensagem de erro enviada pelo Backend
    let errorMessage = `Erro na requisição: ${response.status} ${response.statusText}`;

    try {
      // Clona a response para poder ler o body sem consumir o stream original
      const clonedResponse = response.clone();
      const errorData = await clonedResponse.json();
      // Se o backend enviou { error: "Mensagem..." }, usamos ela!
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        // Alguns endpoints podem usar "message" em vez de "error"
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Se não for JSON, tenta ler como texto
      try {
        const clonedResponse = response.clone();
        const textError = await clonedResponse.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      } catch (e2) {
        // Falha silenciosa, usa mensagem padrão
      }
    }

    // Lança o erro com a mensagem real do backend (ex: "Este jogo já existe...")
    throw new Error(errorMessage);
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
export async function getBackendGamesViaBridge(jwtToken?: string): Promise<{
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
export async function getBackendUserData(jwtToken: string): Promise<{
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

/**
 * Obtém lista de usuários pendentes de aprovação
 */
export async function getBackendPendingUsers(jwtToken: string): Promise<any[]> {
  const response = await fetchBackend("/bridge/users/pending", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  return response.json();
}

/**
 * Regenera credenciais Tinfoil do usuário
 */
export async function regenerateCredentials(
  jwtToken: string
): Promise<{ success: boolean; newPass: string }> {
  const response = await fetchBackend("/bridge/regenerate-credentials", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(errorData.error || "Erro ao regenerar credenciais");
  }

  const data = await response.json();
  console.log("[API] Resposta da regeneração:", data);
  return data;
}

/**
 * Aprova um usuário pendente
 */
export async function approveUser(
  userId: string,
  jwtToken: string
): Promise<{ success: boolean }> {
  const response = await fetchBackend(`/bridge/users/approve/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(errorData.error || "Erro ao aprovar usuário");
  }

  return response.json();
}

/**
 * Rejeita um usuário pendente
 */
export async function rejectUser(
  userId: string,
  jwtToken: string
): Promise<{ success: boolean }> {
  const response = await fetchBackend(`/bridge/users/reject/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(errorData.error || "Erro ao rejeitar usuário");
  }

  return response.json();
}

/**
 * Faz upload de arquivo torrent
 */
export async function uploadTorrentFile(
  file: File,
  jwtToken: string
): Promise<{ success: boolean; downloadId: string; message: string }> {
  // Usa FormData para enviar o arquivo como multipart/form-data
  const formData = new FormData();
  formData.append("torrentFile", file);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8080";
  const cleanBase = BACKEND_URL.endsWith("/")
    ? BACKEND_URL.slice(0, -1)
    : BACKEND_URL;
  const url = `${cleanBase}/bridge/upload-torrent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      // NÃO adiciona Content-Type - o browser vai adicionar automaticamente com boundary
    },
    body: formData,
  });

  // 1. INTERCEPTAÇÃO ESTRATÉGICA DO 409 (Duplicata)
  if (response.status === 409) {
    let errorMessage = "Este jogo já existe no sistema.";
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Se não conseguir ler JSON, usa mensagem padrão
    }
    // Lança um erro tipado que a UI pode identificar
    throw new DuplicateGameError(errorMessage);
  }

  if (!response.ok) {
    // Tratamento de erro para outros status codes
    let errorMessage = `Erro na requisição: ${response.status} ${response.statusText}`;

    try {
      const clonedResponse = response.clone();
      const errorData = await clonedResponse.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      try {
        const clonedResponse = response.clone();
        const textError = await clonedResponse.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      } catch (e2) {
        // Falha silenciosa, usa mensagem padrão
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Obtém downloads ativos e fila
 */
export async function getActiveDownloads(jwtToken: string): Promise<{
  active: any[];
  queue: any[];
}> {
  const response = await fetchBackend("/bridge/status", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  return response.json();
}

/**
 * Cancela um download
 */
// ═══════════════════════════════════════════════
// TELEGRAM INDEXER - BUSCA E DOWNLOAD DE JOGOS
// ═══════════════════════════════════════════════

export interface SearchGame {
  name: string;
  command: string;
  size: string;
}

export interface SearchGamesResponse {
  success: boolean;
  games: SearchGame[];
}

export interface DownloadFromSearchResponse {
  success: boolean;
  message: string;
  id: string;
  name: string;
  position?: number;
  queued: boolean;
}

/**
 * Busca jogos no bot do Telegram
 */
export async function searchGames(
  searchTerm: string,
  jwtToken?: string
): Promise<SearchGame[]> {
  const token = jwtToken || localStorage.getItem("auth_token");
  if (!token) {
    throw new Error("Token de autenticação não encontrado");
  }

  const response = await fetchBackend("/bridge/search-games", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ searchTerm }),
  });

  const data: SearchGamesResponse = await response.json();
  if (!data.success) {
    throw new Error("Erro ao buscar jogos");
  }

  return data.games;
}

/**
 * Faz download de um jogo específico via Telegram
 */
export async function downloadFromSearch(
  command: string,
  gameName: string,
  jwtToken?: string
): Promise<DownloadFromSearchResponse> {
  const token = jwtToken || localStorage.getItem("auth_token");
  if (!token) {
    throw new Error("Token de autenticação não encontrado");
  }

  const response = await fetchBackend("/bridge/download-from-search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ command, gameName }),
  });

  // 1. INTERCEPTAÇÃO ESTRATÉGICA DO 409 (Duplicata)
  if (response.status === 409) {
    let errorMessage = "Este jogo já existe no sistema.";
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Se não conseguir ler JSON, usa mensagem padrão
    }
    // Lança um erro tipado que a UI pode identificar
    throw new DuplicateGameError(errorMessage);
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(
      errorData.error || `Erro ${response.status}: ${response.statusText}`
    );
  }

  const data: DownloadFromSearchResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Erro ao iniciar download");
  }

  return data;
}

export async function cancelDownload(
  downloadId: string,
  jwtToken: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetchBackend(`/bridge/cancel/${downloadId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  return response.json();
}
