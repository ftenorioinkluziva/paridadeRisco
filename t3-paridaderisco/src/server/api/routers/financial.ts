import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { FinancialDataFetcher } from "~/server/services/financialDataFetcher";
import { getFinancialScheduler } from "~/server/scheduler/financialUpdater";

export const financialRouter = createTRPCRouter({
  updateAllAssets: protectedProcedure
    .input(
      z.object({
        incremental: z.boolean().optional().default(true),
      }).optional(),
    )
    .mutation(async ({ input }) => {
      try {
        const fetcher = new FinancialDataFetcher();
        await fetcher.updateAllAssets(input?.incremental ?? true);
        
        return {
          success: true,
          message: "Dados financeiros atualizados com sucesso",
        };
      } catch (error) {
        console.error("Error updating financial data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar dados financeiros",
          cause: error,
        });
      }
    }),

  updateSpecificAsset: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const fetcher = new FinancialDataFetcher();
        await fetcher.updateSpecificAsset(input.ticker, input.startDate, input.endDate);
        
        return {
          success: true,
          message: `Dados para ${input.ticker} atualizados com sucesso`,
        };
      } catch (error) {
        console.error(`Error updating ${input.ticker}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao atualizar dados para ${input.ticker}`,
          cause: error,
        });
      }
    }),

  getAvailableAssets: protectedProcedure.query(async () => {
    const fetcher = new FinancialDataFetcher();
    const defaultAssets = [
      { ticker: 'BOVA11.SA', name: 'BOVA11 (Ibovespa)', type: 'ETF' },
      { ticker: 'XFIX11.SA', name: 'XFIX11 (IFIX)', type: 'ETF' },
      { ticker: 'IB5M11.SA', name: 'IB5M11 (IMAB5+)', type: 'ETF' },
      { ticker: 'B5P211.SA', name: 'B5P211 (IMAB5)', type: 'ETF' },
      { ticker: 'FIXA11.SA', name: 'FIXA11 (Pré)', type: 'ETF' },
      { ticker: 'USDBRL=X', name: 'USD/BRL (Dólar)', type: 'Currency' },
      { ticker: 'CDI', name: 'CDI', type: 'Index' },
      { ticker: 'IPCA', name: 'IPCA (Inflação)', type: 'Index' },
      { ticker: 'IPCA_EXP', name: 'IPCA Expectativa 12M', type: 'Index' },
    ];

    return defaultAssets;
  }),

  getLastUpdateInfo: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get last update dates for all assets
      const assets = await ctx.prisma.ativo.findMany({
        select: {
          ticker: true,
          name: true,
          dadosHistoricos: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { date: true },
          },
        },
      });

      return assets.map(asset => ({
        ticker: asset.ticker,
        name: asset.name,
        lastUpdate: asset.dadosHistoricos[0]?.date || null,
        isOutdated: asset.dadosHistoricos[0] 
          ? (new Date().getTime() - asset.dadosHistoricos[0].date.getTime()) > (24 * 60 * 60 * 1000) // More than 24 hours
          : true,
      }));
    } catch (error) {
      console.error("Error getting last update info:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar informações de atualização",
        cause: error,
      });
    }
  }),

  getSchedulerStatus: protectedProcedure.query(async () => {
    try {
      const scheduler = getFinancialScheduler();
      return scheduler.getStatus();
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar status do agendador",
        cause: error,
      });
    }
  }),

  startScheduler: protectedProcedure.mutation(async () => {
    try {
      const scheduler = getFinancialScheduler();
      scheduler.start();
      return {
        success: true,
        message: "Agendador iniciado com sucesso",
      };
    } catch (error) {
      console.error("Error starting scheduler:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao iniciar agendador",
        cause: error,
      });
    }
  }),

  stopScheduler: protectedProcedure.mutation(async () => {
    try {
      const scheduler = getFinancialScheduler();
      scheduler.stop();
      return {
        success: true,
        message: "Agendador parado com sucesso",
      };
    } catch (error) {
      console.error("Error stopping scheduler:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao parar agendador",
        cause: error,
      });
    }
  }),
});