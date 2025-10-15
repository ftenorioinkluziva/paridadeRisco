import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const assetRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.ativo.findMany({
      orderBy: {
        ticker: "asc",
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await ctx.prisma.ativo.findUnique({
        where: {
          id: input.id,
        },
        include: {
          dadosHistoricos: {
            orderBy: {
              date: "desc",
            },
            take: 30, // Last 30 days of historical data
          },
        },
      });

      if (!asset) {
        throw new Error("Asset not found");
      }

      return asset;
    }),

  getHistory: publicProcedure
    .input(
      z.object({
        id: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(1000).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        ativoId: input.id,
      };

      if (input.startDate || input.endDate) {
        whereClause.date = {};
        if (input.startDate) {
          whereClause.date.gte = input.startDate;
        }
        if (input.endDate) {
          whereClause.date.lte = input.endDate;
        }
      }

      return await ctx.prisma.dadoHistorico.findMany({
        where: whereClause,
        orderBy: {
          date: "desc",
        },
        take: input.limit ?? 100,
        select: {
          id: true,
          date: true,
          price: true,
          percentageChange: true,
        },
      });
    }),

  getByTicker: publicProcedure
    .input(z.object({ ticker: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await ctx.prisma.ativo.findUnique({
        where: {
          ticker: input.ticker,
        },
        include: {
          dadosHistoricos: {
            orderBy: {
              date: "desc",
            },
            take: 1, // Most recent price
          },
        },
      });

      if (!asset) {
        throw new Error("Asset not found");
      }

      return asset;
    }),
});