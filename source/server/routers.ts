import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const spotWrite = z.object({
  name: z.string().min(1).max(200),
  area: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  note: z.string().min(1),
  lat: z.string().min(1),
  lng: z.string().min(1),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  spots: router({
    list: publicProcedure.query(() => db.listPublicSpots()),
    create: publicProcedure.input(spotWrite).mutation(async ({ ctx, input }) => {
      return db.createSpot({
        ...input,
        ownerUserId: ctx.user?.id ?? null,
      });
    }),
    mine: protectedProcedure.query(({ ctx }) => db.listOwnedSpots(ctx.user.id)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          name: z.string().min(1).max(200),
          area: z.string().min(1).max(200),
          category: z.string().min(1).max(100),
          note: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...patch } = input;
        await db.updateOwnedSpot(ctx.user.id, id, patch);
        return { success: true } as const;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteOwnedSpot(ctx.user.id, input.id);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
