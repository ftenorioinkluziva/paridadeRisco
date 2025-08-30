import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/lib/prisma";

// Mock Prisma
vi.mock("~/lib/prisma", () => ({
  prisma: {
    cesta: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    ativo: {
      findMany: vi.fn(),
    },
    ativosEmCestas: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
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

describe("Cesta Router", () => {
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

  describe("list", () => {
    it("should return user's baskets with assets", async () => {
      const mockCestas = [
        {
          id: "cesta-1",
          name: "Conservative Portfolio",
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
        },
      ];

      mockPrisma.cesta.findMany.mockResolvedValue(mockCestas);

      const result = await caller.cesta.list();

      expect(result).toEqual(mockCestas);
      expect(mockPrisma.cesta.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
        orderBy: { name: "asc" },
      });
    });

    it("should return empty array when user has no baskets", async () => {
      mockPrisma.cesta.findMany.mockResolvedValue([]);

      const result = await caller.cesta.list();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should return basket with validation status", async () => {
      const mockCesta = {
        id: "cesta-1",
        name: "Balanced Portfolio",
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

      mockPrisma.cesta.findFirst.mockResolvedValue(mockCesta);

      const result = await caller.cesta.getById({ id: "cesta-1" });

      expect(result).toEqual({
        ...mockCesta,
        totalPercentage: 100,
        isValid: true,
      });

      expect(mockPrisma.cesta.findFirst).toHaveBeenCalledWith({
        where: { id: "cesta-1", userId: mockUserId },
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

    it("should return invalid basket when percentages don't add to 100", async () => {
      const mockCesta = {
        id: "cesta-1",
        name: "Invalid Portfolio",
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
            targetPercentage: 30, // Total = 90%
          },
        ],
      };

      mockPrisma.cesta.findFirst.mockResolvedValue(mockCesta);

      const result = await caller.cesta.getById({ id: "cesta-1" });

      expect(result).toEqual({
        ...mockCesta,
        totalPercentage: 90,
        isValid: false,
      });
    });

    it("should throw error when basket not found", async () => {
      mockPrisma.cesta.findFirst.mockResolvedValue(null);

      await expect(caller.cesta.getById({ id: "nonexistent" })).rejects.toThrow(
        "Basket not found or not owned by user"
      );
    });
  });

  describe("create", () => {
    it("should create a valid basket", async () => {
      const mockAssets = [
        { id: "asset-1" },
        { id: "asset-2" },
      ];

      const mockCreatedCesta = {
        id: "cesta-1",
        name: "New Portfolio",
        userId: mockUserId,
        ativos: [
          {
            ativo: {
              id: "asset-1",
              ticker: "BOVA11.SA",
              name: "BOVA11",
              dadosHistoricos: [{ price: 100 }],
            },
            targetPercentage: 70,
          },
          {
            ativo: {
              id: "asset-2",
              ticker: "FIXA11.SA",
              name: "FIXA11",
              dadosHistoricos: [{ price: 50 }],
            },
            targetPercentage: 30,
          },
        ],
      };

      mockPrisma.ativo.findMany.mockResolvedValue(mockAssets);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          cesta: {
            create: vi.fn().mockResolvedValue({ id: "cesta-1", name: "New Portfolio", userId: mockUserId }),
            findUniqueOrThrow: vi.fn().mockResolvedValue(mockCreatedCesta),
          },
          ativosEmCestas: {
            createMany: vi.fn(),
          },
        });
      });

      const result = await caller.cesta.create({
        name: "New Portfolio",
        ativos: [
          { ativoId: "asset-1", targetPercentage: 70 },
          { ativoId: "asset-2", targetPercentage: 30 },
        ],
      });

      expect(result).toEqual(mockCreatedCesta);
    });

    it("should throw error when percentages don't add to 100", async () => {
      await expect(
        caller.cesta.create({
          name: "Invalid Portfolio",
          ativos: [
            { ativoId: "asset-1", targetPercentage: 60 },
            { ativoId: "asset-2", targetPercentage: 30 }, // Total = 90%
          ],
        })
      ).rejects.toThrow("Target percentages must add up to 100%");
    });

    it("should throw error when asset doesn't exist", async () => {
      mockPrisma.ativo.findMany.mockResolvedValue([{ id: "asset-1" }]); // Only one asset exists

      await expect(
        caller.cesta.create({
          name: "Invalid Portfolio",
          ativos: [
            { ativoId: "asset-1", targetPercentage: 50 },
            { ativoId: "nonexistent", targetPercentage: 50 },
          ],
        })
      ).rejects.toThrow("Invalid asset IDs: nonexistent");
    });

    it("should throw error when duplicate assets are provided", async () => {
      // Mock that the assets exist
      mockPrisma.ativo.findMany.mockResolvedValue([{ id: "asset-1" }, { id: "asset-1" }]);

      await expect(
        caller.cesta.create({
          name: "Invalid Portfolio",
          ativos: [
            { ativoId: "asset-1", targetPercentage: 50 },
            { ativoId: "asset-1", targetPercentage: 50 },
          ],
        })
      ).rejects.toThrow("Duplicate assets are not allowed in a basket");
    });

    it("should handle small floating point errors in percentages", async () => {
      const mockAssets = [
        { id: "asset-1" },
        { id: "asset-2" },
        { id: "asset-3" },
      ];

      const mockCreatedCesta = {
        id: "cesta-1",
        name: "Float Test",
        userId: mockUserId,
        ativos: [],
      };

      mockPrisma.ativo.findMany.mockResolvedValue(mockAssets);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          cesta: {
            create: vi.fn().mockResolvedValue({ id: "cesta-1" }),
            findUniqueOrThrow: vi.fn().mockResolvedValue(mockCreatedCesta),
          },
          ativosEmCestas: {
            createMany: vi.fn(),
          },
        });
      });

      // Percentages that add up to 100.005 (within acceptable tolerance)
      const result = await caller.cesta.create({
        name: "Float Test",
        ativos: [
          { ativoId: "asset-1", targetPercentage: 33.335 },
          { ativoId: "asset-2", targetPercentage: 33.335 },
          { ativoId: "asset-3", targetPercentage: 33.335 },
        ],
      });

      expect(result).toEqual(mockCreatedCesta);
    });
  });

  describe("update", () => {
    it("should update basket name", async () => {
      const mockExistingCesta = {
        id: "cesta-1",
        name: "Old Name",
        userId: mockUserId,
      };

      const mockUpdatedCesta = {
        id: "cesta-1",
        name: "New Name",
        userId: mockUserId,
        ativos: [],
      };

      mockPrisma.cesta.findFirst.mockResolvedValue(mockExistingCesta);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          cesta: {
            update: vi.fn(),
            findUniqueOrThrow: vi.fn().mockResolvedValue(mockUpdatedCesta),
          },
        });
      });

      const result = await caller.cesta.update({
        id: "cesta-1",
        name: "New Name",
      });

      expect(result).toEqual(mockUpdatedCesta);
    });

    it("should update basket assets", async () => {
      const mockExistingCesta = {
        id: "cesta-1",
        name: "Test Portfolio",
        userId: mockUserId,
      };

      const mockUpdatedCesta = {
        id: "cesta-1",
        name: "Test Portfolio",
        userId: mockUserId,
        ativos: [],
      };

      const mockAssets = [
        { id: "asset-1" },
        { id: "asset-2" },
      ];

      mockPrisma.cesta.findFirst.mockResolvedValue(mockExistingCesta);
      mockPrisma.ativo.findMany.mockResolvedValue(mockAssets);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          cesta: {
            findUniqueOrThrow: vi.fn().mockResolvedValue(mockUpdatedCesta),
          },
          ativosEmCestas: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        });
      });

      const result = await caller.cesta.update({
        id: "cesta-1",
        ativos: [
          { ativoId: "asset-1", targetPercentage: 60 },
          { ativoId: "asset-2", targetPercentage: 40 },
        ],
      });

      expect(result).toEqual(mockUpdatedCesta);
    });

    it("should throw error when basket not found", async () => {
      mockPrisma.cesta.findFirst.mockResolvedValue(null);

      await expect(
        caller.cesta.update({
          id: "nonexistent",
          name: "New Name",
        })
      ).rejects.toThrow("Basket not found or not owned by user");
    });
  });

  describe("delete", () => {
    it("should delete existing basket", async () => {
      const mockExistingCesta = {
        id: "cesta-1",
        name: "To Delete",
        userId: mockUserId,
      };

      mockPrisma.cesta.findFirst.mockResolvedValue(mockExistingCesta);
      mockPrisma.cesta.delete.mockResolvedValue(mockExistingCesta);

      const result = await caller.cesta.delete({ id: "cesta-1" });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.cesta.delete).toHaveBeenCalledWith({
        where: { id: "cesta-1" },
      });
    });

    it("should throw error when basket not found", async () => {
      mockPrisma.cesta.findFirst.mockResolvedValue(null);

      await expect(caller.cesta.delete({ id: "nonexistent" })).rejects.toThrow(
        "Basket not found or not owned by user"
      );
    });
  });
});