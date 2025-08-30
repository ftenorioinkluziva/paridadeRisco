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
        date: z.date().optional(),
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

      const currentPositions = new Map<string, number>();
      for (const transaction of transactions) {
        const current = currentPositions.get(transaction.ativoId) || 0;
        const shares = Number(transaction.shares);
        const newShares = transaction.type === TransactionType.COMPRA ? current + shares : current - shares;
        currentPositions.set(transaction.ativoId, newShares);
      }

      // Calculate target positions
      const rebalanceSuggestions = [];
      
      for (const ativoEmCesta of cesta.ativos) {
        const { ativo, targetPercentage } = ativoEmCesta;
        const currentPrice = Number(ativo.dadosHistoricos[0]?.price || 0);
        
        if (currentPrice === 0) {
          continue; // Skip assets without current price
        }

        const targetValue = (input.targetAmount * Number(targetPercentage)) / 100;
        const targetShares = Math.floor(targetValue / currentPrice);
        const currentShares = currentPositions.get(ativo.id) || 0;
        const shareDifference = targetShares - currentShares;

        if (Math.abs(shareDifference) > 0) {
          rebalanceSuggestions.push({
            ativo: {
              id: ativo.id,
              ticker: ativo.ticker,
              name: ativo.name,
              currentPrice,
            },
            currentShares,
            targetShares,
            shareDifference,
            action: shareDifference > 0 ? TransactionType.COMPRA : TransactionType.VENDA,
            estimatedCost: Math.abs(shareDifference * currentPrice),
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
        currentCashBalance: Number(portfolio.cashBalance),
        totalEstimatedCost,
        cashAfterRebalance: Number(portfolio.cashBalance) - totalEstimatedCost + 
          rebalanceSuggestions.reduce((sum, suggestion) => 
            sum + (suggestion.action === TransactionType.VENDA ? suggestion.estimatedCost : 0), 0
          ),
        suggestions: rebalanceSuggestions,
      };
    }),
});