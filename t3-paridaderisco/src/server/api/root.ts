import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { userRouter } from "~/server/api/routers/user";
import { assetRouter } from "~/server/api/routers/asset";
import { portfolioRouter } from "~/server/api/routers/portfolio";
import { cestaRouter } from "~/server/api/routers/cesta";
import { fundoRouter } from "~/server/api/routers/fundo";
import { financialRouter } from "~/server/api/routers/financial";
import { chartsRouter } from "~/server/api/routers/charts";
import { retirementRouter } from "~/server/api/routers/retirement";
import { knowledgeRouter } from "~/server/api/routers/knowledge";
import { notificationRouter } from "~/server/api/routers/notification";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  asset: assetRouter,
  portfolio: portfolioRouter,
  cesta: cestaRouter,
  fundo: fundoRouter,
  financial: financialRouter,
  charts: chartsRouter,
  retirement: retirementRouter,
  knowledge: knowledgeRouter,
  notification: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;