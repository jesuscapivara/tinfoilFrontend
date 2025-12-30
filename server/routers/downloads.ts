import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDownloadHistory, saveDownloadHistory, getGameCache } from "../db";

export const downloadsRouter = router({
  // Get download history
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return await getDownloadHistory(input?.limit || 50);
    }),

  // Get active downloads status (will be connected to WebTorrent service)
  getStatus: protectedProcedure.query(async () => {
    // This will be populated by the torrent service
    return {
      active: [],
      queue: [],
      completed: [],
    };
  }),

  // Get game cache
  getGameCache: protectedProcedure.query(async () => {
    return await getGameCache();
  }),

  // Cancel a download (admin only)
  cancelDownload: protectedProcedure
    .input(z.object({ downloadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can cancel downloads");
      }

      // This will be connected to the torrent service
      return { success: true, message: "Download cancelled" };
    }),

  // Get download statistics
  getStats: protectedProcedure.query(async () => {
    const history = await getDownloadHistory(100);
    const totalDownloads = history.length;
    const totalSize = history.reduce((acc, h) => {
      const sizeStr = h.size || "0 MB";
      const num = parseFloat(sizeStr);
      return acc + num;
    }, 0);

    return {
      totalDownloads,
      totalSize: `${totalSize.toFixed(2)} MB`,
      lastDownload: history[0]?.completedAt || null,
    };
  }),
});
