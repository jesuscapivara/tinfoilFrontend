import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { downloadsRouter } from "./routers/downloads";
import { torrentsRouter } from "./routers/torrents";
import { backendRouter } from "./routers/backend";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  downloads: downloadsRouter,
  torrents: torrentsRouter,
  backend: backendRouter,
});

export type AppRouter = typeof appRouter;
