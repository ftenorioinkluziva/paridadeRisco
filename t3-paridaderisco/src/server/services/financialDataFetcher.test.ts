import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { FinancialDataFetcher } from "./financialDataFetcher";
import { prisma } from "~/lib/prisma";
import { AssetCalculationType } from "@prisma/client";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// Mock Prisma
vi.mock("~/lib/prisma", () => ({
  prisma: {
    dadoHistorico: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    ativo: {
      upsert: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);

describe("FinancialDataFetcher", () => {
  let fetcher: FinancialDataFetcher;

  beforeEach(() => {
    vi.clearAllMocks();
    fetcher = new FinancialDataFetcher();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchYahooFinanceData", () => {
    it("should fetch and parse Yahoo Finance data correctly", async () => {
      const mockYahooResponse = {
        data: {
          chart: {
            result: [
              {
                meta: {
                  symbol: "BOVA11.SA",
                  currency: "BRL",
                  regularMarketPrice: 105.50,
                },
                timestamp: [1705363200, 1705449600], // Jan 15, 16 2024
                indicators: {
                  quote: [
                    {
                      open: [100.0, 105.0],
                      high: [102.0, 107.0],
                      low: [99.0, 104.0],
                      close: [101.0, 105.5],
                      volume: [1000000, 1100000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      const result = await fetcher.fetchYahooFinanceData("BOVA11.SA");

      expect(result).toEqual({
        ticker: "BOVA11.SA",
        name: "BOVA11 (Ibovespa)",
        type: "ETF",
        calculationType: AssetCalculationType.PRECO,
        currentPrice: 105.5,
        historicalData: [
          {
            date: new Date("2024-01-15T12:00:00.000Z"),
            price: 101.0,
            percentageChange: null,
          },
          {
            date: new Date("2024-01-16T12:00:00.000Z"),
            price: 105.5,
            percentageChange: expect.closeTo(4.46, 2),
          },
        ],
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("BOVA11.SA"),
        expect.objectContaining({
          params: expect.objectContaining({
            interval: "1d",
            events: "history",
          }),
          timeout: 30000,
        })
      );
    });

    it("should return null when no data is available", async () => {
      const mockEmptyResponse = {
        data: {
          chart: {
            result: [],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockEmptyResponse);

      const result = await fetcher.fetchYahooFinanceData("INVALID.SA");

      expect(result).toBeNull();
    });

    it("should handle network errors gracefully", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      const result = await fetcher.fetchYahooFinanceData("BOVA11.SA");

      expect(result).toBeNull();
    });

    it("should handle missing timestamps", async () => {
      const mockBadResponse = {
        data: {
          chart: {
            result: [
              {
                meta: { symbol: "BOVA11.SA" },
                timestamp: [],
                indicators: { quote: [{}] },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockBadResponse);

      const result = await fetcher.fetchYahooFinanceData("BOVA11.SA");

      expect(result).toBeNull();
    });
  });

  describe("fetchBCBData", () => {
    it("should fetch and process BCB data correctly", async () => {
      const mockBCBResponse = {
        data: {
          value: [
            { data: "15/01/2024", valor: "0.045" },
            { data: "16/01/2024", valor: "0.042" },
            { data: "17/01/2024", valor: "0.041" },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockBCBResponse);

      const result = await fetcher.fetchBCBData(12);

      expect(result).toEqual({
        ticker: "CDI",
        name: "CDI",
        type: "Index",
        calculationType: AssetCalculationType.PERCENTUAL,
        currentPrice: expect.any(Number),
        historicalData: expect.arrayContaining([
          expect.objectContaining({
            date: new Date("2024-01-15"),
            price: expect.any(Number),
            percentageChange: null,
          }),
          expect.objectContaining({
            date: new Date("2024-01-16"),
            price: expect.any(Number),
            percentageChange: expect.any(Number),
          }),
          expect.objectContaining({
            date: new Date("2024-01-17"),
            price: expect.any(Number),
            percentageChange: expect.any(Number),
          }),
        ]),
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/12/dados"),
        expect.objectContaining({
          params: expect.objectContaining({
            formato: "json",
          }),
          timeout: 30000,
        })
      );
    });

    it("should handle cumulative CDI index calculation", async () => {
      const mockBCBResponse = {
        data: {
          value: [
            { data: "15/01/2024", valor: "0.04" }, // 0.04% daily rate
            { data: "16/01/2024", valor: "0.04" }, // 0.04% daily rate
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockBCBResponse);

      const result = await fetcher.fetchBCBData(12);

      expect(result?.historicalData).toHaveLength(2);
      
      const firstDay = result?.historicalData[0];
      const secondDay = result?.historicalData[1];

      expect(firstDay?.price).toBeCloseTo(100.04, 2); // 100 * (1 + 0.04/100)
      expect(secondDay?.price).toBeCloseTo(100.08, 2); // 100.04 * (1 + 0.04/100)
    });

    it("should return null when no BCB data is available", async () => {
      const mockEmptyResponse = {
        data: {
          value: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockEmptyResponse);

      const result = await fetcher.fetchBCBData(12);

      expect(result).toBeNull();
    });

    it("should handle invalid BCB data gracefully", async () => {
      const mockInvalidResponse = {
        data: {
          value: [
            { data: "invalid-date", valor: "not-a-number" },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockInvalidResponse);

      const result = await fetcher.fetchBCBData(12);

      expect(result?.historicalData).toHaveLength(0);
    });
  });

  describe("getLastUpdateDate", () => {
    it("should return the last update date for a ticker", async () => {
      const mockDate = new Date("2024-01-15");
      mockPrisma.dadoHistorico.findFirst.mockResolvedValue({
        date: mockDate,
      });

      const result = await fetcher.getLastUpdateDate("BOVA11.SA");

      expect(result).toEqual(mockDate);
      expect(mockPrisma.dadoHistorico.findFirst).toHaveBeenCalledWith({
        where: { ativo: { ticker: "BOVA11.SA" } },
        orderBy: { date: "desc" },
        select: { date: true },
      });
    });

    it("should return null when no records exist", async () => {
      mockPrisma.dadoHistorico.findFirst.mockResolvedValue(null);

      const result = await fetcher.getLastUpdateDate("NEW_TICKER");

      expect(result).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.dadoHistorico.findFirst.mockRejectedValue(new Error("Database error"));

      const result = await fetcher.getLastUpdateDate("BOVA11.SA");

      expect(result).toBeNull();
    });
  });

  describe("upsertAsset", () => {
    it("should upsert asset and historical data", async () => {
      const mockAssetData = {
        ticker: "BOVA11.SA",
        name: "BOVA11 (Ibovespa)",
        type: "ETF",
        calculationType: AssetCalculationType.PRECO,
        currentPrice: 105.5,
        historicalData: [
          {
            date: new Date("2024-01-15"),
            price: 100.0,
            percentageChange: null,
          },
          {
            date: new Date("2024-01-16"),
            price: 105.5,
            percentageChange: 5.5,
          },
        ],
      };

      const mockAsset = {
        id: "asset-1",
        ticker: "BOVA11.SA",
        name: "BOVA11 (Ibovespa)",
        type: "ETF",
        calculationType: AssetCalculationType.PRECO,
      };

      mockPrisma.ativo.upsert.mockResolvedValue(mockAsset);
      mockPrisma.dadoHistorico.upsert.mockResolvedValue({});

      await fetcher.upsertAsset(mockAssetData);

      expect(mockPrisma.ativo.upsert).toHaveBeenCalledWith({
        where: { ticker: "BOVA11.SA" },
        update: {
          name: "BOVA11 (Ibovespa)",
          type: "ETF",
          calculationType: AssetCalculationType.PRECO,
        },
        create: {
          ticker: "BOVA11.SA",
          name: "BOVA11 (Ibovespa)",
          type: "ETF",
          calculationType: AssetCalculationType.PRECO,
        },
      });

      expect(mockPrisma.dadoHistorico.upsert).toHaveBeenCalledTimes(2);
    });

    it("should handle large datasets in batches", async () => {
      const largeHistoricalData = Array.from({ length: 250 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        price: 100 + i,
        percentageChange: i > 0 ? 1.0 : null,
      }));

      const mockAssetData = {
        ticker: "BOVA11.SA",
        name: "BOVA11 (Ibovespa)",
        type: "ETF",
        calculationType: AssetCalculationType.PRECO,
        currentPrice: 350,
        historicalData: largeHistoricalData,
      };

      const mockAsset = { id: "asset-1" };
      mockPrisma.ativo.upsert.mockResolvedValue(mockAsset);
      mockPrisma.dadoHistorico.upsert.mockResolvedValue({});

      await fetcher.upsertAsset(mockAssetData);

      // Should process in 3 batches (100, 100, 50)
      expect(mockPrisma.dadoHistorico.upsert).toHaveBeenCalledTimes(250);
    });

    it("should handle precision correctly for prices", async () => {
      const mockAssetData = {
        ticker: "TEST",
        name: "Test Asset",
        type: "ETF",
        calculationType: AssetCalculationType.PRECO,
        currentPrice: 123.456789,
        historicalData: [
          {
            date: new Date("2024-01-15"),
            price: 123.456789,
            percentageChange: 1.234567,
          },
        ],
      };

      const mockAsset = { id: "asset-1" };
      mockPrisma.ativo.upsert.mockResolvedValue(mockAsset);
      mockPrisma.dadoHistorico.upsert.mockResolvedValue({});

      await fetcher.upsertAsset(mockAssetData);

      expect(mockPrisma.dadoHistorico.upsert).toHaveBeenCalledWith({
        where: {
          ativoId_date: {
            ativoId: "asset-1",
            date: expect.any(Date),
          },
        },
        update: {
          price: 123.4568, // Rounded to 4 decimal places
          percentageChange: 1.2346, // Rounded to 4 decimal places
        },
        create: {
          ativoId: "asset-1",
          date: expect.any(Date),
          price: 123.4568,
          percentageChange: 1.2346,
        },
      });
    });
  });

  describe("updateSpecificAsset", () => {
    it("should update Yahoo Finance asset", async () => {
      const mockYahooResponse = {
        data: {
          chart: {
            result: [
              {
                meta: { symbol: "BOVA11.SA" },
                timestamp: [1705363200],
                indicators: {
                  quote: [
                    {
                      open: [100.0],
                      high: [102.0],
                      low: [99.0],
                      close: [101.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockYahooResponse);
      mockPrisma.ativo.upsert.mockResolvedValue({ id: "asset-1" });
      mockPrisma.dadoHistorico.upsert.mockResolvedValue({});

      await fetcher.updateSpecificAsset("BOVA11.SA");

      expect(mockPrisma.ativo.upsert).toHaveBeenCalled();
      expect(mockPrisma.dadoHistorico.upsert).toHaveBeenCalled();
    });

    it("should update CDI data from BCB", async () => {
      const mockBCBResponse = {
        data: {
          value: [
            { data: "15/01/2024", valor: "0.045" },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockBCBResponse);
      mockPrisma.ativo.upsert.mockResolvedValue({ id: "asset-cdi" });
      mockPrisma.dadoHistorico.upsert.mockResolvedValue({});

      await fetcher.updateSpecificAsset("CDI");

      expect(mockPrisma.ativo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ticker: "CDI" },
        })
      );
    });

    it("should throw error when update fails", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      await expect(fetcher.updateSpecificAsset("BOVA11.SA")).rejects.toThrow("Network error");
    });
  });

  describe("updateAllAssets", () => {
    it("should update all default assets with incremental updates", async () => {
      // Mock last update dates for incremental updates
      mockPrisma.dadoHistorico.findFirst
        .mockResolvedValueOnce({ date: new Date("2024-01-10") }) // BOVA11.SA
        .mockResolvedValueOnce(null) // XFIX11.SA - no previous data
        .mockResolvedValueOnce({ date: new Date("2024-01-12") }); // Other assets

      // Mock successful Yahoo Finance responses
      const mockYahooResponse = {
        data: {
          chart: {
            result: [
              {
                meta: { symbol: "BOVA11.SA" },
                timestamp: [1705363200],
                indicators: {
                  quote: [
                    {
                      open: [100.0],
                      high: [102.0],
                      low: [99.0],
                      close: [101.0],
                      volume: [1000000],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      const mockBCBResponse = {
        data: {
          value: [
            { data: "15/01/2024", valor: "0.045" },
          ],
        },
      };

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes("bcb.gov.br")) {
          return Promise.resolve(mockBCBResponse);
        }
        return Promise.resolve(mockYahooResponse);
      });

      mockPrisma.ativo.upsert.mockResolvedValue({ id: "asset-1" });
      mockPrisma.dadoHistorico.upsert.mockResolvedValue({});

      await fetcher.updateAllAssets(true);

      // Should call Yahoo Finance for ETFs and BCB for CDI
      expect(mockedAxios.get).toHaveBeenCalledTimes(7); // 6 ETFs/Currency + 1 CDI
    });

    it("should skip assets that are already up to date", async () => {
      const today = new Date();
      mockPrisma.dadoHistorico.findFirst.mockResolvedValue({ date: today });

      await fetcher.updateAllAssets(true);

      // Should not make any API calls since all assets are up to date
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });
});