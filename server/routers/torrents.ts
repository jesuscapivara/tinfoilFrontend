import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { saveDownloadHistory, getGameCache, addOrUpdateGame } from "../db";

// Simulação de estado de downloads (será substituído por WebTorrent real)
let activeDownloads: Record<string, any> = {};
let downloadQueue: any[] = [];

export const torrentsRouter = router({
  // Upload de arquivo torrent
  uploadTorrent: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can upload torrents");
      }

      // Validação básica do arquivo
      if (!input.fileName.endsWith(".torrent")) {
        throw new Error("Only .torrent files are allowed");
      }

      // Aqui seria feita a integração com WebTorrent
      // Por enquanto, apenas registra a tentativa
      const downloadId = `download_${Date.now()}`;

      activeDownloads[downloadId] = {
        id: downloadId,
        name: input.fileName,
        phase: "queued",
        downloadPercent: 0,
        uploadPercent: 0,
        startedAt: new Date().toISOString(),
        addedAt: new Date().toISOString(),
      };

      downloadQueue.push({
        id: downloadId,
        name: input.fileName,
        addedAt: new Date().toISOString(),
      });

      return {
        success: true,
        downloadId,
        message: "Torrent queued for download",
      };
    }),

  // Obter status dos downloads ativos
  getActiveDownloads: protectedProcedure.query(async () => {
    return {
      active: Object.values(activeDownloads).filter((d) => d.phase !== "done" && d.phase !== "error"),
      queue: downloadQueue,
      completed: [],
    };
  }),

  // Cancelar um download
  cancelDownload: protectedProcedure
    .input(z.object({ downloadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can cancel downloads");
      }

      if (activeDownloads[input.downloadId]) {
        activeDownloads[input.downloadId].phase = "cancelled";
        downloadQueue = downloadQueue.filter((d) => d.id !== input.downloadId);
      }

      return { success: true };
    }),

  // Pausar um download
  pauseDownload: protectedProcedure
    .input(z.object({ downloadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can pause downloads");
      }

      if (activeDownloads[input.downloadId]) {
        activeDownloads[input.downloadId].phase = "paused";
      }

      return { success: true };
    }),

  // Retomar um download
  resumeDownload: protectedProcedure
    .input(z.object({ downloadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can resume downloads");
      }

      if (activeDownloads[input.downloadId]) {
        activeDownloads[input.downloadId].phase = "downloading";
      }

      return { success: true };
    }),

  // Obter detalhes de um download específico
  getDownloadDetails: protectedProcedure
    .input(z.object({ downloadId: z.string() }))
    .query(async ({ input }) => {
      return activeDownloads[input.downloadId] || null;
    }),

  // Obter cache de jogos indexados
  getIndexedGames: protectedProcedure.query(async () => {
    return await getGameCache();
  }),

  // Configurar limite de downloads simultâneos
  setMaxConcurrentDownloads: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(10) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can change settings");
      }

      // Seria armazenado em um banco de dados ou cache
      return {
        success: true,
        maxConcurrent: input.limit,
      };
    }),
});
