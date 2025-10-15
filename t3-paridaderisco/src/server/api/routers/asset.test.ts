import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/lib/prisma";

// Mock Prisma
vi.mock("~/lib/prisma", () => ({
  prisma: {
    ativo: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    dadoHistorico: {
      findMany: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);

describe("Asset Router", () => {
  let caller: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const ctx = await createTRPCContext({
      req: {
        headers: { get: vi.fn().mockReturnValue(null) },
      } as any,
      res: {} as any,
    });
    
    caller = appRouter.createCaller(ctx);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return all assets ordered by ticker", async () => {
      const mockAssets = [
        {
          id: "1",
          ticker: "BOVA11.SA",
          name: "BOVA11 (Ibovespa)",
          type: "ETF",
          calculationType: "PRECO",
        },
        {
          id: "2", 
          ticker: "CDI",
          name: "CDI",
          type: "Index",
          calculationType: "PERCENTUAL",
        },
      ];

      mockPrisma.ativo.findMany.mockResolvedValue(mockAssets);

      const result = await caller.asset.list();

      expect(result).toEqual(mockAssets);
      expect(mockPrisma.ativo.findMany).toHaveBeenCalledWith({
        orderBy: {
          ticker: "asc",
        },
      });
    });

    it("should return empty array when no assets exist", async () => {
      mockPrisma.ativo.findMany.mockResolvedValue([]);

      const result = await caller.asset.list();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should return asset with historical data by id", async () => {
      const mockAsset = {
        id: "1",
        ticker: "BOVA11.SA",
        name: "BOVA11 (Ibovespa)",
        type: "ETF",
        calculationType: "PRECO",
        dadosHistoricos: [
          {
            id: "hist1",
            date: new Date("2024-01-15"),
            price: 100.50,
            percentageChange: 1.2,
          },
          {
            id: "hist2", 
            date: new Date("2024-01-14"),
            price: 99.30,
            percentageChange: -0.5,
          },
        ],
      };

      mockPrisma.ativo.findUnique.mockResolvedValue(mockAsset);

      const result = await caller.asset.getById({ id: "1" });

      expect(result).toEqual(mockAsset);
      expect(mockPrisma.ativo.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          dadosHistoricos: {
            orderBy: { date: "desc" },
            take: 30,
          },
        },
      });
    });

    it("should throw error when asset not found", async () => {
      mockPrisma.ativo.findUnique.mockResolvedValue(null);

      await expect(caller.asset.getById({ id: "nonexistent" })).rejects.toThrow("Asset not found");
    });
  });

  describe("getByTicker", () => {
    it("should return asset with latest price by ticker", async () => {
      const mockAsset = {
        id: "1",
        ticker: "BOVA11.SA",
        name: "BOVA11 (Ibovespa)",
        type: "ETF",
        calculationType: "PRECO",
        dadosHistoricos: [
          {
            id: "hist1",
            date: new Date("2024-01-15"),
            price: 100.50,
            percentageChange: 1.2,
          },
        ],
      };

      mockPrisma.ativo.findUnique.mockResolvedValue(mockAsset);

      const result = await caller.asset.getByTicker({ ticker: "BOVA11.SA" });

      expect(result).toEqual(mockAsset);
      expect(mockPrisma.ativo.findUnique).toHaveBeenCalledWith({
        where: { ticker: "BOVA11.SA" },
        include: {
          dadosHistoricos: {
            orderBy: { date: "desc" },
            take: 1,
          },
        },
      });
    });

    it("should throw error when asset not found by ticker", async () => {
      mockPrisma.ativo.findUnique.mockResolvedValue(null);

      await expect(caller.asset.getByTicker({ ticker: "INVALID" })).rejects.toThrow("Asset not found");
    });
  });

  describe("getHistory", () => {
    it("should return historical data for an asset with default limit", async () => {
      const mockHistoricalData = [
        {
          id: "hist1",
          date: new Date("2024-01-15"),
          price: 100.50,
          percentageChange: 1.2,
        },
        {
          id: "hist2",
          date: new Date("2024-01-14"),
          price: 99.30,
          percentageChange: -0.5,
        },
      ];

      mockPrisma.dadoHistorico.findMany.mockResolvedValue(mockHistoricalData);

      const result = await caller.asset.getHistory({ id: "1" });

      expect(result).toEqual(mockHistoricalData);
      expect(mockPrisma.dadoHistorico.findMany).toHaveBeenCalledWith({
        where: { ativoId: "1" },
        orderBy: { date: "desc" },
        take: 100,
        select: {
          id: true,
          date: true,
          price: true,
          percentageChange: true,
        },
      });
    });

    it("should return historical data with date range filter", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockHistoricalData = [
        {
          id: "hist1",
          date: new Date("2024-01-15"),
          price: 100.50,
          percentageChange: 1.2,
        },
      ];

      mockPrisma.dadoHistorico.findMany.mockResolvedValue(mockHistoricalData);

      const result = await caller.asset.getHistory({ 
        id: "1", 
        startDate,
        endDate,
        limit: 50,
      });

      expect(result).toEqual(mockHistoricalData);
      expect(mockPrisma.dadoHistorico.findMany).toHaveBeenCalledWith({
        where: {
          ativoId: "1",
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "desc" },
        take: 50,
        select: {
          id: true,
          date: true,
          price: true,
          percentageChange: true,
        },
      });
    });

    it("should apply limit constraints", async () => {
      mockPrisma.dadoHistorico.findMany.mockResolvedValue([]);

      // Test minimum limit
      await caller.asset.getHistory({ id: "1", limit: 1 });
      expect(mockPrisma.dadoHistorico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );

      // Test maximum limit
      await caller.asset.getHistory({ id: "1", limit: 1000 });
      expect(mockPrisma.dadoHistorico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1000 })
      );
    });

    it("should return empty array when no historical data found", async () => {
      mockPrisma.dadoHistorico.findMany.mockResolvedValue([]);

      const result = await caller.asset.getHistory({ id: "1" });

      expect(result).toEqual([]);
    });
  });
});