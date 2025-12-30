/**
 * Torrent Service
 * Gerencia downloads de torrents usando WebTorrent
 */

export interface DownloadState {
  id: string;
  name: string;
  phase: "queued" | "downloading" | "uploading" | "done" | "error" | "paused" | "cancelled";
  downloadPercent: number;
  uploadPercent: number;
  downloadSpeed: string;
  uploadSpeed: string;
  downloaded: string;
  uploaded: string;
  eta: string;
  peers: number;
  error?: string;
  startedAt: string;
}

export interface TorrentQueue {
  id: string;
  name: string;
  source: "magnet" | "torrent-file";
  addedAt: string;
}

// Simulação de estado global
let activeDownloads: Map<string, DownloadState> = new Map();
let downloadQueue: TorrentQueue[] = [];
let maxConcurrentDownloads = 1;

/**
 * Adiciona um torrent à fila de download
 */
export function queueTorrent(id: string, name: string, source: "magnet" | "torrent-file" = "torrent-file"): DownloadState {
  const download: DownloadState = {
    id,
    name,
    phase: "queued",
    downloadPercent: 0,
    uploadPercent: 0,
    downloadSpeed: "-- MB/s",
    uploadSpeed: "-- MB/s",
    downloaded: "0 MB",
    uploaded: "0 MB",
    eta: "--:--",
    peers: 0,
    startedAt: new Date().toISOString(),
  };

  activeDownloads.set(id, download);
  downloadQueue.push({
    id,
    name,
    source,
    addedAt: new Date().toISOString(),
  });

  return download;
}

/**
 * Obtém o estado de um download
 */
export function getDownloadState(id: string): DownloadState | undefined {
  return activeDownloads.get(id);
}

/**
 * Obtém todos os downloads ativos
 */
export function getActiveDownloads(): DownloadState[] {
  return Array.from(activeDownloads.values()).filter(
    (d) => d.phase !== "done" && d.phase !== "error" && d.phase !== "cancelled"
  );
}

/**
 * Obtém a fila de downloads
 */
export function getDownloadQueue(): TorrentQueue[] {
  return downloadQueue;
}

/**
 * Atualiza o progresso de um download
 */
export function updateDownloadProgress(
  id: string,
  progress: {
    downloadPercent?: number;
    uploadPercent?: number;
    downloadSpeed?: string;
    uploadSpeed?: string;
    downloaded?: string;
    uploaded?: string;
    eta?: string;
    peers?: number;
    phase?: DownloadState["phase"];
  }
): void {
  const download = activeDownloads.get(id);
  if (download) {
    Object.assign(download, progress);
  }
}

/**
 * Pausa um download
 */
export function pauseDownload(id: string): boolean {
  const download = activeDownloads.get(id);
  if (download && download.phase === "downloading") {
    download.phase = "paused";
    return true;
  }
  return false;
}

/**
 * Retoma um download
 */
export function resumeDownload(id: string): boolean {
  const download = activeDownloads.get(id);
  if (download && download.phase === "paused") {
    download.phase = "downloading";
    return true;
  }
  return false;
}

/**
 * Cancela um download
 */
export function cancelDownload(id: string): boolean {
  const download = activeDownloads.get(id);
  if (download) {
    download.phase = "cancelled";
    downloadQueue = downloadQueue.filter((q) => q.id !== id);
    return true;
  }
  return false;
}

/**
 * Marca um download como concluído
 */
export function completeDownload(id: string): void {
  const download = activeDownloads.get(id);
  if (download) {
    download.phase = "done";
    download.downloadPercent = 100;
    download.uploadPercent = 100;
  }
}

/**
 * Marca um download com erro
 */
export function errorDownload(id: string, error: string): void {
  const download = activeDownloads.get(id);
  if (download) {
    download.phase = "error";
    download.error = error;
  }
}

/**
 * Remove um download do histórico ativo
 */
export function removeDownload(id: string): void {
  activeDownloads.delete(id);
  downloadQueue = downloadQueue.filter((q) => q.id !== id);
}

/**
 * Define o limite de downloads simultâneos
 */
export function setMaxConcurrentDownloads(limit: number): void {
  maxConcurrentDownloads = Math.max(1, Math.min(limit, 10));
}

/**
 * Obtém o limite de downloads simultâneos
 */
export function getMaxConcurrentDownloads(): number {
  return maxConcurrentDownloads;
}

/**
 * Obtém o número de downloads ativos
 */
export function getActiveDownloadCount(): number {
  return getActiveDownloads().length;
}

/**
 * Verifica se pode iniciar um novo download
 */
export function canStartNewDownload(): boolean {
  return getActiveDownloadCount() < maxConcurrentDownloads;
}
