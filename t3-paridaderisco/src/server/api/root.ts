import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { assetRouter } from "~/server/api/routers/asset";
import { portfolioRouter } from "~/server/api/routers/portfolio";
import { cestaRouter } from "~/server/api/routers/cesta";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  asset: assetRouter,
  portfolio: portfolioRouter,
  cesta: cestaRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;