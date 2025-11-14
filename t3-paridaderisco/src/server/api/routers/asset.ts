import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { addPercentageChangeToData, convertPriceArrayToNumber } from "~/lib/utils/priceCalculations";

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

      const rawData = await ctx.prisma.dadoHistorico.findMany({
        where: whereClause,
        orderBy: {
          date: "asc", // Changed to asc for percentage calculation
        },
        take: input.limit ?? 100,
        select: {
          id: true,
          date: true,
          price: true,
        },
      });

      // Convert Decimal to number and calculate percentageChange dynamically
      const dataWithNumbers = convertPriceArrayToNumber(rawData);
      const dataWithPercentage = addPercentageChangeToData(dataWithNumbers);

      // Return in descending order (most recent first)
      return dataWithPercentage.reverse();
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