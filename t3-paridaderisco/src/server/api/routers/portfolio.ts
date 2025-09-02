import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TransactionType } from "@prisma/client";

export const portfolioRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx.session;

    // Get or create portfolio
    let portfolio = await ctx.prisma.portfolio.findUnique({
      where: { userId },
    });

    if (!portfolio) {
      portfolio = await ctx.prisma.portfolio.create({
        data: {
          userId,
          cashBalance: 0,
        },
      });
    }

    // Get current positions by calculating transactions
    const transactions = await ctx.prisma.transacao.findMany({
      where: { userId },
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
      orderBy: { date: "asc" },
    });

    // Calculate current positions
    const positionsMap = new Map<string, {
      ativo: any;
      shares: number;
      averagePrice: number;
      currentPrice: number;
      currentValue: number;
      totalCost: number;
      unrealizedGain: number;
    }>();

    for (const transaction of transactions) {
      const key = transaction.ativoId;
      const existing = positionsMap.get(key);
      const shares = Number(transaction.shares);
      const pricePerShare = Number(transaction.pricePerShare);
      const currentPrice = Number(transaction.ativo.dadosHistoricos[0]?.price || 0);

      if (!existing) {
        const totalShares = transaction.type === TransactionType.COMPRA ? shares : -shares;
        if (totalShares !== 0) {
          positionsMap.set(key, {
            ativo: transaction.ativo,
            shares: totalShares,
            averagePrice: pricePerShare,
            currentPrice,
            currentValue: totalShares * currentPrice,
            totalCost: totalShares > 0 ? totalShares * pricePerShare : 0,
            unrealizedGain: totalShares * (currentPrice - pricePerShare),
          });
        }
      } else {
        const newShares = transaction.type === TransactionType.COMPRA 
          ? existing.shares + shares
          : existing.shares - shares;

        if (newShares === 0) {
          positionsMap.delete(key);
        } else if (newShares > 0) {
          const newTotalCost = transaction.type === TransactionType.COMPRA
            ? existing.totalCost + (shares * pricePerShare)
            : existing.totalCost - (shares * existing.averagePrice);
          
          const newAveragePrice = newTotalCost / newShares;

          positionsMap.set(key, {
            ...existing,
            shares: newShares,
            averagePrice: newAveragePrice,
            currentValue: newShares * currentPrice,
            totalCost: newTotalCost,
            unrealizedGain: newShares * (currentPrice - newAveragePrice),
          });
        } else {
          // newShares < 0 - Venda excedeu posição atual, zerar posição
          positionsMap.delete(key);
        }
      }
    }

    const positions = Array.from(positionsMap.values());
    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0) + Number(portfolio.cashBalance);

    return {
      id: portfolio.id,
      cashBalance: portfolio.cashBalance,
      totalValue,
      positions,
    };
  }),

  addTransaction: protectedProcedure
    .input(
      z.object({
        ativoId: z.string(),
        type: z.nativeEnum(TransactionType),
        shares: z.number().positive(),
        pricePerShare: z.number().positive(),
        date: z.union([z.date(), z.string()]).optional().transform((val) => {
          if (!val) return new Date();
          if (typeof val === 'string') return new Date(val);
          return val;
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

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

      // Create transaction
      const transaction = await ctx.prisma.transacao.create({
        data: {
          userId,
          ativoId: input.ativoId,
          type: input.type,
          shares: input.shares,
          pricePerShare: input.pricePerShare,
          date: input.date || new Date(),
        },
        include: {
          ativo: true,
        },
      });

      // Update portfolio cash balance
      const totalCost = input.shares * input.pricePerShare;
      const cashChange = input.type === TransactionType.COMPRA ? -totalCost : totalCost;

      await ctx.prisma.portfolio.upsert({
        where: { userId },
        create: {
          userId,
          cashBalance: cashChange,
        },
        update: {
          cashBalance: {
            increment: cashChange,
          },
        },
      });

      return transaction;
    }),

  listTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        ativoId: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      const where: any = { userId };
      if (input?.ativoId) {
        where.ativoId = input.ativoId;
      }

      return await ctx.prisma.transacao.findMany({
        where,
        include: {
          ativo: true,
        },
        orderBy: {
          date: "desc",
        },
        take: input?.limit ?? 20,
        skip: input?.offset ?? 0,
      });
    }),

  getRebalancePlan: protectedProcedure
    .input(
      z.object({
        cestaId: z.string(),
        targetAmount: z.number().positive(),
        includeCashInBase: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Get target basket
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

      // Get current portfolio
      const portfolio = await ctx.prisma.portfolio.findUnique({
        where: { userId },
      });

      if (!portfolio) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Portfolio not found",
        });
      }

      // Calculate current positions (simplified for rebalancing)
      const transactions = await ctx.prisma.transacao.findMany({
        where: { userId },
        include: { ativo: true },
      });

      // Get funds associated with indices
      const fundos = await ctx.prisma.fundoInvestimento.findMany({
        where: { 
          userId,
          indiceId: { not: null },
        },
        include: { 
          indice: {
            include: {
              dadosHistoricos: {
                orderBy: { date: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      const currentPositions = new Map<string, number>();
      
      // Calculate positions from direct stock transactions
      for (const transaction of transactions) {
        const current = currentPositions.get(transaction.ativoId) || 0;
        const shares = Number(transaction.shares);
        const newShares = transaction.type === TransactionType.COMPRA ? current + shares : current - shares;
        currentPositions.set(transaction.ativoId, newShares);
      }

      // Add fund values as equivalent positions in their associated indices
      for (const fundo of fundos) {
        if (fundo.indice) {
          const currentPrice = Number(fundo.indice.dadosHistoricos[0]?.price || 0);
          if (currentPrice > 0) {
            const equivalentShares = Number(fundo.currentValue) / currentPrice;
            const current = currentPositions.get(fundo.indiceId!) || 0;
            currentPositions.set(fundo.indiceId!, current + equivalentShares);
          }
        }
      }

      // Calculate current portfolio value
      let currentInvestedValue = 0;
      const currentPositionValues = new Map<string, number>();
      
      // Calculate stock positions value
      for (const [ativoId, shares] of currentPositions.entries()) {
        if (shares > 0) {
          const ativo = await ctx.prisma.ativo.findUnique({
            where: { id: ativoId },
            include: {
              dadosHistoricos: {
                orderBy: { date: "desc" },
                take: 1,
              },
            },
          });
          
          if (ativo && ativo.dadosHistoricos[0]) {
            const currentPrice = Number(ativo.dadosHistoricos[0].price);
            const positionValue = shares * currentPrice;
            currentInvestedValue += positionValue;
            currentPositionValues.set(ativoId, positionValue);
          }
        }
      }
      
      // Calculate base value for rebalancing (with or without cash)
      const cashBalance = Number(portfolio.cashBalance);
      const currentPortfolioValue = input.includeCashInBase 
        ? currentInvestedValue + cashBalance
        : currentInvestedValue;

      // Calculate target positions based on current portfolio value
      const rebalanceSuggestions = [];
      
      for (const ativoEmCesta of cesta.ativos) {
        const { ativo, targetPercentage } = ativoEmCesta;
        const currentPrice = Number(ativo.dadosHistoricos[0]?.price || 0);
        
        if (currentPrice === 0) {
          continue; // Skip assets without current price
        }

        const currentValue = currentPositionValues.get(ativo.id) || 0;
        const targetValue = (currentPortfolioValue * Number(targetPercentage)) / 100;
        const currentPercent = currentInvestedValue > 0 ? (currentValue / currentInvestedValue) * 100 : 0;
        const targetShares = Math.floor(targetValue / currentPrice);
        const currentShares = currentPositions.get(ativo.id) || 0;
        const shareDifference = targetShares - currentShares;
        const valueDifference = targetValue - currentValue;

        // Only suggest rebalancing if difference is significant (> 1% or > R$ 100)
        if (Math.abs(shareDifference) > 0 && (Math.abs(currentPercent - Number(targetPercentage)) > 1 || Math.abs(valueDifference) > 100)) {
          rebalanceSuggestions.push({
            ativo: {
              id: ativo.id,
              ticker: ativo.ticker,
              name: ativo.name,
              currentPrice,
            },
            currentShares,
            currentValue,
            currentPercent,
            targetShares,
            targetValue,
            shareDifference,
            valueDifference,
            action: shareDifference > 0 ? TransactionType.COMPRA : TransactionType.VENDA,
            estimatedCost: Math.abs(valueDifference),
            targetPercentage: Number(targetPercentage),
          });
        }
      }

      const totalEstimatedCost = rebalanceSuggestions.reduce(
        (sum, suggestion) => sum + (suggestion.action === TransactionType.COMPRA ? suggestion.estimatedCost : 0),
        0
      );

      return {
        cestaId: input.cestaId,
        cestaName: cesta.name,
        targetAmount: input.targetAmount,
        currentInvestedValue,
        currentPortfolioValue,
        includeCashInBase: input.includeCashInBase,
        currentCashBalance: cashBalance,
        totalEstimatedCost,
        cashAfterRebalance: cashBalance - totalEstimatedCost + 
          rebalanceSuggestions.reduce((sum, suggestion) => 
            sum + (suggestion.action === TransactionType.VENDA ? suggestion.estimatedCost : 0), 0
          ),
        suggestions: rebalanceSuggestions,
      };
    }),

  updateCashBalance: protectedProcedure
    .input(
      z.object({
        cashBalance: z.number().min(0, "Saldo deve ser positivo"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Update or create portfolio with new cash balance
      const portfolio = await ctx.prisma.portfolio.upsert({
        where: { userId },
        create: {
          userId,
          cashBalance: input.cashBalance,
        },
        update: {
          cashBalance: input.cashBalance,
        },
      });

      return {
        id: portfolio.id,
        cashBalance: Number(portfolio.cashBalance),
        success: true,
      };
    }),
});