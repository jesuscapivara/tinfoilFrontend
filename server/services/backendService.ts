/**
 * Serviço para comunicação com o backend lojaTinfoil
 * Este serviço faz chamadas HTTP para o backend Express separado
 */

import { ENV } from "../_core/env";

const BACKEND_URL = ENV.backendApiUrl;

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
 * Faz uma requisição autenticada ao backend
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
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

/**
 * Obtém a lista de jogos do backend
 * Requer autenticação Tinfoil
 */
export async function getBackendGames(
  tinfoilUser?: string,
  tinfoilPass?: string
): Promise<BackendApiResponse> {
  const headers: HeadersInit = {};
  
  // Adiciona autenticação Basic Auth se fornecida
  if (tinfoilUser && tinfoilPass) {
    const credentials = Buffer.from(`${tinfoilUser}:${tinfoilPass}`).toString("base64");
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
 * Requer autenticação
 */
export async function refreshBackendIndex(
  tinfoilUser?: string,
  tinfoilPass?: string
): Promise<string> {
  const headers: HeadersInit = {};
  
  if (tinfoilUser && tinfoilPass) {
    const credentials = Buffer.from(`${tinfoilUser}:${tinfoilPass}`).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  const response = await fetchBackend("/refresh", {
    method: "GET",
    headers,
  });

  return response.text();
}

/**
 * Obtém dados do usuário do backend (via bridge)
 * Requer autenticação JWT do frontend
 */
export async function getBackendUserData(
  frontendJwt: string
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
      Authorization: `Bearer ${frontendJwt}`,
    },
  });

  return response.json();
}

/**
 * Obtém jogos via bridge (para dashboard)
 * Requer autenticação JWT do frontend
 */
export async function getBackendGamesViaBridge(
  frontendJwt: string
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
  const response = await fetchBackend("/bridge/games", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${frontendJwt}`,
    },
  });

  return response.json();
}

