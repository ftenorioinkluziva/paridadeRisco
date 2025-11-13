import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  type PerformancePeriod,
  type BasketPerformance,
  type AssetReturn,
  type EvolutionPoint,
  type BenchmarkComparison,
  getPeriodDates,
  calculateAnnualizedReturn,
  getDaysBetween,
  findClosestPrice,
  calculateAssetReturn,
  calculateVolatility,
  calculateSharpeRatio,
  calculatePeriodicReturns,
  groupByMonth,
} from "~/lib/utils/basketPerformance";

export const cestaRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx.session;

    return await ctx.prisma.cesta.findMany({
      where: { userId },
      include: {
        ativos: {
          include: {
            ativo: {
              include: {
                dadosHistoricos: {
                  orderBy: { date: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      const cesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          ativos: {
            include: {
              ativo: {
                include: {
                  dadosHistoricos: {
                    orderBy: { date: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!cesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // Calculate total target percentage to validate basket
      const totalPercentage = cesta.ativos.reduce(
        (sum, ativoEmCesta) => sum + Number(ativoEmCesta.targetPercentage),
        0
      );

      return {
        ...cesta,
        totalPercentage,
        isValid: Math.abs(totalPercentage - 100) < 0.01, // Allow for small floating point errors
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        ativos: z.array(
          z.object({
            ativoId: z.string(),
            targetPercentage: z.number().min(0).max(100),
          }),
        ).optional().default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Validate that total percentages add up to 100% (only if assets are provided)
      if (input.ativos && input.ativos.length > 0) {
        const totalPercentage = input.ativos.reduce((sum, ativo) => sum + ativo.targetPercentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Target percentages must add up to 100%. Current total: ${totalPercentage}%`,
          });
        }
      }

      // Validate that all assets exist (only if assets are provided)
      if (input.ativos && input.ativos.length > 0) {
        const ativoIds = input.ativos.map(a => a.ativoId);
        const existingAtivos = await ctx.prisma.ativo.findMany({
          where: {
            id: {
              in: ativoIds,
            },
          },
          select: { id: true },
        });

        if (existingAtivos.length !== ativoIds.length) {
          const existingIds = new Set(existingAtivos.map(a => a.id));
          const missingIds = ativoIds.filter(id => !existingIds.has(id));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid asset IDs: ${missingIds.join(", ")}`,
          });
        }

        // Check for duplicate asset IDs
        const uniqueIds = new Set(ativoIds);
        if (uniqueIds.size !== ativoIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Duplicate assets are not allowed in a basket",
          });
        }
      }

      // Create the basket with atomic transaction
      const cesta = await ctx.prisma.$transaction(async (prisma) => {
        // Create the basket
        const newCesta = await prisma.cesta.create({
          data: {
            name: input.name,
            userId,
          },
        });

        // Create the asset allocations (only if assets are provided)
        if (input.ativos && input.ativos.length > 0) {
          await prisma.ativosEmCestas.createMany({
            data: input.ativos.map((ativo) => ({
              cestaId: newCesta.id,
              ativoId: ativo.ativoId,
              targetPercentage: ativo.targetPercentage,
            })),
          });
        }

        // Return the complete basket with its assets
        return await prisma.cesta.findUniqueOrThrow({
          where: { id: newCesta.id },
          include: {
            ativos: {
              include: {
                ativo: {
                  include: {
                    dadosHistoricos: {
                      orderBy: { date: "desc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        });
      });

      return cesta;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        ativos: z.array(
          z.object({
            ativoId: z.string(),
            targetPercentage: z.number().min(0).max(100),
          }),
        ).min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Verify basket exists and is owned by user
      const existingCesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingCesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // If updating assets, validate percentages and assets
      if (input.ativos) {
        const totalPercentage = input.ativos.reduce((sum, ativo) => sum + ativo.targetPercentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Target percentages must add up to 100%. Current total: ${totalPercentage}%`,
          });
        }

        const ativoIds = input.ativos.map(a => a.ativoId);
        const existingAtivos = await ctx.prisma.ativo.findMany({
          where: {
            id: { in: ativoIds },
          },
          select: { id: true },
        });

        if (existingAtivos.length !== ativoIds.length) {
          const existingIds = new Set(existingAtivos.map(a => a.id));
          const missingIds = ativoIds.filter(id => !existingIds.has(id));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid asset IDs: ${missingIds.join(", ")}`,
          });
        }

        const uniqueIds = new Set(ativoIds);
        if (uniqueIds.size !== ativoIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Duplicate assets are not allowed in a basket",
          });
        }
      }

      // Update basket with transaction
      const updatedCesta = await ctx.prisma.$transaction(async (prisma) => {
        // Update basket name if provided
        if (input.name) {
          await prisma.cesta.update({
            where: { id: input.id },
            data: { name: input.name },
          });
        }

        // Update assets if provided
        if (input.ativos) {
          // Delete existing asset allocations
          await prisma.ativosEmCestas.deleteMany({
            where: { cestaId: input.id },
          });

          // Create new asset allocations
          await prisma.ativosEmCestas.createMany({
            data: input.ativos.map((ativo) => ({
              cestaId: input.id,
              ativoId: ativo.ativoId,
              targetPercentage: ativo.targetPercentage,
            })),
          });
        }

        // Return updated basket
        return await prisma.cesta.findUniqueOrThrow({
          where: { id: input.id },
          include: {
            ativos: {
              include: {
                ativo: {
                  include: {
                    dadosHistoricos: {
                      orderBy: { date: "desc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        });
      });

      return updatedCesta;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Verify basket exists and is owned by user
      const existingCesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingCesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // Delete basket (cascading delete will handle AtivosEmCestas)
      await ctx.prisma.cesta.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  addAsset: protectedProcedure
    .input(
      z.object({
        cestaId: z.string(),
        ativoId: z.string(),
        targetPercentage: z.number().min(0.1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Verify basket exists and is owned by user
      const existingCesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.cestaId,
          userId,
        },
        include: {
          ativos: true,
        },
      });

      if (!existingCesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // Verify asset exists
      const asset = await ctx.prisma.ativo.findUnique({
        where: { id: input.ativoId },
      });

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      // Check if asset already exists in basket
      const existingAllocation = await ctx.prisma.ativosEmCestas.findFirst({
        where: {
          cestaId: input.cestaId,
          ativoId: input.ativoId,
        },
      });

      if (existingAllocation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Asset already exists in this basket",
        });
      }

      // Add asset to basket
      await ctx.prisma.ativosEmCestas.create({
        data: {
          cestaId: input.cestaId,
          ativoId: input.ativoId,
          targetPercentage: input.targetPercentage,
        },
      });

      // Return updated basket
      return await ctx.prisma.cesta.findUniqueOrThrow({
        where: { id: input.cestaId },
        include: {
          ativos: {
            include: {
              ativo: {
                include: {
                  dadosHistoricos: {
                    orderBy: { date: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
    }),

  removeAsset: protectedProcedure
    .input(
      z.object({
        cestaId: z.string(),
        ativoId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Verify basket exists and is owned by user
      const existingCesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.cestaId,
          userId,
        },
      });

      if (!existingCesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // Remove asset from basket
      await ctx.prisma.ativosEmCestas.deleteMany({
        where: {
          cestaId: input.cestaId,
          ativoId: input.ativoId,
        },
      });

      // Return updated basket
      return await ctx.prisma.cesta.findUniqueOrThrow({
        where: { id: input.cestaId },
        include: {
          ativos: {
            include: {
              ativo: {
                include: {
                  dadosHistoricos: {
                    orderBy: { date: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
    }),

  getPerformance: protectedProcedure
    .input(
      z.object({
        cestaId: z.string(),
        // Allow either predefined period or custom dates
        period: z.enum(['1M', '3M', '6M', '1Y', 'YTD', 'ALL']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).refine((data) => {
        // Must have either period OR both custom dates
        return data.period || (data.startDate && data.endDate);
      }, {
        message: "Must provide either period or both startDate and endDate"
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Verify basket exists and is owned by user
      const cesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.cestaId,
          userId,
        },
        include: {
          ativos: {
            include: {
              ativo: {
                include: {
                  dadosHistoricos: {
                    orderBy: { date: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      if (!cesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // Check if basket has assets
      if (!cesta.ativos || cesta.ativos.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Basket has no assets allocated",
        });
      }

      // Get period dates - either from predefined period or custom dates
      const periodDates = input.period
        ? getPeriodDates(input.period as PerformancePeriod)
        : {
            startDate: input.startDate!,
            endDate: input.endDate!,
            label: `${input.startDate!.toLocaleDateString('pt-BR')} - ${input.endDate!.toLocaleDateString('pt-BR')}`
          };

      // Calculate returns for each asset
      const assetReturns: AssetReturn[] = [];
      let hasInsufficientData = false;

      for (const allocation of cesta.ativos) {
        const { ativo } = allocation;
        const historicalData = ativo.dadosHistoricos;

        // Find prices closest to start and end dates
        const startPrice = findClosestPrice(historicalData, periodDates.startDate);
        const endPrice = findClosestPrice(historicalData, periodDates.endDate);

        if (startPrice === null || endPrice === null) {
          hasInsufficientData = true;
          continue;
        }

        const returnPercentage = calculateAssetReturn(startPrice, endPrice);
        const allocationPercent = Number(allocation.targetPercentage);
        const weightedReturn = (returnPercentage * allocationPercent) / 100;

        assetReturns.push({
          ativoId: ativo.id,
          ticker: ativo.ticker,
          startPrice,
          endPrice,
          returnPercentage,
          allocation: allocationPercent,
          weightedReturn,
        });
      }

      // Check if we have sufficient data
      if (assetReturns.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient historical data for the selected period",
        });
      }

      // Calculate basket performance
      const retornoPercentual = assetReturns.reduce(
        (sum, asset) => sum + asset.weightedReturn,
        0
      );

      // Calculate annualized return
      const days = getDaysBetween(periodDates.startDate, periodDates.endDate);
      const retornoAnualizado = calculateAnnualizedReturn(retornoPercentual, days);

      // Calculate values assuming R$ 10,000 initial investment
      const valorInicial = 10000;
      const valorFinal = valorInicial * (1 + retornoPercentual / 100);
      const ganhoAbsoluto = valorFinal - valorInicial;

      // ===== EVOLUTION & VOLATILITY CALCULATION =====

      // Get all unique dates from all assets in the period
      const allDatesSet = new Set<string>();
      for (const allocation of cesta.ativos) {
        for (const hist of allocation.ativo.dadosHistoricos) {
          if (hist.date >= periodDates.startDate && hist.date <= periodDates.endDate && hist.price) {
            allDatesSet.add(hist.date.toISOString().split('T')[0]!);
          }
        }
      }

      const sortedDates = Array.from(allDatesSet).sort();

      // Calculate basket value for each date
      const evolutionRaw: Array<{ date: Date; value: number }> = [];

      for (const dateStr of sortedDates) {
        const targetDate = new Date(dateStr);
        let basketValue = valorInicial;
        let hasAllPrices = true;

        for (const allocation of cesta.ativos) {
          const price = findClosestPrice(allocation.ativo.dadosHistoricos, targetDate);
          if (price === null) {
            hasAllPrices = false;
            break;
          }

          // Get initial price
          const initialPrice = findClosestPrice(allocation.ativo.dadosHistoricos, periodDates.startDate);
          if (initialPrice === null) {
            hasAllPrices = false;
            break;
          }

          // Calculate contribution
          const assetReturn = (price - initialPrice) / initialPrice;
          const allocationDecimal = Number(allocation.targetPercentage) / 100;
          basketValue += valorInicial * allocationDecimal * assetReturn;
        }

        if (hasAllPrices) {
          evolutionRaw.push({ date: targetDate, value: basketValue });
        }
      }

      // Group by month to reduce data points
      const evolutionGrouped = groupByMonth(evolutionRaw);

      // Calculate periodic returns for volatility
      const evolutionPrices = evolutionGrouped.map(e => e.value);
      const periodicReturns = calculatePeriodicReturns(evolutionPrices);
      const volatilidade = calculateVolatility(periodicReturns);

      // ===== FETCH BENCHMARK DATA (CDI, IPCA) =====

      const benchmarks: BenchmarkComparison[] = [];

      // Fetch CDI data
      const cdiAtivo = await ctx.prisma.ativo.findFirst({
        where: { ticker: 'CDI' },
        include: {
          dadosHistoricos: {
            where: {
              date: {
                gte: periodDates.startDate,
                lte: periodDates.endDate,
              },
            },
            orderBy: { date: 'asc' },
          },
        },
      });

      let cdiReturn = 0;
      if (cdiAtivo && cdiAtivo.dadosHistoricos.length > 0) {
        // CDI uses percentageChange (accumulated daily rates)
        // Sum all daily rates to get period return
        cdiReturn = cdiAtivo.dadosHistoricos.reduce(
          (sum, data) => sum + (data.percentageChange?.toNumber() || 0),
          0
        );
        benchmarks.push({
          nome: 'CDI',
          retorno: cdiReturn,
          diferenca: retornoPercentual - cdiReturn,
        });
      }

      // Fetch IPCA data
      const ipcaAtivo = await ctx.prisma.ativo.findFirst({
        where: { ticker: 'IPCA_EXP' },
        include: {
          dadosHistoricos: {
            where: {
              date: {
                gte: periodDates.startDate,
                lte: periodDates.endDate,
              },
            },
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

      if (ipcaAtivo && ipcaAtivo.dadosHistoricos.length > 0) {
        // IPCA_EXP has current expectation in price field
        const ipcaExpectation = ipcaAtivo.dadosHistoricos[0]?.price?.toNumber() || 0;
        const ipcaReturn = (ipcaExpectation * days) / 365; // Prorated for period
        benchmarks.push({
          nome: 'IPCA',
          retorno: ipcaReturn,
          diferenca: retornoPercentual - ipcaReturn,
        });
      }

      // ===== SHARPE RATIO CALCULATION =====

      // Use CDI as risk-free rate
      const riskFreeRate = cdiReturn;
      const sharpeRatio = calculateSharpeRatio(retornoPercentual, riskFreeRate, volatilidade);

      // ===== EVOLUTION WITH BENCHMARKS =====

      const evolucaoHistorica: EvolutionPoint[] = evolutionGrouped.map((point, index) => {
        let valorCDI: number | undefined;
        let valorIPCA: number | undefined;

        // Calculate CDI evolution if available
        if (cdiAtivo && evolutionRaw.length > 0) {
          const cdiDataUpToDate = cdiAtivo.dadosHistoricos.filter(d => d.date <= point.date);
          const cdiReturnUpToDate = cdiDataUpToDate.reduce(
            (sum, data) => sum + (data.percentageChange?.toNumber() || 0),
            0
          );
          valorCDI = valorInicial * (1 + cdiReturnUpToDate / 100);
        }

        // IPCA is an annual rate, approximate linear growth
        if (ipcaAtivo && ipcaAtivo.dadosHistoricos.length > 0) {
          const ipcaRate = ipcaAtivo.dadosHistoricos[0]?.price?.toNumber() || 0;
          const daysElapsed = getDaysBetween(periodDates.startDate, point.date);
          const ipcaReturnUpToDate = (ipcaRate * daysElapsed) / 365;
          valorIPCA = valorInicial * (1 + ipcaReturnUpToDate / 100);
        }

        return {
          date: point.date,
          valor: point.value,
          valorCDI,
          valorIPCA,
        };
      });

      const performance: BasketPerformance = {
        periodo: input.period as PerformancePeriod,
        periodoLabel: periodDates.label,
        retornoPercentual,
        retornoAnualizado,
        valorInicial,
        valorFinal,
        ganhoAbsoluto,
        ativosReturns: assetReturns,
        temDadosSuficientes: !hasInsufficientData,

        // New metrics
        volatilidade,
        sharpeRatio,
        evolucaoHistorica,
        benchmarks,
      };

      return performance;
    }),
});