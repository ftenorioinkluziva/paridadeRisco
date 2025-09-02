import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { subDays, format } from "date-fns";

// Tipos para os dados de charts
const TimeRangeSchema = z.enum(["30d", "90d", "365d", "1y", "3y", "5y", "custom"]);

const ChartDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  percentageChange: z.number().optional(),
});

export const chartsRouter = createTRPCRouter({
  /**
   * Busca dados históricos de um ativo para gráfico temporal
   */
  getTimeSeriesData: publicProcedure
    .input(
      z.object({
        assetId: z.string(),
        timeRange: TimeRangeSchema.default("365d"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        normalized: z.boolean().default(false), // Se true, normaliza para retorno %
      }),
    )
    .query(async ({ ctx, input }) => {
      const { assetId, timeRange, startDate, endDate, normalized } = input;

      console.log(`=== FETCHING REAL TIME SERIES DATA FOR ASSET ${assetId} ===`);

      // Calcular datas baseado no timeRange
      let calculatedStartDate: Date;
      let calculatedEndDate = endDate || new Date();

      if (startDate) {
        calculatedStartDate = startDate;
      } else {
        const daysMap = {
          "30d": 30,
          "90d": 90,
          "365d": 365,
          "1y": 365,
          "3y": 365 * 3,
          "5y": 365 * 5,
          "custom": 365, // fallback
        };
        calculatedStartDate = subDays(calculatedEndDate, daysMap[timeRange]);
      }

      // Buscar dados históricos do banco
      const historicalData = await ctx.prisma.dadoHistorico.findMany({
        where: {
          ativoId: assetId,
          date: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
        },
        orderBy: {
          date: "asc",
        },
        include: {
          ativo: {
            select: {
              id: true,
              ticker: true,
              name: true,
              type: true,
            },
          },
        },
      });

      console.log(`Found ${historicalData.length} historical data points`);

      if (historicalData.length === 0) {
        return {
          data: [],
          asset: null,
          period: { startDate: calculatedStartDate, endDate: calculatedEndDate },
          isNormalized: normalized,
        };
      }

      // Verificar se há dados e asset válido
      const asset = historicalData[0]?.ativo;
      if (!asset) {
        console.warn(`Asset data not found for assetId: ${assetId}`);
        return {
          data: [],
          asset: null,
          period: { startDate: calculatedStartDate, endDate: calculatedEndDate },
          isNormalized: normalized,
        };
      }

      // Processar dados para o gráfico
      const basePrice = historicalData[0]?.price?.toNumber() || 0;
      
      const chartData = historicalData.map((point) => {
        const price = point.price?.toNumber() || 0;
        const percentageChange = point.percentageChange?.toNumber() || 0;
        
        // Calcular valor normalizado se solicitado
        const value = normalized && basePrice > 0
          ? ((price - basePrice) / basePrice) * 100
          : price;

        return {
          date: format(point.date, "yyyy-MM-dd"),
          value,
          percentageChange,
          rawPrice: price,
        };
      });

      return {
        data: chartData,
        asset,
        period: { 
          startDate: calculatedStartDate, 
          endDate: calculatedEndDate 
        },
        isNormalized: normalized,
      };
    }),

  /**
   * Busca dados para comparação de múltiplos ativos
   */
  getMultiAssetComparison: publicProcedure
    .input(
      z.object({
        assetIds: z.array(z.string()),
        timeRange: TimeRangeSchema.default("365d"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { assetIds, timeRange, startDate, endDate } = input;

      if (assetIds.length === 0) {
        return { 
          data: [], 
          period: { 
            startDate: new Date(), 
            endDate: new Date() 
          }
        };
      }

      // Calcular período
      let calculatedStartDate: Date;
      let calculatedEndDate = endDate || new Date();

      if (startDate) {
        calculatedStartDate = startDate;
      } else {
        const daysMap = {
          "30d": 30,
          "90d": 90,
          "365d": 365,
          "1y": 365,
          "3y": 365 * 3,
          "5y": 365 * 5,
          "custom": 365,
        };
        calculatedStartDate = subDays(calculatedEndDate, daysMap[timeRange]);
      }

      console.log(`=== FETCHING REAL MULTI-ASSET DATA FOR ${assetIds.length} ASSETS ===`);

      // Buscar dados para todos os ativos
      const allData = await Promise.all(
        assetIds.map(async (assetId) => {
          const historicalData = await ctx.prisma.dadoHistorico.findMany({
            where: {
              ativoId: assetId,
              date: {
                gte: calculatedStartDate,
                lte: calculatedEndDate,
              },
            },
            orderBy: {
              date: "asc",
            },
            include: {
              ativo: {
                select: {
                  id: true,
                  ticker: true,
                  name: true,
                  type: true,
                },
              },
            },
          });

          if (historicalData.length === 0) {
            console.warn(`No historical data found for asset: ${assetId}`);
            return null;
          }

          const basePrice = historicalData[0]?.price?.toNumber() || 0;
          
          const asset = historicalData[0]?.ativo;
          if (!asset) {
            console.warn(`Asset data not found for assetId: ${assetId}`);
            return null;
          }

          console.log(`Found ${historicalData.length} data points for ${asset.ticker}`);

          return {
            assetId,
            asset,
            data: historicalData.map((point) => {
              const price = point.price?.toNumber() || 0;
              const normalizedReturn = basePrice > 0
                ? ((price - basePrice) / basePrice) * 100
                : 0;

              return {
                date: format(point.date, "yyyy-MM-dd"),
                value: normalizedReturn,
                rawPrice: price,
              };
            }),
          };
        }),
      );

      // Filtrar dados válidos e com asset válido
      const validData = allData.filter((item): item is NonNullable<typeof item> => {
        if (!item) return false;
        
        try {
          return Boolean(item.asset && item.data && item.data.length > 0);
        } catch (error) {
          console.warn("Error filtering item:", error, "Item:", item);
          return false;
        }
      });

      return {
        data: validData,
        period: { 
          startDate: calculatedStartDate, 
          endDate: calculatedEndDate 
        },
      };
    }),

  /**
   * Lista todos os ativos disponíveis para gráficos
   */
  getAvailableAssets: publicProcedure
    .query(async ({ ctx }) => {
      console.log("=== FETCHING REAL ASSETS FROM DATABASE ===");
      
      const assets = await ctx.prisma.ativo.findMany({
        select: {
          id: true,
          ticker: true,
          name: true,
          type: true,
          _count: {
            select: {
              dadosHistoricos: true,
            },
          },
        },
        where: {
          dadosHistoricos: {
            some: {}, // Apenas ativos que tenham pelo menos 1 dado histórico
          },
        },
        orderBy: [
          { type: "asc" },
          { ticker: "asc" },
        ],
      });

      console.log(`Found ${assets.length} assets with historical data`);
      return assets;
    }),

  /**
   * Estatísticas básicas de um ativo
   */
  getAssetStats: publicProcedure
    .input(
      z.object({
        assetId: z.string(),
        timeRange: TimeRangeSchema.default("365d"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { assetId, timeRange } = input;

      // Calcular período
      const daysMap = {
        "30d": 30,
        "90d": 90,
        "365d": 365,
        "1y": 365,
        "3y": 365 * 3,
        "5y": 365 * 5,
        "custom": 365,
      };
      
      const startDate = subDays(new Date(), daysMap[timeRange]);

      const data = await ctx.prisma.dadoHistorico.findMany({
        where: {
          ativoId: assetId,
          date: {
            gte: startDate,
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      if (data.length < 2) {
        return null;
      }

      const prices = data.map(d => d.price?.toNumber() || 0);
      const firstPrice = prices[0] || 0;
      const lastPrice = prices[prices.length - 1] || 0;
      
      // Calcular estatísticas básicas
      const totalReturn = firstPrice > 0 
        ? ((lastPrice - firstPrice) / firstPrice) * 100 
        : 0;
      
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      return {
        totalReturn,
        maxPrice,
        minPrice,
        avgPrice,
        dataPoints: data.length,
        period: { startDate, endDate: new Date() },
      };
    }),
});