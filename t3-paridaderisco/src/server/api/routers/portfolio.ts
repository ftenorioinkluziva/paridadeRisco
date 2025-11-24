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
        // Calculate currentPercent using the same base as targetPercentage
        const currentPercent = currentPortfolioValue > 0 ? (currentValue / currentPortfolioValue) * 100 : 0;
        // Use precise calculation for target shares (don't floor for crypto)
        const targetShares = targetValue / currentPrice;
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
              type: ativo.type,
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

  // Get portfolio evolution over time
  getPortfolioEvolution: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "year", "all"]).default("all"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Get all transactions ordered by date
      const transactions = await ctx.prisma.transacao.findMany({
        where: { userId },
        include: {
          ativo: {
            include: {
              dadosHistoricos: true,
            },
          },
        },
        orderBy: { date: "asc" },
      });

      if (transactions.length === 0) {
        return {
          data: [],
          currentValue: 0,
          initialDate: null,
        };
      }

      // Get investment funds
      const fundos = await ctx.prisma.fundoInvestimento.findMany({
        where: { userId },
      });

      // Get current portfolio
      const portfolio = await ctx.prisma.portfolio.findUnique({
        where: { userId },
      });

      const currentCash = Number(portfolio?.cashBalance || 0);

      // Determine date range
      const firstTransactionDate = transactions[0]!.date;
      const today = new Date();

      let startDate = firstTransactionDate;
      const period = input?.period || "all";

      if (period === "week") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
      } else if (period === "month") {
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
      } else if (period === "year") {
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
      }

      // Filter transactions based on period
      const filteredTransactions = transactions.filter(t => t.date >= startDate);

      // Create a map of dates to calculate portfolio value
      const dateMap = new Map<string, number>();

      // Calculate portfolio value for each day from first transaction to today
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0]!;

        // Calculate portfolio value at this date
        let portfolioValue = 0;

        // 1. Calculate value of stock positions at this date
        const positionsAtDate = new Map<string, { shares: number; ativoId: string }>();

        // Process all transactions up to this date
        for (const transaction of transactions) {
          if (transaction.date <= currentDate) {
            const existing = positionsAtDate.get(transaction.ativoId);
            const shares = Number(transaction.shares);

            if (!existing) {
              const totalShares = transaction.type === TransactionType.COMPRA ? shares : -shares;
              if (totalShares > 0) {
                positionsAtDate.set(transaction.ativoId, {
                  shares: totalShares,
                  ativoId: transaction.ativoId,
                });
              }
            } else {
              const newShares = transaction.type === TransactionType.COMPRA
                ? existing.shares + shares
                : existing.shares - shares;

              if (newShares > 0) {
                positionsAtDate.set(transaction.ativoId, {
                  shares: newShares,
                  ativoId: transaction.ativoId,
                });
              } else {
                positionsAtDate.delete(transaction.ativoId);
              }
            }
          }
        }

        // Get price for each position at this date
        for (const [ativoId, position] of positionsAtDate.entries()) {
          const ativo = transactions.find(t => t.ativoId === ativoId)?.ativo;
          if (ativo) {
            // Find the closest historical price at or before this date
            const historicalPrice = ativo.dadosHistoricos
              .filter(h => h.date <= currentDate)
              .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

            if (historicalPrice) {
              const price = Number(historicalPrice.price);
              portfolioValue += position.shares * price;
            }
          }
        }

        // 2. Add value of investment funds
        // For simplicity, we'll use a linear interpolation between initial and current value
        for (const fundo of fundos) {
          if (fundo.investmentDate <= currentDate) {
            const daysSinceInvestment = Math.floor((currentDate.getTime() - fundo.investmentDate.getTime()) / (1000 * 60 * 60 * 24));
            const totalDays = Math.floor((today.getTime() - fundo.investmentDate.getTime()) / (1000 * 60 * 60 * 24));

            if (totalDays > 0) {
              const progress = daysSinceInvestment / totalDays;
              const initialValue = Number(fundo.initialInvestment);
              const currentValue = Number(fundo.currentValue);
              const estimatedValue = initialValue + (currentValue - initialValue) * progress;
              portfolioValue += estimatedValue;
            } else {
              portfolioValue += Number(fundo.initialInvestment);
            }
          }
        }

        // 3. For now, don't include cash in historical calculations
        // Cash balance tracking was added later and doesn't have historical data
        // Only add current cash if we're at today
        if (dateStr === today.toISOString().split('T')[0]) {
          portfolioValue += currentCash;
        }

        dateMap.set(dateStr, portfolioValue);

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Convert map to array and sort by date
      const evolutionData = Array.from(dateMap.entries())
        .map(([date, value]) => ({
          date,
          value, // Keep actual value, even if 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Get current total value
      const currentValue = evolutionData[evolutionData.length - 1]?.value || 0;

      return {
        data: evolutionData,
        currentValue,
        initialDate: firstTransactionDate,
      };
    }),

  // Get portfolio metrics including risk balance score
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx.session;

    // Get user's selected basket
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { selectedBasketId: true },
    });

    // Get portfolio data
    const portfolio = await ctx.prisma.portfolio.findUnique({
      where: { userId },
    });

    if (!portfolio) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Portfolio not found",
      });
    }

    // Get transactions to calculate positions
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

    // Calculate positions
    const positionsMap = new Map<string, { shares: number; currentPrice: number; currentValue: number; totalCost: number; ativoId: string }>();

    for (const transaction of transactions) {
      const key = transaction.ativoId;
      const existing = positionsMap.get(key);
      const shares = Number(transaction.shares);
      const pricePerShare = Number(transaction.pricePerShare);
      const currentPrice = Number(transaction.ativo.dadosHistoricos[0]?.price || 0);

      if (!existing) {
        const totalShares = transaction.type === TransactionType.COMPRA ? shares : -shares;
        if (totalShares > 0) {
          positionsMap.set(key, {
            shares: totalShares,
            currentPrice,
            currentValue: totalShares * currentPrice,
            totalCost: totalShares * pricePerShare,
            ativoId: transaction.ativoId,
          });
        }
      } else {
        const newShares = transaction.type === TransactionType.COMPRA
          ? existing.shares + shares
          : existing.shares - shares;

        if (newShares > 0) {
          const newTotalCost = transaction.type === TransactionType.COMPRA
            ? existing.totalCost + (shares * pricePerShare)
            : existing.totalCost - (shares * (existing.totalCost / existing.shares));

          positionsMap.set(key, {
            shares: newShares,
            currentPrice,
            currentValue: newShares * currentPrice,
            totalCost: newTotalCost,
            ativoId: transaction.ativoId,
          });
        } else {
          positionsMap.delete(key);
        }
      }
    }

    const positions = Array.from(positionsMap.values());

    // Calculate total value
    const positionsValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
    const cashBalance = Number(portfolio.cashBalance);

    // Get fund stats
    const fundStats = await ctx.prisma.fundoInvestimento.aggregate({
      where: { userId },
      _sum: {
        currentValue: true,
        initialInvestment: true,
      },
    });

    const fundsValue = Number(fundStats._sum.currentValue || 0);
    const fundsInitialInvestment = Number(fundStats._sum.initialInvestment || 0);

    const totalValue = positionsValue + fundsValue + cashBalance;
    const totalInvested = totalCost + fundsInitialInvestment;
    const totalGain = (positionsValue - totalCost) + (fundsValue - fundsInitialInvestment);
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // Calculate Risk Balance Score
    let riskBalanceScore = 100; // Default 100% if no basket selected

    if (user?.selectedBasketId) {
      const basket = await ctx.prisma.cesta.findUnique({
        where: { id: user.selectedBasketId },
        include: {
          ativos: {
            include: {
              ativo: true,
            },
          },
        },
      });

      if (basket && basket.ativos.length > 0) {
        // Calculate current allocation percentages
        const allocationBase = positionsValue + fundsValue;

        if (allocationBase > 0) {
          let totalWeightedScore = 0;
          let totalWeight = 0;

          for (const allocation of basket.ativos) {
            const targetPercent = Number(allocation.targetPercentage);
            const position = positions.find(p => p.ativoId === allocation.ativoId);
            const currentValue = position?.currentValue || 0;
            const currentPercent = (currentValue / allocationBase) * 100;

            // Calculate ratio: current / target (in percentage terms)
            const ratio = targetPercent > 0 ? (currentPercent / targetPercent) * 100 : 0;

            // Calculate balance score for this asset (0-100)
            let assetScore = 0;

            if (ratio >= 90 && ratio <= 110) {
              // Perfect balance zone (90%-110% of target)
              assetScore = 100;
            } else if (ratio < 90) {
              // Under-allocated: linear penalty from 90% down to 0%
              // At 90% = 100 points, at 0% = 0 points
              assetScore = Math.max(0, (ratio / 90) * 100);
            } else {
              // Over-allocated: linear penalty from 110% up
              // At 110% = 100 points, at 200% = 0 points, beyond 200% = 0 points
              const overAllocPenalty = Math.min(100, ((ratio - 110) / 90) * 100);
              assetScore = Math.max(0, 100 - overAllocPenalty);
            }

            // Weight: larger targets have exponentially more impact
            // Target >= 10%: weight = target^1.5 (high priority)
            // Target 5-10%: weight = target^1.2 (medium priority)
            // Target < 5%: weight = target (normal priority)
            let weight;
            if (targetPercent >= 10) {
              weight = Math.pow(targetPercent, 1.5);
            } else if (targetPercent >= 5) {
              weight = Math.pow(targetPercent, 1.2);
            } else {
              weight = targetPercent;
            }

            totalWeightedScore += assetScore * weight;
            totalWeight += weight;
          }

          // Calculate final weighted average score
          riskBalanceScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 100;
        }
      }
    }

    return {
      totalValue,
      totalGain,
      totalGainPercent,
      riskBalanceScore: Math.round(riskBalanceScore),
      cashBalance,
      positionsValue,
      fundsValue,
    };
  }),
});