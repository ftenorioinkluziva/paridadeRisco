import { tool } from 'ai';
import { z } from 'zod';
import { findRelevantContent, formatSearchResults } from './similarity';
import { prisma } from '~/lib/prisma';
import { NotificationType, NotificationPriority, TransactionType } from '@prisma/client';

/**
 * Tool: getInformation
 * Busca informações relevantes na base de conhecimento
 */
export const getInformationTool = tool({
  description: `Busca informações na base de conhecimento sobre investimentos, paridade de risco, estratégias e cenários econômicos.
  Use esta ferramenta SEMPRE que precisar de informações específicas sobre metodologia, ativos ou estratégias.`,
  inputSchema: z.object({
    question: z.string().describe('A pergunta ou tópico sobre o qual você precisa de informações'),
    category: z.enum([
      'STRATEGY',
      'MARKET_ANALYSIS',
      'INVESTMENT_GUIDE',
      'RISK_PARITY',
      'ASSET_INFO',
      'ECONOMIC_SCENARIO',
    ]).optional().describe('Categoria específica para filtrar a busca (opcional)'),
  }),
  execute: async (args) => {
    try {
      const { question, category } = args as { question?: string; category?: string };

      if (!question || typeof question !== 'string') {
        return {
          success: false,
          message: 'Pergunta inválida ou não fornecida.',
          results: [],
        };
      }

      const results = await findRelevantContent(question, {
        limit: 4,
        similarityThreshold: 0.5,
        category,
      });

      if (results.length === 0) {
        return {
          success: false,
          message: 'Nenhuma informação relevante encontrada na base de conhecimento sobre este tópico.',
          results: [],
        };
      }

      return {
        success: true,
        message: `Encontradas ${results.length} fontes relevantes:`,
        results: results.map(r => ({
          title: r.resource.title,
          category: r.resource.category,
          content: r.content,
          similarity: Math.round(r.similarity * 100),
        })),
        formattedText: formatSearchResults(results),
      };
    } catch (error) {
      console.error('Error in getInformation tool:', error);
      return {
        success: false,
        message: 'Erro ao buscar informações na base de conhecimento.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Tool: getPortfolioData
 * Obtém dados do portfólio do usuário
 */
export const getPortfolioDataTool = tool({
  description: `Obtém os dados reais do portfólio do usuário, incluindo posições, valores, alocações e saldo de caixa.
  Use esta ferramenta quando precisar analisar a carteira atual do usuário.`,
  inputSchema: z.object({
    userId: z.string().describe('ID do usuário'),
  }),
  execute: async ({ userId }) => {
    try {
      // Buscar portfólio
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
      });

      if (!portfolio) {
        return {
          success: false,
          message: 'Portfólio não encontrado para este usuário.',
        };
      }

      // Buscar transações e calcular posições
      const transactions = await prisma.transacao.findMany({
        where: { userId },
        include: {
          ativo: {
            include: {
              dadosHistoricos: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { date: 'asc' },
      });

      // Calcular posições atuais
      const positionsMap = new Map<string, {
        ticker: string;
        name: string;
        type: string;
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
          if (totalShares > 0) {
            positionsMap.set(key, {
              ticker: transaction.ativo.ticker,
              name: transaction.ativo.name,
              type: transaction.ativo.type,
              shares: totalShares,
              averagePrice: pricePerShare,
              currentPrice,
              currentValue: totalShares * currentPrice,
              totalCost: totalShares * pricePerShare,
              unrealizedGain: totalShares * (currentPrice - pricePerShare),
            });
          }
        } else {
          const newShares = transaction.type === TransactionType.COMPRA
            ? existing.shares + shares
            : existing.shares - shares;

          if (newShares > 0) {
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
            positionsMap.delete(key);
          }
        }
      }

      const positions = Array.from(positionsMap.values());
      const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
      const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
      const cashBalance = Number(portfolio.cashBalance);

      // Buscar fundos
      const funds = await prisma.fundoInvestimento.findMany({
        where: { userId },
        include: {
          indice: true,
        },
      });

      const fundsValue = funds.reduce((sum, fund) => sum + Number(fund.currentValue), 0);
      const fundsInitialInvestment = funds.reduce((sum, fund) => sum + Number(fund.initialInvestment), 0);

      return {
        success: true,
        portfolio: {
          cashBalance,
          totalPositionsValue: totalValue,
          totalFundsValue: fundsValue,
          totalValue: totalValue + fundsValue + cashBalance,
          totalCost,
          totalGain: (totalValue - totalCost) + (fundsValue - fundsInitialInvestment),
          positions: positions.map(p => ({
            ticker: p.ticker,
            name: p.name,
            type: p.type,
            shares: p.shares,
            currentValue: p.currentValue,
            unrealizedGain: p.unrealizedGain,
            allocation: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0,
          })),
          funds: funds.map(f => ({
            name: f.name,
            currentValue: Number(f.currentValue),
            initialInvestment: Number(f.initialInvestment),
            gain: Number(f.currentValue) - Number(f.initialInvestment),
            linkedTo: f.indice?.ticker || null,
          })),
        },
      };
    } catch (error) {
      console.error('Error in getPortfolioData tool:', error);
      return {
        success: false,
        message: 'Erro ao buscar dados do portfólio.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Tool: getPortfolioMetrics
 * Obtém métricas de performance do portfólio
 */
export const getPortfolioMetricsTool = tool({
  description: `Obtém métricas de performance do portfólio, incluindo Risk Balance Score, ganho/perda percentual e valores agregados.
  Use quando precisar avaliar a saúde geral do portfólio.`,
  inputSchema: z.object({
    userId: z.string().describe('ID do usuário'),
  }),
  execute: async ({ userId }) => {
    try {
      // Buscar usuário e cesta selecionada
      console.log('[Tools Debug] getPortfolioMetrics executing for:', userId);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { selectedBasketId: true },
      });

      // Buscar portfólio
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
      });

      if (!portfolio) {
        return {
          success: false,
          message: 'Portfólio não encontrado.',
        };
      }

      // Buscar transações para calcular posições
      const transactions = await prisma.transacao.findMany({
        where: { userId },
        include: {
          ativo: {
            include: {
              dadosHistoricos: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { date: 'asc' },
      });

      // Calcular métricas básicas (simplificado)
      const positionsMap = new Map();
      for (const transaction of transactions) {
        const existing = positionsMap.get(transaction.ativoId);
        const shares = Number(transaction.shares);
        const pricePerShare = Number(transaction.pricePerShare);
        const currentPrice = Number(transaction.ativo.dadosHistoricos[0]?.price || 0);

        if (!existing) {
          const totalShares = transaction.type === TransactionType.COMPRA ? shares : -shares;
          if (totalShares > 0) {
            positionsMap.set(transaction.ativoId, {
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

            positionsMap.set(transaction.ativoId, {
              shares: newShares,
              currentPrice,
              currentValue: newShares * currentPrice,
              totalCost: newTotalCost,
              ativoId: transaction.ativoId,
            });
          } else {
            positionsMap.delete(transaction.ativoId);
          }
        }
      }

      const positions = Array.from(positionsMap.values());
      const positionsValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
      const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
      const cashBalance = Number(portfolio.cashBalance);

      // Buscar stats de fundos
      const fundStats = await prisma.fundoInvestimento.aggregate({
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

      // Calcular Risk Balance Score (simplificado - usar 100 se não tiver cesta)
      let riskBalanceScore = 100;

      if (user?.selectedBasketId) {
        const basket = await prisma.cesta.findUnique({
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
          const allocationBase = positionsValue + fundsValue;

          if (allocationBase > 0) {
            let totalWeightedScore = 0;
            let totalWeight = 0;

            for (const allocation of basket.ativos) {
              const targetPercent = Number(allocation.targetPercentage);
              const position = positions.find(p => p.ativoId === allocation.ativoId);
              const currentValue = position?.currentValue || 0;
              const currentPercent = (currentValue / allocationBase) * 100;

              const ratio = targetPercent > 0 ? (currentPercent / targetPercent) * 100 : 0;

              let assetScore = 0;
              if (ratio >= 90 && ratio <= 110) {
                assetScore = 100;
              } else if (ratio < 90) {
                assetScore = Math.max(0, (ratio / 90) * 100);
              } else {
                const overAllocPenalty = Math.min(100, ((ratio - 110) / 90) * 100);
                assetScore = Math.max(0, 100 - overAllocPenalty);
              }

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

            riskBalanceScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 100;
          }
        }
      }

      return {
        success: true,
        metrics: {
          totalValue,
          totalGain,
          totalGainPercent: Math.round(totalGainPercent * 100) / 100,
          riskBalanceScore: Math.round(riskBalanceScore),
          cashBalance,
          positionsValue,
          fundsValue,
          hasSelectedBasket: !!user?.selectedBasketId,
        },
      };
    } catch (error) {
      console.error('Error in getPortfolioMetrics tool:', error);
      return {
        success: false,
        message: 'Erro ao calcular métricas do portfólio.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Tool: createNotification
 * Cria uma notificação para o usuário
 */
export const createNotificationTool = tool({
  description: `Cria uma notificação para o usuário quando você identificar insights importantes, oportunidades ou riscos.
  Use quando encontrar desbalanceamentos significativos ou insights acionáveis.`,
  inputSchema: z.object({
    userId: z.string().describe('ID do usuário'),
    title: z.string().describe('Título curto e chamativo da notificação'),
    message: z.string().describe('Mensagem detalhada explicando o insight ou alerta'),
    type: z.enum(['INSIGHT', 'WARNING', 'OPPORTUNITY', 'REBALANCE']).describe('Tipo da notificação'),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).describe('Prioridade da notificação'),
    metadata: z.any().optional().describe('Dados adicionais em JSON (opcional)'),
  }),
  execute: async ({ userId, title, message, type, priority, metadata }) => {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: type as NotificationType,
          priority: priority as NotificationPriority,
          metadata: metadata || null,
        },
      });

      return {
        success: true,
        message: 'Notificação criada com sucesso',
        notificationId: notification.id,
      };
    } catch (error) {
      console.error('Error in createNotification tool:', error);
      return {
        success: false,
        message: 'Erro ao criar notificação.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Exportar todos os tools como um objeto
 */
export const agentTools = {
  getInformation: getInformationTool,
  getPortfolioData: getPortfolioDataTool,
  getPortfolioMetrics: getPortfolioMetricsTool,
  createNotification: createNotificationTool,
};
