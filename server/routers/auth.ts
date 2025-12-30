import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getUserById, getPendingUsers, approveUser as approveUserDb, updateUserTinfoilCredentials } from "../db";
import { generateTinfoilCredentials } from "../services/tinfoilService";

export const authRouter = router({
  // Get current user info
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    const user = await getUserById(ctx.user.id);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved,
      tinfoilUser: user.tinfoilUser,
      tinfoilPass: user.tinfoilPass ? "••••••" : null,
      createdAt: user.createdAt,
    };
  }),

  // Get pending users (admin only)
  getPendingUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Only admins can view pending users");
    }

    return await getPendingUsers();
  }),

  // Approve a user (admin only)
  approveUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can approve users");
      }

      const user = await approveUserDb(input.userId);
      if (!user || !user.email) {
        throw new Error("User not found");
      }

      // Generate Tinfoil credentials
      const { tinfoilUser, tinfoilPass } = generateTinfoilCredentials(user.email);
      await updateUserTinfoilCredentials(input.userId, tinfoilUser, tinfoilPass);

      return {
        success: true,
        tinfoilUser,
        tinfoilPass,
      };
    }),

  // Regenerate Tinfoil credentials (user can regenerate their own)
  regenerateCredentials: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }

    const user = await getUserById(ctx.user.id);
    if (!user || !user.email) {
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      throw new Error("Admin credentials cannot be regenerated from here");
    }

    const { tinfoilUser, tinfoilPass } = generateTinfoilCredentials(user.email);
    await updateUserTinfoilCredentials(ctx.user.id, tinfoilUser, tinfoilPass);

    return {
      success: true,
      tinfoilUser,
      tinfoilPass,
    };
  }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = {
      maxAge: -1,
      secure: true,
      sameSite: "none" as const,
      httpOnly: true,
      path: "/",
    };
    ctx.res.clearCookie("auth_token", cookieOptions);
    return { success: true };
  }),
});
