import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/lib/prisma";
import { TransactionType } from "@prisma/client";

// Mock Prisma
vi.mock("~/lib/prisma", () => ({
  prisma: {
    portfolio: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    transacao: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    ativo: {
      findUnique: vi.fn(),
    },
    cesta: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock JWT verification to return a valid user session
vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn().mockReturnValue({ userId: "test-user-123" }),
  },
}));

vi.mock("~/env", () => ({
  env: {
    NEXTAUTH_SECRET: "test-secret",
  },
}));

const mockPrisma = vi.mocked(prisma);

describe("Portfolio Router", () => {
  let caller: any;
  const mockUserId = "test-user-123";

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const ctx = await createTRPCContext({
      req: {
        headers: { 
          get: vi.fn().mockImplementation((name: string) => {
            if (name === "authorization") return "Bearer valid-token";
            return null;
          }),
        },
      } as any,
      res: {} as any,
    });
    
    caller = appRouter.createCaller(ctx);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("should return existing portfolio with positions", async () => {
      const mockPortfolio = {
        id: "portfolio-1",
        userId: mockUserId,
        cashBalance: 5000,
      };

      const mockTransactions = [
        {
          id: "tx-1",
          type: TransactionType.COMPRA,
          shares: 10,
          pricePerShare: 100,
          ativoId: "asset-1",
          userId: mockUserId,
          ativo: {
            id: "asset-1",
            ticker: "BOVA11.SA",
            name: "BOVA11",
            dadosHistoricos: [{ price: 105 }],
          },
        },
      ];

      mockPrisma.portfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.transacao.findMany.mockResolvedValue(mockTransactions);

      const result = await caller.portfolio.get();

      expect(result).toEqual({
        id: "portfolio-1",
        cashBalance: 5000,
        totalValue: 6050, // 5000 cash + (10 shares * 105 price)
        positions: [
          {
            ativo: {
              id: "asset-1",
              ticker: "BOVA11.SA",
              name: "BOVA11",
              dadosHistoricos: [{ price: 105 }],
            },
            shares: 10,
            averagePrice: 100,
            currentPrice: 105,
            currentValue: 1050,
            totalCost: 1000,
            unrealizedGain: 50,
          },
        ],
      });

      expect(mockPrisma.portfolio.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it("should create new portfolio if none exists", async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue(null);
      mockPrisma.portfolio.create.mockResolvedValue({
        id: "new-portfolio",
        userId: mockUserId,
        cashBalance: 0,
      });
      mockPrisma.transacao.findMany.mockResolvedValue([]);

      const result = await caller.portfolio.get();

      expect(result).toEqual({
        id: "new-portfolio",
        cashBalance: 0,
        totalValue: 0,
        positions: [],
      });

      expect(mockPrisma.portfolio.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          cashBalance: 0,
        },
      });
    });

    it("should calculate positions correctly with multiple transactions", async () => {
      const mockPortfolio = {
        id: "portfolio-1",
        userId: mockUserId,
        cashBalance: 1000,
      };

      const mockTransactions = [
        {
          id: "tx-1",
          type: TransactionType.COMPRA,
          shares: 10,
          pricePerShare: 100,
          ativoId: "asset-1",
          userId: mockUserId,
          ativo: {
            id: "asset-1",
            ticker: "BOVA11.SA",
            name: "BOVA11",
            dadosHistoricos: [{ price: 110 }],
          },
        },
        {
          id: "tx-2",
          type: TransactionType.COMPRA,
          shares: 5,
          pricePerShare: 120,
          ativoId: "asset-1",
          userId: mockUserId,
          ativo: {
            id: "asset-1",
            ticker: "BOVA11.SA",
            name: "BOVA11",
            dadosHistoricos: [{ price: 110 }],
          },
        },
      ];

      mockPrisma.portfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.transacao.findMany.mockResolvedValue(mockTransactions);

      const result = await caller.portfolio.get();

      expect(result.positions).toHaveLength(1);
      expect(result.positions[0]).toEqual(
        expect.objectContaining({
          shares: 15, // 10 + 5
          averagePrice: expect.closeTo(106.67, 2), // (10*100 + 5*120) / 15
          currentValue: 1650, // 15 * 110
        })
      );
    });
  });

  describe("addTransaction", () => {
    it("should add a buy transaction and update portfolio", async () => {
      const mockAsset = {
        id: "asset-1",
        ticker: "BOVA11.SA",
        name: "BOVA11",
        type: "ETF",
        calculationType: "PRECO",
      };

      const mockTransaction = {
        id: "tx-1",
        userId: mockUserId,
        ativoId: "asset-1",
        type: TransactionType.COMPRA,
        shares: 10,
        pricePerShare: 100,
        date: new Date(),
        ativo: mockAsset,
      };

      mockPrisma.ativo.findUnique.mockResolvedValue(mockAsset);
      mockPrisma.transacao.create.mockResolvedValue(mockTransaction);
      mockPrisma.portfolio.upsert.mockResolvedValue({
        id: "portfolio-1",
        userId: mockUserId,
        cashBalance: -1000,
      });

      const result = await caller.portfolio.addTransaction({
        ativoId: "asset-1",
        type: TransactionType.COMPRA,
        shares: 10,
        pricePerShare: 100,
      });

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.portfolio.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: {
          userId: mockUserId,
          cashBalance: -1000,
        },
        update: {
          cashBalance: {
            increment: -1000,
          },
        },
      });
    });

    it("should add a sell transaction and update portfolio", async () => {
      const mockAsset = {
        id: "asset-1",
        ticker: "BOVA11.SA",
        name: "BOVA11",
        type: "ETF",
        calculationType: "PRECO",
      };

      const mockTransaction = {
        id: "tx-1",
        userId: mockUserId,
        ativoId: "asset-1",
        type: TransactionType.VENDA,
        shares: 5,
        pricePerShare: 110,
        date: new Date(),
        ativo: mockAsset,
      };

      mockPrisma.ativo.findUnique.mockResolvedValue(mockAsset);
      mockPrisma.transacao.create.mockResolvedValue(mockTransaction);
      mockPrisma.portfolio.upsert.mockResolvedValue({
        id: "portfolio-1",
        userId: mockUserId,
        cashBalance: 550,
      });

      const result = await caller.portfolio.addTransaction({
        ativoId: "asset-1",
        type: TransactionType.VENDA,
        shares: 5,
        pricePerShare: 110,
      });

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.portfolio.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: {
          userId: mockUserId,
          cashBalance: 550,
        },
        update: {
          cashBalance: {
            increment: 550,
          },
        },
      });
    });

    it("should throw error when asset not found", async () => {
      mockPrisma.ativo.findUnique.mockResolvedValue(null);

      await expect(
        caller.portfolio.addTransaction({
          ativoId: "nonexistent",
          type: TransactionType.COMPRA,
          shares: 10,
          pricePerShare: 100,
        })
      ).rejects.toThrow("Asset not found");
    });
  });

  describe("listTransactions", () => {
    it("should return user transactions with default pagination", async () => {
      const mockTransactions = [
        {
          id: "tx-1",
          userId: mockUserId,
          type: TransactionType.COMPRA,
          shares: 10,
          pricePerShare: 100,
          date: new Date("2024-01-15"),
          ativo: {
            id: "asset-1",
            ticker: "BOVA11.SA",
            name: "BOVA11",
          },
        },
      ];

      mockPrisma.transacao.findMany.mockResolvedValue(mockTransactions);

      const result = await caller.portfolio.listTransactions();

      expect(result).toEqual(mockTransactions);
      expect(mockPrisma.transacao.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { ativo: true },
        orderBy: { date: "desc" },
        take: 20,
        skip: 0,
      });
    });

    it("should filter transactions by asset", async () => {
      const mockTransactions = [
        {
          id: "tx-1",
          userId: mockUserId,
          ativoId: "asset-1",
          type: TransactionType.COMPRA,
          shares: 10,
          pricePerShare: 100,
          date: new Date("2024-01-15"),
          ativo: {
            id: "asset-1",
            ticker: "BOVA11.SA",
            name: "BOVA11",
          },
        },
      ];

      mockPrisma.transacao.findMany.mockResolvedValue(mockTransactions);

      const result = await caller.portfolio.listTransactions({
        ativoId: "asset-1",
        limit: 50,
        offset: 10,
      });

      expect(result).toEqual(mockTransactions);
      expect(mockPrisma.transacao.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, ativoId: "asset-1" },
        include: { ativo: true },
        orderBy: { date: "desc" },
        take: 50,
        skip: 10,
      });
    });
  });

  describe("getRebalancePlan", () => {
    it("should calculate rebalancing suggestions", async () => {
      const mockCesta = {
        id: "cesta-1",
        name: "Test Basket",
        userId: mockUserId,
        ativos: [
          {
            ativo: {
              id: "asset-1",
              ticker: "BOVA11.SA",
              name: "BOVA11",
              dadosHistoricos: [{ price: 100 }],
            },
            targetPercentage: 60,
          },
          {
            ativo: {
              id: "asset-2",
              ticker: "FIXA11.SA",
              name: "FIXA11",
              dadosHistoricos: [{ price: 50 }],
            },
            targetPercentage: 40,
          },
        ],
      };

      const mockPortfolio = {
        id: "portfolio-1",
        userId: mockUserId,
        cashBalance: 1000,
      };

      const mockTransactions = [
        {
          ativoId: "asset-1",
          type: TransactionType.COMPRA,
          shares: 5,
          ativo: { id: "asset-1" },
        },
      ];

      mockPrisma.cesta.findFirst.mockResolvedValue(mockCesta);
      mockPrisma.portfolio.findUnique.mockResolvedValue(mockPortfolio);
      mockPrisma.transacao.findMany.mockResolvedValue(mockTransactions);

      const result = await caller.portfolio.getRebalancePlan({
        cestaId: "cesta-1",
        targetAmount: 10000,
      });

      expect(result).toEqual({
        cestaId: "cesta-1",
        cestaName: "Test Basket",
        targetAmount: 10000,
        currentCashBalance: 1000,
        totalEstimatedCost: expect.any(Number),
        cashAfterRebalance: expect.any(Number),
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            ativo: expect.objectContaining({
              ticker: "BOVA11.SA",
            }),
            targetPercentage: 60,
            action: expect.any(String),
          }),
          expect.objectContaining({
            ativo: expect.objectContaining({
              ticker: "FIXA11.SA",
            }),
            targetPercentage: 40,
            action: expect.any(String),
          }),
        ]),
      });
    });

    it("should throw error when basket not found", async () => {
      mockPrisma.cesta.findFirst.mockResolvedValue(null);

      await expect(
        caller.portfolio.getRebalancePlan({
          cestaId: "nonexistent",
          targetAmount: 10000,
        })
      ).rejects.toThrow("Basket not found or not owned by user");
    });

    it("should throw error when portfolio not found", async () => {
      const mockCesta = {
        id: "cesta-1",
        name: "Test Basket",
        userId: mockUserId,
        ativos: [],
      };

      mockPrisma.cesta.findFirst.mockResolvedValue(mockCesta);
      mockPrisma.portfolio.findUnique.mockResolvedValue(null);

      await expect(
        caller.portfolio.getRebalancePlan({
          cestaId: "cesta-1",
          targetAmount: 10000,
        })
      ).rejects.toThrow("Portfolio not found");
    });
  });
});