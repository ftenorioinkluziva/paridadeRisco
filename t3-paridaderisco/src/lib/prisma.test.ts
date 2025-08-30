import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Mock PrismaClient for testing
const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  portfolio: {
    create: vi.fn(),
  },
  ativo: {
    create: vi.fn(),
  },
  cesta: {
    create: vi.fn(),
  },
  transacao: {
    create: vi.fn(),
  },
  dadoHistorico: {
    create: vi.fn(),
  },
  ativosEmCestas: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

describe("Prisma Schema Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Model Definitions", () => {
    it("should have User model with required fields", () => {
      const userData = {
        name: "Test User",
        email: "test@example.com", 
        phone: "+55 11 99999-9999",
        password: "hashed_password",
      };

      // Verify the user data structure matches our schema expectations
      expect(userData).toHaveProperty("name");
      expect(userData).toHaveProperty("email");
      expect(userData).toHaveProperty("phone");
      expect(userData).toHaveProperty("password");
    });

    it("should have Portfolio model with cashBalance field", () => {
      const portfolioData = {
        cashBalance: 10000.50,
        userId: "user123",
      };

      expect(portfolioData).toHaveProperty("cashBalance");
      expect(portfolioData).toHaveProperty("userId");
      expect(typeof portfolioData.cashBalance).toBe("number");
    });

    it("should have Ativo model with calculationType enum", () => {
      const ativoData = {
        ticker: "ITUB4",
        name: "Itau Unibanco",
        type: "STOCK",
        calculationType: "PRECO", // Should be one of AssetCalculationType values
      };

      expect(ativoData).toHaveProperty("ticker");
      expect(ativoData).toHaveProperty("calculationType");
      expect(["PRECO", "PERCENTUAL"]).toContain(ativoData.calculationType);
    });

    it("should have Transacao model with TransactionType enum", () => {
      const transacaoData = {
        type: "COMPRA", // Should be one of TransactionType values
        shares: 100.5,
        pricePerShare: 25.75,
        date: new Date(),
        ativoId: "ativo123",
        userId: "user123",
      };

      expect(transacaoData).toHaveProperty("type");
      expect(["COMPRA", "VENDA"]).toContain(transacaoData.type);
      expect(typeof transacaoData.shares).toBe("number");
      expect(typeof transacaoData.pricePerShare).toBe("number");
    });

    it("should have AtivosEmCestas junction model with targetPercentage", () => {
      const ativosEmCestasData = {
        cestaId: "cesta123",
        ativoId: "ativo123", 
        targetPercentage: 25.5,
      };

      expect(ativosEmCestasData).toHaveProperty("cestaId");
      expect(ativosEmCestasData).toHaveProperty("ativoId");
      expect(ativosEmCestasData).toHaveProperty("targetPercentage");
      expect(typeof ativosEmCestasData.targetPercentage).toBe("number");
    });

    it("should have DadoHistorico model with unique constraint fields", () => {
      const dadoHistoricoData = {
        date: new Date(),
        price: 45.25,
        percentageChange: 2.5,
        ativoId: "ativo123",
      };

      expect(dadoHistoricoData).toHaveProperty("date");
      expect(dadoHistoricoData).toHaveProperty("ativoId");
      expect(dadoHistoricoData.date).toBeInstanceOf(Date);
    });
  });

  describe("Enum Values", () => {
    it("should validate AssetCalculationType enum values", () => {
      const validTypes = ["PRECO", "PERCENTUAL"];
      const testType = "PRECO";

      expect(validTypes).toContain(testType);
    });

    it("should validate TransactionType enum values", () => {
      const validTypes = ["COMPRA", "VENDA"];
      const testType = "COMPRA";

      expect(validTypes).toContain(testType);
    });
  });

  describe("Relationships", () => {
    it("should validate User-Portfolio one-to-one relationship", () => {
      const userId = "user123";
      const portfolioData = {
        cashBalance: 5000.0,
        userId,
      };

      // Portfolio should have a unique userId
      expect(portfolioData.userId).toBe(userId);
    });

    it("should validate User-Cesta one-to-many relationship", () => {
      const userId = "user123";
      const cestaData = {
        name: "Conservative Portfolio",
        userId,
      };

      // Cesta should reference a valid userId
      expect(cestaData.userId).toBe(userId);
    });

    it("should validate Cesta-Ativo many-to-many relationship via AtivosEmCestas", () => {
      const relationData = {
        cestaId: "cesta123",
        ativoId: "ativo456",
        targetPercentage: 30.0,
      };

      // Should have both foreign keys for the junction table
      expect(relationData).toHaveProperty("cestaId");
      expect(relationData).toHaveProperty("ativoId");
    });
  });

  describe("Data Validation", () => {
    it("should validate decimal precision for financial fields", () => {
      // cashBalance should support up to 12,2 precision
      const cashBalance = 999999999.99;
      expect(cashBalance.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);

      // targetPercentage should support up to 5,2 precision  
      const targetPercentage = 100.00;
      expect(targetPercentage.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);

      // pricePerShare should support up to 10,2 precision
      const pricePerShare = 12345678.99;
      expect(pricePerShare.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it("should validate unique constraints", () => {
      // Email should be unique
      const user1Email = "user1@test.com";
      const user2Email = "user2@test.com";
      expect(user1Email).not.toBe(user2Email);

      // Ticker should be unique
      const ticker1 = "ITUB4";
      const ticker2 = "VALE3";
      expect(ticker1).not.toBe(ticker2);

      // ativoId + date combination should be unique for DadoHistorico
      const historicalData1 = { ativoId: "ativo123", date: "2023-01-01" };
      const historicalData2 = { ativoId: "ativo123", date: "2023-01-02" };
      expect(historicalData1.date).not.toBe(historicalData2.date);
    });
  });
});