/**
 * Cliente HTTP para comunicação com o backend lojaTinfoil
 */

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
 * Faz uma requisição ao backend
 */
async function fetchBackend(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

/**
 * Obtém a lista de jogos do backend
 */
export async function getBackendGames(
  tinfoilUser?: string,
  tinfoilPass?: string
): Promise<BackendApiResponse> {
  const headers: HeadersInit = {};
  
  if (tinfoilUser && tinfoilPass) {
    const credentials = btoa(`${tinfoilUser}:${tinfoilPass}`);
    headers.Authorization = `Basic ${credentials}`;
  }

  const response = await fetchBackend("/api", {
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
  const headers: HeadersInit = {};
  
  if (tinfoilUser && tinfoilPass) {
    const credentials = btoa(`${tinfoilUser}:${tinfoilPass}`);
    headers.Authorization = `Basic ${credentials}`;
  }

  const response = await fetchBackend("/refresh", {
    method: "GET",
    headers,
  });

  return response.text();
}

