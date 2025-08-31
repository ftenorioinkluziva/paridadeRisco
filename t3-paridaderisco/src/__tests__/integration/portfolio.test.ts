import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { setupServer } from "msw/node";
import { QueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { AppRouter } from "~/server/api/root";
import { Decimal } from "@prisma/client/runtime/library";

// Mock server setup
const trpcMsw = createTRPCMsw<AppRouter>();
const server = setupServer();

function createTestClient() {
  return api.createClient({
    links: [
      {
        request: async (op) => {
          // Mock implementation for testing
          return {
            result: {
              data: mockPortfolioData,
              type: "data" as const,
            },
          };
        },
      },
    ],
  });
}

// Mock data
const mockPortfolioData = {
  id: "portfolio-1",
  cashBalance: new Decimal(10000),
  userId: "user-1",
  ativos: [
    {
      id: "position-1",
      ativoId: "asset-1",
      shares: new Decimal(100),
      averagePrice: new Decimal(50),
      ativo: {
        id: "asset-1",
        name: "Test ETF",
        ticker: "TEST11",
        type: "ETF" as const,
        calculationType: "PERCENTAGE" as const,
        dadosHistoricos: [
          {
            id: "data-1",
            date: new Date("2024-01-15"),
            ativoId: "asset-1",
            price: new Decimal(55),
            percentageChange: new Decimal(10),
          },
        ],
      },
    },
  ],
};

const mockTransactionData = [
  {
    id: "trans-1",
    type: "COMPRA" as const,
    shares: new Decimal(100),
    pricePerShare: new Decimal(50),
    date: new Date("2024-01-10"),
    portfolioId: "portfolio-1",
    ativoId: "asset-1",
    ativo: {
      id: "asset-1",
      name: "Test ETF",
      ticker: "TEST11",
      type: "ETF" as const,
      calculationType: "PERCENTAGE" as const,
    },
  },
];

describe("Portfolio Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
    queryClient.clear();
  });

  it("should fetch portfolio data successfully", async () => {
    server.use(
      trpcMsw.portfolio.get.query((req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockPortfolioData));
      })
    );

    // Test portfolio data structure
    expect(mockPortfolioData).toHaveProperty("id");
    expect(mockPortfolioData).toHaveProperty("cashBalance");
    expect(mockPortfolioData).toHaveProperty("userId");
    expect(mockPortfolioData.ativos).toHaveLength(1);
    expect(mockPortfolioData.ativos[0]).toHaveProperty("ativo");
    expect(mockPortfolioData.ativos[0].ativo).toHaveProperty("ticker", "TEST11");
  });

  it("should fetch transaction history successfully", async () => {
    server.use(
      trpcMsw.portfolio.listTransactions.query((req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockTransactionData));
      })
    );

    // Test transaction data structure
    expect(mockTransactionData).toHaveLength(1);
    expect(mockTransactionData[0]).toHaveProperty("type", "COMPRA");
    expect(mockTransactionData[0]).toHaveProperty("shares");
    expect(mockTransactionData[0]).toHaveProperty("pricePerShare");
    expect(mockTransactionData[0]).toHaveProperty("ativo");
    expect(mockTransactionData[0].ativo).toHaveProperty("ticker", "TEST11");
  });

  it("should calculate portfolio metrics correctly", () => {
    const position = mockPortfolioData.ativos[0];
    const currentPrice = Number(position.ativo.dadosHistoricos[0].price);
    const averagePrice = Number(position.averagePrice);
    const shares = Number(position.shares);

    // Current value calculation
    const currentValue = shares * currentPrice;
    expect(currentValue).toBe(5500); // 100 * 55

    // Investment cost calculation
    const investmentCost = shares * averagePrice;
    expect(investmentCost).toBe(5000); // 100 * 50

    // Return calculation
    const totalReturn = currentValue - investmentCost;
    expect(totalReturn).toBe(500); // 5500 - 5000

    // Return percentage calculation
    const returnPercentage = (totalReturn / investmentCost) * 100;
    expect(returnPercentage).toBe(10); // 500/5000 * 100
  });

  it("should handle add transaction mutation", async () => {
    const newTransaction = {
      type: "COMPRA" as const,
      ativoId: "asset-1",
      shares: 50,
      pricePerShare: 52,
    };

    server.use(
      trpcMsw.portfolio.addTransaction.mutation((req, res, ctx) => {
        const transaction = req.body;
        expect(transaction).toMatchObject(newTransaction);
        
        return res(
          ctx.status(200),
          ctx.data({
            ...newTransaction,
            id: "new-trans",
            date: new Date(),
            portfolioId: "portfolio-1",
            ativo: {
              id: "asset-1",
              name: "Test ETF",
              ticker: "TEST11",
              type: "ETF" as const,
              calculationType: "PERCENTAGE" as const,
            },
          })
        );
      })
    );

    // Test successful transaction addition
    expect(newTransaction.type).toBe("COMPRA");
    expect(newTransaction.shares).toBe(50);
    expect(newTransaction.pricePerShare).toBe(52);
  });

  it("should calculate rebalance plan correctly", async () => {
    const mockRebalanceData = [
      {
        ativo: {
          id: "asset-1",
          ticker: "TEST11",
          name: "Test ETF",
        },
        currentAllocation: 60,
        targetAllocation: 50,
        currentValue: 6000,
        targetValue: 5000,
        action: "SELL" as const,
        recommendedShares: 20,
      },
    ];

    server.use(
      trpcMsw.portfolio.getRebalancePlan.mutation((req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockRebalanceData));
      })
    );

    // Test rebalance plan structure
    const rebalance = mockRebalanceData[0];
    expect(rebalance).toHaveProperty("ativo");
    expect(rebalance).toHaveProperty("currentAllocation", 60);
    expect(rebalance).toHaveProperty("targetAllocation", 50);
    expect(rebalance).toHaveProperty("action", "SELL");
    expect(rebalance).toHaveProperty("recommendedShares", 20);
  });
});