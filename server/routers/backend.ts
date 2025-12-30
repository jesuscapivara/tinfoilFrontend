/**
 * Router tRPC para integração com o backend lojaTinfoil
 * Este router faz proxy das chamadas para o backend Express separado
 */

import { router, protectedProcedure } from "../_core/trpc";
import {
  getBackendGames,
  getBackendIndexingStatus,
  getBackendHealth,
  refreshBackendIndex,
  getBackendGamesViaBridge,
  type BackendApiResponse,
  type BackendIndexingStatus,
  type BackendHealth,
} from "../services/backendService";
import { getUserById } from "../db";

export const backendRouter = router({
  /**
   * Obtém a lista de jogos do backend
   * Usa as credenciais Tinfoil do usuário logado
   */
  getGames: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.tinfoilUser || !user.tinfoilPass) {
      throw new Error("Tinfoil credentials not configured for this user");
    }

    return await getBackendGames(user.tinfoilUser, user.tinfoilPass);
  }),

  /**
   * Obtém o status de indexação do backend
   */
  getIndexingStatus: protectedProcedure.query(async (): Promise<BackendIndexingStatus> => {
    return await getBackendIndexingStatus();
  }),

  /**
   * Obtém o status de saúde do backend
   */
  getHealth: protectedProcedure.query(async (): Promise<BackendHealth> => {
    return await getBackendHealth();
  }),

  /**
   * Força uma nova indexação no backend
   * Apenas para admins
   */
  refreshIndex: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Only admins can refresh the index");
    }

    const user = await getUserById(ctx.user.id);
    if (!user || !user.tinfoilUser || !user.tinfoilPass) {
      throw new Error("Admin Tinfoil credentials not configured");
    }

    const result = await refreshBackendIndex(user.tinfoilUser, user.tinfoilPass);
    return { success: true, message: result };
  }),

  /**
   * Obtém jogos via bridge (para dashboard)
   * Usa autenticação JWT do frontend
   */
  getGamesViaBridge: protectedProcedure.query(async ({ ctx }) => {
    // O backend espera um JWT válido no header Authorization
    // Por enquanto, vamos usar as credenciais Tinfoil do usuário
    // Em produção, você pode querer usar um token JWT compartilhado
    const user = await getUserById(ctx.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Nota: O endpoint /bridge/games do backend espera um JWT válido
    // Você pode precisar ajustar o backend para aceitar o token do frontend
    // ou criar um token compartilhado entre os dois sistemas
    return await getBackendGamesViaBridge(ctx.user.id.toString());
  }),
});

